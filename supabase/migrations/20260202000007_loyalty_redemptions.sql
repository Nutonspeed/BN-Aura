CREATE TABLE IF NOT EXISTS loyalty_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES loyalty_rewards(id) ON DELETE RESTRICT,
  points_cost INTEGER NOT NULL,
  code TEXT NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'issued',
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  applied_at TIMESTAMPTZ,
  applied_pos_transaction_id UUID REFERENCES pos_transactions(id) ON DELETE SET NULL,
  event_key TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  CONSTRAINT valid_redemption_status CHECK (status IN ('issued', 'applied', 'cancelled', 'expired'))
);

CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_customer ON loyalty_redemptions(customer_id, issued_at DESC);
CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_clinic_status ON loyalty_redemptions(clinic_id, status, issued_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_loyalty_redemptions_event_key_unique
ON loyalty_redemptions(event_key)
WHERE event_key IS NOT NULL;

ALTER TABLE loyalty_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view their redemptions" ON loyalty_redemptions;
CREATE POLICY "Customers can view their redemptions" ON loyalty_redemptions
  FOR SELECT USING (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage loyalty redemptions in their clinic" ON loyalty_redemptions;
CREATE POLICY "Users can manage loyalty redemptions in their clinic" ON loyalty_redemptions
  FOR ALL USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_staff WHERE user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION redeem_loyalty_reward_v2(
  p_customer_id uuid,
  p_clinic_id uuid,
  p_reward_id uuid,
  p_event_key text
)
RETURNS TABLE (
  success boolean,
  message text,
  available_points integer,
  redemption_code text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_points_cost integer;
  v_is_active boolean;
  v_max_redemptions integer;
  v_current_redemptions integer;
  v_available_points integer;
  v_code text;
BEGIN
  IF p_event_key IS NULL OR length(p_event_key) = 0 THEN
    RETURN QUERY SELECT false, 'Missing event_key', 0, NULL;
    RETURN;
  END IF;

  SELECT points_cost, is_active, max_redemptions, current_redemptions
  INTO v_points_cost, v_is_active, v_max_redemptions, v_current_redemptions
  FROM loyalty_rewards
  WHERE id = p_reward_id AND clinic_id = p_clinic_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Reward not found', 0, NULL;
    RETURN;
  END IF;

  IF v_is_active IS NOT TRUE THEN
    RETURN QUERY SELECT false, 'Reward not active', 0, NULL;
    RETURN;
  END IF;

  IF v_max_redemptions IS NOT NULL AND v_current_redemptions >= v_max_redemptions THEN
    RETURN QUERY SELECT false, 'Reward out of stock', 0, NULL;
    RETURN;
  END IF;

  SELECT available_points
  INTO v_available_points
  FROM loyalty_profiles
  WHERE customer_id = p_customer_id AND clinic_id = p_clinic_id
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO loyalty_profiles (customer_id, clinic_id, referral_code)
    VALUES (p_customer_id, p_clinic_id, 'BN' || substr(md5(random()::text || clock_timestamp()::text), 1, 8));

    SELECT available_points
    INTO v_available_points
    FROM loyalty_profiles
    WHERE customer_id = p_customer_id AND clinic_id = p_clinic_id
    FOR UPDATE;
  END IF;

  IF v_available_points < v_points_cost THEN
    RETURN QUERY SELECT false, 'Insufficient points', v_available_points, NULL;
    RETURN;
  END IF;

  BEGIN
    INSERT INTO point_transactions (customer_id, clinic_id, type, amount, description, reward_id, event_key)
    VALUES (p_customer_id, p_clinic_id, 'redeemed', v_points_cost, 'Redeemed reward', p_reward_id, p_event_key);
  EXCEPTION WHEN unique_violation THEN
    SELECT code, available_points
    INTO v_code, v_available_points
    FROM loyalty_redemptions lr
    JOIN loyalty_profiles lp ON lp.customer_id = lr.customer_id AND lp.clinic_id = lr.clinic_id
    WHERE lr.event_key = p_event_key
    LIMIT 1;

    RETURN QUERY SELECT true, 'Already processed', v_available_points, v_code;
    RETURN;
  END;

  v_code := 'RWD-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));

  BEGIN
    INSERT INTO loyalty_redemptions (customer_id, clinic_id, reward_id, points_cost, code, status, event_key)
    VALUES (p_customer_id, p_clinic_id, p_reward_id, v_points_cost, v_code, 'issued', p_event_key);
  EXCEPTION WHEN unique_violation THEN
    SELECT code INTO v_code FROM loyalty_redemptions WHERE event_key = p_event_key LIMIT 1;
  END;

  UPDATE loyalty_profiles
  SET available_points = available_points - v_points_cost,
      updated_at = now()
  WHERE customer_id = p_customer_id AND clinic_id = p_clinic_id
  RETURNING available_points INTO v_available_points;

  UPDATE loyalty_rewards
  SET current_redemptions = current_redemptions + 1
  WHERE id = p_reward_id AND clinic_id = p_clinic_id;

  RETURN QUERY SELECT true, 'Redeemed', v_available_points, v_code;
END;
$$;
