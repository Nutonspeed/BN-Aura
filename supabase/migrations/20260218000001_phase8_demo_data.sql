-- Demo Data for Phase 8 Testing
-- Insert sample treatments, customers, and analytics data

-- Insert sample treatments for Bangkok Premium Clinic
INSERT INTO treatments (
  id, 
  clinic_id, 
  name, 
  category, 
  price_min, 
  price_max, 
  duration_minutes, 
  description, 
  is_active,
  created_at
) VALUES 
  (
    gen_random_uuid(), 
    (SELECT id FROM clinics WHERE display_name->>'th' = 'คลินิกความงามสาธิต' LIMIT 1),
    'Hyaluronic Acid Filler',
    'injectable',
    12000,
    18000,
    60,
    'เติมเต็มร่องลึกใต้ตา และร่องแก้มด้วย Filler คุณภาพสูง',
    true,
    NOW()
  ),
  (
    gen_random_uuid(), 
    (SELECT id FROM clinics WHERE display_name->>'th' = 'คลินิกความงามสาธิต' LIMIT 1),
    'CO2 Fractional Laser',
    'laser',
    8000,
    12000,
    45,
    'เลเซอร์ CO2 ช่วยลดริ้วรอยและรูขุมขนใหญ่',
    true,
    NOW()
  ),
  (
    gen_random_uuid(), 
    (SELECT id FROM clinics WHERE display_name->>'th' = 'คลินิกความงามสาธิต' LIMIT 1),
    'HydraFacial MD',
    'facial',
    3500,
    4500,
    30,
    'ทำความสะอาดลึก ฟื้นฟูผิวด้วยเทคโนโลยี HydraFacial',
    true,
    NOW()
  ),
  (
    gen_random_uuid(), 
    (SELECT id FROM clinics WHERE display_name->>'th' = 'คลินิกความงามสาธิต' LIMIT 1),
    'Botox Injections',
    'injectable',
    6000,
    10000,
    30,
    'Botox ช่วยลดริ้วรอยหน้าผากและหน้าผาก',
    true,
    NOW()
  ),
  (
    gen_random_uuid(), 
    (SELECT id FROM clinics WHERE display_name->>'th' = 'คลินิกความงามสาธิต' LIMIT 1),
    'Microneedling',
    'laser',
    4000,
    6000,
    40,
    'Microneedling ช่วยกระตุ้นการสร้างคอลลาเจนใหม่',
    true,
    NOW()
  );

-- Insert sample customers
INSERT INTO customers (
  id,
  clinic_id,
  full_name,
  email,
  phone,
  age,
  gender,
  skin_type,
  created_at
) VALUES 
  (
    gen_random_uuid(),
    (SELECT id FROM clinics WHERE display_name->>'th' = 'คลินิกความงามสาธิต' LIMIT 1),
    'สมหวัง ทดสอบ',
    'newcust@bnaura.com',
    '0812345678',
    35,
    'female',
    'mixed',
    NOW()
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM clinics WHERE display_name->>'th' = 'คลินิกความงามสาธิต' LIMIT 1),
    'พิมพ์ ผิวดี',
    'cust3@bnaura.com',
    '0823456789',
    28,
    'female',
    'normal',
    NOW()
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM clinics WHERE display_name->>'th' = 'คลินิกความงามสาธิต' LIMIT 1),
    'สมชาย หล่อเลย',
    'cust2@bnaura.com',
    '0834567890',
    32,
    'male',
    'oily',
    NOW()
  );

-- Insert sample appointments
INSERT INTO appointments (
  id,
  clinic_id,
  customer_id,
  treatment_id,
  staff_id,
  appointment_date,
  status,
  notes,
  created_at
) VALUES 
  (
    gen_random_uuid(),
    (SELECT id FROM clinics WHERE display_name->>'th' = 'คลินิกความงามสาธิต' LIMIT 1),
    (SELECT id FROM customers WHERE email = 'newcust@bnaura.com' LIMIT 1),
    (SELECT id FROM treatments WHERE name = 'Hyaluronic Acid Filler' LIMIT 1),
    (SELECT id FROM users WHERE email = 'sales1.auth@bntest.com' LIMIT 1),
    NOW() + INTERVAL '1 day',
    'scheduled',
    'ลูกค้าสนใจเติม Filler ใต้ตา',
    NOW()
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM clinics WHERE display_name->>'th' = 'คลินิกความงามสาธิต' LIMIT 1),
    (SELECT id FROM customers WHERE email = 'cust3@bnaura.com' LIMIT 1),
    (SELECT id FROM treatments WHERE name = 'CO2 Fractional Laser' LIMIT 1),
    (SELECT id FROM users WHERE email = 'sales1.auth@bntest.com' LIMIT 1),
    NOW() + INTERVAL '2 days',
    'scheduled',
    'ลูกค้ามีปัญหาริ้วรอย',
    NOW()
  );

