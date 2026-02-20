-- Fixed Demo Data for Phase 8
-- Using existing Clinic and Users where possible to ensure RLS compatibility

DO $$
DECLARE
  v_clinic_id UUID;
  v_sales_id UUID;
  v_cust1_id UUID;
  v_cust2_id UUID;
  v_cust3_id UUID;
  v_treatment1_id UUID;
  v_treatment2_id UUID;
  v_treatment3_id UUID;
  v_treatment4_id UUID;
  v_treatment5_id UUID;
BEGIN
  -- Get existing clinic
  SELECT id INTO v_clinic_id FROM clinics LIMIT 1;
  
  -- Get existing sales user or fallback
  SELECT id INTO v_sales_id FROM users WHERE email = 'sales@bnaura.com' LIMIT 1;
  IF v_sales_id IS NULL THEN
    SELECT id INTO v_sales_id FROM users LIMIT 1;
  END IF;

  RAISE NOTICE 'Using Clinic ID: %', v_clinic_id;
  RAISE NOTICE 'Using Staff ID: %', v_sales_id;

  -- 1. Insert Treatments
  -- Hyaluronic Acid Filler
  INSERT INTO treatments (id, clinic_id, names, category, price_min, price_max, is_active, created_at)
  VALUES (
    gen_random_uuid(),
    v_clinic_id,
    '{"en": "Hyaluronic Acid Filler", "th": "ฟิลเลอร์เติมเต็ม"}'::jsonb,
    'injectable',
    12000, 18000, true, NOW()
  ) RETURNING id INTO v_treatment1_id;

  -- CO2 Fractional Laser
  INSERT INTO treatments (id, clinic_id, names, category, price_min, price_max, is_active, created_at)
  VALUES (
    gen_random_uuid(),
    v_clinic_id,
    '{"en": "CO2 Fractional Laser", "th": "เลเซอร์ CO2"}'::jsonb,
    'laser',
    8000, 12000, true, NOW()
  ) RETURNING id INTO v_treatment2_id;

  -- HydraFacial MD
  INSERT INTO treatments (id, clinic_id, names, category, price_min, price_max, is_active, created_at)
  VALUES (
    gen_random_uuid(),
    v_clinic_id,
    '{"en": "HydraFacial MD", "th": "ไฮดราเฟเชียล"}'::jsonb,
    'facial',
    3500, 4500, true, NOW()
  ) RETURNING id INTO v_treatment3_id;

  -- Botox
  INSERT INTO treatments (id, clinic_id, names, category, price_min, price_max, is_active, created_at)
  VALUES (
    gen_random_uuid(),
    v_clinic_id,
    '{"en": "Botox Injections", "th": "โบท็อกซ์ลดริ้วรอย"}'::jsonb,
    'injectable',
    6000, 10000, true, NOW()
  ) RETURNING id INTO v_treatment4_id;

  -- Microneedling
  INSERT INTO treatments (id, clinic_id, names, category, price_min, price_max, is_active, created_at)
  VALUES (
    gen_random_uuid(),
    v_clinic_id,
    '{"en": "Microneedling", "th": "Microneedling กระตุ้นคอลลาเจน"}'::jsonb,
    'laser',
    4000, 6000, true, NOW()
  ) RETURNING id INTO v_treatment5_id;

  -- 2. Insert Customers
  -- Somwang
  INSERT INTO customers (id, clinic_id, full_name, email, phone, date_of_birth, gender, skin_concerns, created_at)
  VALUES (
    gen_random_uuid(),
    v_clinic_id,
    'Somwang Test',
    'somwang@bnaura.com',
    '0812345678',
    (NOW() - INTERVAL '35 years')::date,
    'female',
    '["wrinkles", "dryness"]'::jsonb,
    NOW()
  ) RETURNING id INTO v_cust1_id;

  -- Pim
  INSERT INTO customers (id, clinic_id, full_name, email, phone, date_of_birth, gender, skin_concerns, created_at)
  VALUES (
    gen_random_uuid(),
    v_clinic_id,
    'Pim Skin',
    'pim@bnaura.com',
    '0823456789',
    (NOW() - INTERVAL '28 years')::date,
    'female',
    '["acne", "pores"]'::jsonb,
    NOW()
  ) RETURNING id INTO v_cust2_id;

  -- Somchai
  INSERT INTO customers (id, clinic_id, full_name, email, phone, date_of_birth, gender, skin_concerns, created_at)
  VALUES (
    gen_random_uuid(),
    v_clinic_id,
    'Somchai Handsome',
    'somchai@bnaura.com',
    '0834567890',
    (NOW() - INTERVAL '32 years')::date,
    'male',
    '["oily_skin", "scars"]'::jsonb,
    NOW()
  ) RETURNING id INTO v_cust3_id;

  -- 3. Insert Appointments
  INSERT INTO appointments (id, clinic_id, customer_id, staff_id, treatment_ids, appointment_date, status, notes, created_at)
  VALUES (
    gen_random_uuid(),
    v_clinic_id,
    v_cust1_id,
    v_sales_id,
    jsonb_build_array(v_treatment1_id),
    (NOW() + INTERVAL '1 day')::date,
    'scheduled',
    'Interested in filler for under eyes',
    NOW()
  );

  INSERT INTO appointments (id, clinic_id, customer_id, staff_id, treatment_ids, appointment_date, status, notes, created_at)
  VALUES (
    gen_random_uuid(),
    v_clinic_id,
    v_cust2_id,
    v_sales_id,
    jsonb_build_array(v_treatment2_id),
    (NOW() + INTERVAL '2 days')::date,
    'scheduled',
    'Acne scar treatment consultation',
    NOW()
  );

  -- 4. Insert Skin Analyses
  INSERT INTO skin_analyses (id, clinic_id, customer_id, overall_score, skin_age, actual_age, skin_type, confidence_score, recommendations, analyzed_at)
  VALUES (
    gen_random_uuid(),
    v_clinic_id,
    v_cust1_id,
    78,
    28,
    35,
    'Combination',
    0.95,
    '["Filler", "Moisturizer"]'::jsonb,
    NOW()
  );

  INSERT INTO skin_analyses (id, clinic_id, customer_id, overall_score, skin_age, actual_age, skin_type, confidence_score, recommendations, analyzed_at)
  VALUES (
    gen_random_uuid(),
    v_clinic_id,
    v_cust2_id,
    85,
    25,
    28,
    'Normal',
    0.92,
    '["Botox", "Preventive"]'::jsonb,
    NOW()
  );

  -- 5. Insert Genetic Analyses
  INSERT INTO genetic_analyses (id, clinic_id, customer_id, genetic_markers, risk_factors, treatment_compatibilities)
  VALUES (
    gen_random_uuid(),
    v_clinic_id,
    v_cust1_id,
    '{
      "COL1A1_rs1800012": {"variant": "G", "impact": 85},
      "MC1R_rs1805007": {"variant": "T", "impact": 90},
      "FLG_rs61816761": {"variant": "A", "impact": 88}
    }'::jsonb,
    ARRAY['wrinkles', 'skin_elasticity', 'pigmentation'],
    '{
      "botox_injectables": {"compatibility": 85, "effectiveness": 90},
      "chemical_peels": {"compatibility": 70, "effectiveness": 75}
    }'::jsonb
  );

  -- 6. Insert Prediction Logs
  INSERT INTO prediction_logs (id, clinic_id, customer_id, treatment_id, prediction_model, success_probability, confidence_score, prediction_data)
  VALUES (
    gen_random_uuid(),
    v_clinic_id,
    v_cust1_id,
    v_treatment1_id,
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
    }'::jsonb
  );

END $$;
