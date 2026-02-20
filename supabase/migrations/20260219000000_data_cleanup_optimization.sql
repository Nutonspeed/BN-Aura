-- Data Cleanup and Optimization Script for BN-Aura
-- Run this script to clean up test data and optimize performance

DO $$
DECLARE
  v_archive_cutoff_date DATE := CURRENT_DATE - INTERVAL '30 days';
  v_test_pattern TEXT := '%test%@%';
  v_demo_pattern TEXT := '%demo%@%';
  v_rows_affected INTEGER;
BEGIN
  RAISE NOTICE 'Starting data cleanup and optimization...';
  RAISE NOTICE 'Archive cutoff date: %', v_archive_cutoff_date;

  -- 1. Archive old appointment records
  CREATE TABLE IF NOT EXISTS appointments_archive AS 
  SELECT * FROM appointments 
  WHERE created_at < v_archive_cutoff_date
  WITH NO DATA;
  
  INSERT INTO appointments_archive 
  SELECT * FROM appointments 
  WHERE created_at < v_archive_cutoff_date;
  
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  RAISE NOTICE 'Archived % old appointment records', v_rows_affected;
  
  DELETE FROM appointments 
  WHERE created_at < v_archive_cutoff_date;
  
  -- 2. Clean up test customers
  CREATE TABLE IF NOT EXISTS customers_archive AS
  SELECT * FROM customers
  WITH NO DATA;
  
  INSERT INTO customers_archive
  SELECT * FROM customers
  WHERE email ILIKE v_test_pattern 
     OR email ILIKE v_demo_pattern
     OR full_name ILIKE '%test%'
     OR full_name ILIKE '%demo%';
  
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  RAISE NOTICE 'Archived % test customer records', v_rows_affected;
  
  -- Delete test customers (cascade will handle related records)
  DELETE FROM customers
  WHERE email ILIKE v_test_pattern 
     OR email ILIKE v_demo_pattern
     OR full_name ILIKE '%test%'
     OR full_name ILIKE '%demo%'
  AND id NOT IN (SELECT customer_id FROM appointments WHERE created_at >= v_archive_cutoff_date);
  
  -- 3. Clean up old skin analyses
  CREATE TABLE IF NOT EXISTS skin_analyses_archive AS
  SELECT * FROM skin_analyses
  WITH NO DATA;
  
  INSERT INTO skin_analyses_archive
  SELECT * FROM skin_analyses
  WHERE analyzed_at < v_archive_cutoff_date;
  
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  RAISE NOTICE 'Archived % old skin analysis records', v_rows_affected;
  
  DELETE FROM skin_analyses
  WHERE analyzed_at < v_archive_cutoff_date;
  
  -- 4. Clean up old prediction logs
  CREATE TABLE IF NOT EXISTS prediction_logs_archive AS
  SELECT * FROM prediction_logs
  WITH NO DATA;
  
  INSERT INTO prediction_logs_archive
  SELECT * FROM prediction_logs
  WHERE created_at < v_archive_cutoff_date;
  
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  RAISE NOTICE 'Archived % old prediction log records', v_rows_affected;
  
  DELETE FROM prediction_logs
  WHERE created_at < v_archive_cutoff_date;
  
  -- 5. Optimize table sizes and update statistics
  RAISE NOTICE 'Optimizing database tables...';
  
  -- VACUUM ANALYZE main tables
  EXECUTE 'VACUUM ANALYZE appointments';
  EXECUTE 'VACUUM ANALYZE customers';
  EXECUTE 'VACUUM ANALYZE skin_analyses';
  EXECUTE 'VACUUM ANALYZE genetic_analyses';
  EXECUTE 'VACUUM ANALYZE prediction_logs';
  EXECUTE 'VACUUM ANALYZE treatments';
  
  -- 6. Check and optimize indexes for AI queries
  RAISE NOTICE 'Checking AI-related indexes...';
  
  -- Ensure indexes exist for optimal AI query performance
  CREATE INDEX IF NOT EXISTS idx_customers_clinic_id_created_at 
  ON customers(clinic_id, created_at DESC);
  
  CREATE INDEX IF NOT EXISTS idx_appointments_customer_clinic_date 
  ON appointments(customer_id, clinic_id, appointment_date DESC);
  
  CREATE INDEX IF NOT EXISTS idx_skin_analyses_customer_analyzed 
  ON skin_analyses(customer_id, analyzed_at DESC);
  
  CREATE INDEX IF NOT EXISTS idx_genetic_analyses_customer_clinic 
  ON genetic_analyses(customer_id, clinic_id);
  
  CREATE INDEX IF NOT EXISTS idx_prediction_logs_customer_treatment 
  ON prediction_logs(customer_id, treatment_id, created_at DESC);
  
  -- GIN indexes for JSONB fields
  CREATE INDEX IF NOT EXISTS idx_customers_skin_concerns_gin 
  ON customers USING GIN(skin_concerns);
  
  CREATE INDEX IF NOT EXISTS idx_genetic_markers_gin 
  ON genetic_analyses USING GIN(genetic_markers);
  
  CREATE INDEX IF NOT EXISTS idx_prediction_data_gin 
  ON prediction_logs USING GIN(prediction_data);
  
  -- 7. Update table statistics
  EXECUTE 'ANALYZE customers';
  EXECUTE 'ANALYZE appointments';
  EXECUTE 'ANALYZE skin_analyses';
  EXECUTE 'ANALYZE genetic_analyses';
  EXECUTE 'ANALYZE prediction_logs';
  
  -- 8. Report table sizes
  RAISE NOTICE '=== Table Sizes After Optimization ===';
  
  SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
  INTO TEMP TABLE table_sizes
  FROM pg_tables 
  WHERE schemaname = 'public' 
    AND tablename IN ('customers', 'appointments', 'skin_analyses', 'genetic_analyses', 'prediction_logs', 'treatments')
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
  
  -- Display results
  FOR rec IN SELECT * FROM table_sizes LOOP
    RAISE NOTICE 'Table %: %', rec.tablename, rec.size;
  END LOOP;
  
  -- 9. Check for any constraint violations
  RAISE NOTICE 'Checking for data integrity issues...';
  
  -- Check orphaned records
  -- Skin analyses without customers
  PERFORM 1 FROM skin_analyses sa 
  LEFT JOIN customers c ON sa.customer_id = c.id 
  WHERE c.id IS NULL LIMIT 1;
  
  IF FOUND THEN
    RAISE WARNING 'Found orphaned skin analysis records';
  END IF;
  
  -- Genetic analyses without customers
  PERFORM 1 FROM genetic_analyses ga 
  LEFT JOIN customers c ON ga.customer_id = c.id 
  WHERE c.id IS NULL LIMIT 1;
  
  IF FOUND THEN
    RAISE WARNING 'Found orphaned genetic analysis records';
  END IF;
  
  -- Prediction logs without customers
  PERFORM 1 FROM prediction_logs pl 
  LEFT JOIN customers c ON pl.customer_id = c.id 
  WHERE c.id IS NULL LIMIT 1;
  
  IF FOUND THEN
    RAISE WARNING 'Found orphaned prediction log records';
  END IF;
  
  RAISE NOTICE 'Data cleanup and optimization completed successfully!';
  
  -- 10. Provide summary statistics
  RAISE NOTICE '=== Summary Statistics ===';
  
  SELECT 
    (SELECT COUNT(*) FROM customers) as total_customers,
    (SELECT COUNT(*) FROM appointments) as total_appointments,
    (SELECT COUNT(*) FROM skin_analyses) as total_skin_analyses,
    (SELECT COUNT(*) FROM genetic_analyses) as total_genetic_analyses,
    (SELECT COUNT(*) FROM prediction_logs) as total_prediction_logs
  INTO v_total_customers, v_total_appointments, v_total_skin_analyses, v_total_genetic_analyses, v_total_prediction_logs
  FROM (SELECT 1) dummy;
  
  RAISE NOTICE 'Active Records:';
  RAISE NOTICE '  Customers: %', v_total_customers;
  RAISE NOTICE '  Appointments: %', v_total_appointments;
  RAISE NOTICE '  Skin Analyses: %', v_total_skin_analyses;
  RAISE NOTICE '  Genetic Analyses: %', v_total_genetic_analyses;
  RAISE NOTICE '  Prediction Logs: %', v_total_prediction_logs;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Data cleanup failed: %', SQLERRM;
END $$;

-- Additional query to monitor index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
  AND indexname LIKE '%_idx%'
ORDER BY idx_scan DESC;
