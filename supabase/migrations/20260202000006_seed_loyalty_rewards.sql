-- Seed default loyalty rewards for all clinics (idempotent)

-- 10% Discount Coupon
INSERT INTO loyalty_rewards (clinic_id, name, description, type, points_cost, monetary_value, is_active, tier_requirement)
SELECT c.id,
       'ส่วนลด 10% ทุก Treatment',
       'คูปองส่วนลด 10% สำหรับการทำ Treatment ครั้งถัดไป',
       'discount_percentage',
       500,
       0,
       true,
       'bronze'
FROM clinics c
WHERE NOT EXISTS (
  SELECT 1 FROM loyalty_rewards r
  WHERE r.clinic_id = c.id AND r.name = 'ส่วนลด 10% ทุก Treatment'
);

-- 500 THB Discount
INSERT INTO loyalty_rewards (clinic_id, name, description, type, points_cost, monetary_value, is_active, tier_requirement)
SELECT c.id,
       'ส่วนลด 500 บาท',
       'ใช้เป็นส่วนลดเงินสด 500 บาท',
       'discount_amount',
       1000,
       500,
       true,
       'silver'
FROM clinics c
WHERE NOT EXISTS (
  SELECT 1 FROM loyalty_rewards r
  WHERE r.clinic_id = c.id AND r.name = 'ส่วนลด 500 บาท'
);

-- Free Premium Mask
INSERT INTO loyalty_rewards (clinic_id, name, description, type, points_cost, monetary_value, is_active, tier_requirement)
SELECT c.id,
       'ฟรี Premium Mask',
       'รับฟรี Premium Mask 1 ครั้ง',
       'free_service',
       2000,
       800,
       true,
       'gold'
FROM clinics c
WHERE NOT EXISTS (
  SELECT 1 FROM loyalty_rewards r
  WHERE r.clinic_id = c.id AND r.name = 'ฟรี Premium Mask'
);

-- Birthday Special
INSERT INTO loyalty_rewards (clinic_id, name, description, type, points_cost, monetary_value, is_active, tier_requirement)
SELECT c.id,
       'Birthday Special',
       'ของขวัญวันเกิดสำหรับสมาชิก',
       'birthday_special',
       1500,
       1000,
       true,
       'silver'
FROM clinics c
WHERE NOT EXISTS (
  SELECT 1 FROM loyalty_rewards r
  WHERE r.clinic_id = c.id AND r.name = 'Birthday Special'
);
