-- Customer access policies for Loyalty system

-- Loyalty profiles: allow customers to view their own profile
DROP POLICY IF EXISTS "Customers can view their loyalty profile" ON loyalty_profiles;
CREATE POLICY "Customers can view their loyalty profile" ON loyalty_profiles
  FOR SELECT USING (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  );

-- Point transactions: allow customers to view their own transactions
DROP POLICY IF EXISTS "Customers can view their point transactions" ON point_transactions;
CREATE POLICY "Customers can view their point transactions" ON point_transactions
  FOR SELECT USING (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  );

-- Achievements: allow customers to view achievements for their clinic
DROP POLICY IF EXISTS "Customers can view achievements for their clinic" ON achievements;
CREATE POLICY "Customers can view achievements for their clinic" ON achievements
  FOR SELECT USING (
    clinic_id IN (
      SELECT clinic_id FROM customers WHERE user_id = auth.uid()
    )
  );

-- Loyalty rewards: allow customers to view rewards for their clinic
DROP POLICY IF EXISTS "Customers can view loyalty rewards for their clinic" ON loyalty_rewards;
CREATE POLICY "Customers can view loyalty rewards for their clinic" ON loyalty_rewards
  FOR SELECT USING (
    clinic_id IN (
      SELECT clinic_id FROM customers WHERE user_id = auth.uid()
    )
  );
