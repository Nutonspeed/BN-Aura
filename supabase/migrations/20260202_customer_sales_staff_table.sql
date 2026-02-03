-- Table to track which sales staff owns which customers
-- This ensures data isolation between sales staff

CREATE TABLE IF NOT EXISTS public.customer_sales_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sales_staff_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(customer_id, sales_staff_id)
);

-- Indexes for performance
CREATE INDEX idx_customer_sales_staff_customer ON public.customer_sales_staff(customer_id);
CREATE INDEX idx_customer_sales_staff_sales_staff ON public.customer_sales_staff(sales_staff_id);
CREATE INDEX idx_customer_sales_staff_clinic ON public.customer_sales_staff(clinic_id);
CREATE INDEX idx_customer_sales_staff_active ON public.customer_sales_staff(is_active);

-- RLS Policies
ALTER TABLE public.customer_sales_staff ENABLE ROW LEVEL SECURITY;

-- Sales staff can only see their own customers
CREATE POLICY "Sales staff can view their own customers" ON public.customer_sales_staff
  FOR SELECT USING (
    auth.uid() = sales_staff_id
  );

-- Sales staff can insert their own customers
CREATE POLICY "Sales staff can insert their own customers" ON public.customer_sales_staff
  FOR INSERT WITH CHECK (
    auth.uid() = sales_staff_id
  );

-- Sales staff can update their own customers
CREATE POLICY "Sales staff can update their own customers" ON public.customer_sales_staff
  FOR UPDATE USING (
    auth.uid() = sales_staff_id
  );

-- Sales staff can delete their own customers
CREATE POLICY "Sales staff can delete their own customers" ON public.customer_sales_staff
  FOR DELETE USING (
    auth.uid() = sales_staff_id
  );

-- Clinic owners can see all customers in their clinic
CREATE POLICY "Clinic owners can view all clinic customers" ON public.customer_sales_staff
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.clinic_staff cs
      WHERE cs.user_id = auth.uid()
      AND cs.clinic_id = public.customer_sales_staff.clinic_id
      AND cs.role IN ('clinic_owner', 'clinic_admin')
    )
  );

-- Updated at trigger
CREATE TRIGGER update_customer_sales_staff_updated_at
  BEFORE UPDATE ON public.customer_sales_staff
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