-- Insert sample skin analyses
INSERT INTO skin_analyses (
  id,
  clinic_id,
  customer_id,
  analysis_data,
  confidence_score,
  created_at
) VALUES 
  (
    gen_random_uuid(),
    (SELECT id FROM clinics WHERE display_name->>'th' = 'คลินิกความงามสาธิต' LIMIT 1),
    (SELECT id FROM customers WHERE email = 'newcust@bnaura.com' LIMIT 1),
    '{
      "overall_score": 78,
      "skin_age": 28,
      "actual_age": 32,
      "skin_type": "ผิวผสม",
      "metrics": {
        "hydration": 72,
        "elasticity": 68,
        "texture": 58,
        "firmness": 75,
        "pores": 65,
        "oiliness": 82
      },
      "concerns": ["ริ้วรอย", "รูขุมขนใหญ่", "ความชุ่มชื้นต่ำ"],
      "recommendations": ["Hyaluronic Acid Filler", "HydraFacial MD", "Moisturizer"]
    }'::jsonb,
    0.95,
    NOW()
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM clinics WHERE display_name->>'th' = 'คลินิกความงามสาธิต' LIMIT 1),
    (SELECT id FROM customers WHERE email = 'cust3@bnaura.com' LIMIT 1),
    '{
      "overall_score": 85,
      "skin_age": 25,
      "actual_age": 28,
      "skin_type": "ผิวปกติ",
      "metrics": {
        "hydration": 80,
        "elasticity": 75,
        "texture": 70,
        "firmness": 82,
        "pores": 60,
        "oiliness": 70
      },
      "concerns": ["ริ้วรอยเล็กน้อย"],
      "recommendations": ["Botox Injections", "Preventive care"]
    }'::jsonb,
    0.92,
    NOW()
  );

-- Insert sample genetic analyses
INSERT INTO genetic_analyses (
  id,
  clinic_id,
  customer_id,
  genetic_markers,
  risk_factors,
  treatment_compatibilities,
  created_at
) VALUES 
  (
    gen_random_uuid(),
    (SELECT id FROM clinics WHERE display_name->>'th' = 'คลินิกความงามสาธิต' LIMIT 1),
    (SELECT id FROM customers WHERE email = 'newcust@bnaura.com' LIMIT 1),
    '{
      "COL1A1_rs1800012": {"variant": "G", "impact": 85},
      "MC1R_rs1805007": {"variant": "T", "impact": 90},
      "FLG_rs61816761": {"variant": "A", "impact": 88}
    }'::jsonb,
    '["wrinkles", "skin_elasticity", "pigmentation"]'::text[],
    '{
      "botox_injectables": {"compatibility": 85, "effectiveness": 90},
      "chemical_peels": {"compatibility": 70, "effectiveness": 75}
    }'::jsonb,
    NOW()
  );

-- Insert sample prediction logs
INSERT INTO prediction_logs (
  id,
  clinic_id,
  customer_id,
  treatment_id,
  prediction_model,
  success_probability,
  confidence_score,
  prediction_data,
  created_at
) VALUES 
  (
    gen_random_uuid(),
    (SELECT id FROM clinics WHERE display_name->>'th' = 'คลินิกความงามสาธิต' LIMIT 1),
    (SELECT id FROM customers WHERE email = 'newcust@bnaura.com' LIMIT 1),
    (SELECT id FROM treatments WHERE name = 'Hyaluronic Acid Filler' LIMIT 1),
    'treatment_success_v2',
    0.87,
    0.92,
    '{
      "factors": {
        "age_appropriateness": 0.9,
        "skin_condition": 0.85,
        "genetic_compatibility": 0.88,
        "lifestyle_factors": 0.8
      },
      "expected_results": ["volume_restoration", "wrinkle_reduction"],
      "recovery_time": "2-3 days"
    }'::jsonb,
    NOW()
  );
