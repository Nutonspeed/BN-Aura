-- Apply a loyalty redemption code to a POS transaction (atomic)

CREATE OR REPLACE FUNCTION apply_loyalty_redemption_to_pos(
  p_code text,
  p_pos_transaction_id uuid,
  p_clinic_id uuid
)
RETURNS TABLE (
  success boolean,
  message text,
  discount_amount numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_redemption_id uuid;
  v_customer_id uuid;
  v_reward_id uuid;
  v_status text;
  v_reward_type text;
  v_reward_value numeric;
  v_subtotal numeric;
  v_existing_discount numeric;
  v_tax numeric;
  v_discount numeric;
BEGIN
  IF p_code IS NULL OR length(p_code) = 0 THEN
    RETURN QUERY SELECT false, 'Missing code', 0;
    RETURN;
  END IF;

  SELECT id, customer_id, reward_id, status
  INTO v_redemption_id, v_customer_id, v_reward_id, v_status
  FROM loyalty_redemptions
  WHERE code = p_code AND clinic_id = p_clinic_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Invalid code', 0;
    RETURN;
  END IF;

  IF v_status <> 'issued' THEN
    RETURN QUERY SELECT false, 'Code not available', 0;
    RETURN;
  END IF;

  SELECT type, monetary_value
  INTO v_reward_type, v_reward_value
  FROM loyalty_rewards
  WHERE id = v_reward_id AND clinic_id = p_clinic_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Reward not found', 0;
    RETURN;
  END IF;

  SELECT subtotal, COALESCE(discount_amount, 0), COALESCE(tax_amount, 0)
  INTO v_subtotal, v_existing_discount, v_tax
  FROM pos_transactions
  WHERE id = p_pos_transaction_id AND clinic_id = p_clinic_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Transaction not found', 0;
    RETURN;
  END IF;

  v_discount := 0;

  IF v_reward_type = 'discount_percentage' THEN
    v_discount := COALESCE(v_subtotal, 0) * (COALESCE(v_reward_value, 0) / 100.0);
  ELSIF v_reward_type = 'discount_amount' THEN
    v_discount := COALESCE(v_reward_value, 0);
  ELSE
    v_discount := 0;
  END IF;

  IF v_discount < 0 THEN
    v_discount := 0;
  END IF;

  IF v_discount > COALESCE(v_subtotal, 0) THEN
    v_discount := COALESCE(v_subtotal, 0);
  END IF;

  UPDATE pos_transactions
  SET discount_amount = v_existing_discount + v_discount,
      total_amount = COALESCE(v_subtotal, 0) - (v_existing_discount + v_discount) + v_tax,
      updated_at = now()
  WHERE id = p_pos_transaction_id AND clinic_id = p_clinic_id;

  UPDATE loyalty_redemptions
  SET status = 'applied',
      applied_at = now(),
      applied_pos_transaction_id = p_pos_transaction_id
  WHERE id = v_redemption_id;

  RETURN QUERY SELECT true, 'Applied', v_discount;
END;
$$;
