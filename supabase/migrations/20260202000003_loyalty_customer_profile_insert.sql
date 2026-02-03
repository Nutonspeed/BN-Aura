-- Allow customers to create their own loyalty profile

DROP POLICY IF EXISTS "Customers can create their loyalty profile" ON loyalty_profiles;
CREATE POLICY "Customers can create their loyalty profile" ON loyalty_profiles
  FOR INSERT WITH CHECK (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  );
