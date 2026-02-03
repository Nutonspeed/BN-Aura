-- ตรวจสอบ transaction_date ของ sales_commissions สำหรับ sales staff #1
SELECT 
  id,
  transaction_type,
  commission_amount,
  payment_status,
  transaction_date,
  created_at,
  EXTRACT(MONTH FROM transaction_date) as txn_month,
  EXTRACT(YEAR FROM transaction_date) as txn_year,
  EXTRACT(DAY FROM transaction_date) as txn_day
FROM sales_commissions
WHERE sales_staff_id = 'f369bbff-ce1f-479f-b4e8-5b4a377c0f04'
ORDER BY created_at DESC;

-- ตรวจสอบว่ามีข้อมูลในช่วงที่ API ค้นหาหรือไม่
-- Monthly (Feb 1, 2026 00:00:00 เป็นต้นไป)
SELECT COUNT(*) as monthly_count,
       SUM(commission_amount) as monthly_total
FROM sales_commissions
WHERE sales_staff_id = 'f369bbff-ce1f-479f-b4e8-5b4a377c0f04'
AND transaction_date >= '2026-02-01T00:00:00.000Z';

-- Daily (Today Feb 2, 2026 00:00:00 เป็นต้นไป)
SELECT COUNT(*) as daily_count,
       SUM(commission_amount) as daily_total
FROM sales_commissions
WHERE sales_staff_id = 'f369bbff-ce1f-479f-b4e8-5b4a377c0f04'
AND transaction_date >= '2026-02-02T00:00:00.000Z';

-- Weekly (7 days ago from now)
SELECT COUNT(*) as weekly_count,
       SUM(commission_amount) as weekly_total
FROM sales_commissions
WHERE sales_staff_id = 'f369bbff-ce1f-479f-b4e8-5b4a377c0f04'
AND transaction_date >= '2026-01-26T00:00:00.000Z';
