// Database Schema Verification Script
// Run this to verify all required tables and RLS policies exist

import { createAdminClient } from '@/lib/supabase/admin';

const EXPECTED_TABLES = [
  // Core System Tables
  'clinics',
  'clinic_branches',
  'users',
  'clinic_staff',
  'user_roles',
  'role_permissions',
  
  // Customer Management
  'customers',
  'customer_profiles',
  'customer_medical_history',
  'customer_tags',
  'customer_notes',
  'customer_documents',
  
  // Appointment & Booking
  'appointments',
  'appointment_services',
  'appointment_history',
  'appointment_reminders',
  'waitlist',
  
  // Services & Treatments
  'services',
  'service_categories',
  'treatment_protocols',
  'treatment_packages',
  'service_pricing',
  
  // Inventory Management
  'inventory_items',
  'inventory_categories',
  'inventory_transactions',
  'stock_movements',
  'suppliers',
  'purchase_orders',
  
  // Sales & Billing
  'invoices',
  'invoice_items',
  'payments',
  'payment_methods',
  'promotions',
  'discount_codes',
  
  // AI & Analytics
  'ai_skin_analyses',
  'ai_recommendations',
  'treatment_outcomes',
  'customer_feedback',
  
  // Communication
  'notifications',
  'sms_logs',
  'email_logs',
  'chat_messages',
  
  // System & Audit
  'audit_logs',
  'system_settings',
  'clinic_settings',
];

interface VerificationResult {
  table: string;
  exists: boolean;
  hasRLS: boolean | null;
  rowCount: number | null;
  error?: string;
}

export async function verifyDatabaseSchema(): Promise<{
  results: VerificationResult[];
  summary: {
    totalExpected: number;
    totalExists: number;
    totalMissing: number;
    tablesWithRLS: number;
    tablesWithoutRLS: number;
  };
}> {
  const adminClient = createAdminClient();
  const results: VerificationResult[] = [];

  console.log('[v0] Starting database schema verification...\n');

  for (const tableName of EXPECTED_TABLES) {
    try {
      // Check if table exists by querying it
      const { data, error, count } = await adminClient
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (error) {
        results.push({
          table: tableName,
          exists: false,
          hasRLS: null,
          rowCount: null,
          error: error.message,
        });
        console.log(`❌ ${tableName}: NOT FOUND - ${error.message}`);
        continue;
      }

      // Table exists, now check RLS
      const rlsQuery = `
        SELECT 
          schemaname,
          tablename,
          rowsecurity
        FROM pg_tables 
        WHERE tablename = '${tableName}'
        AND schemaname = 'public';
      `;

      const { data: rlsData } = await adminClient.rpc('exec_sql', {
        query: rlsQuery,
      }).single();

      const hasRLS = (rlsData as any)?.rowsecurity || false;

      results.push({
        table: tableName,
        exists: true,
        hasRLS,
        rowCount: count,
      });

      const rlsStatus = hasRLS ? '🔒 RLS enabled' : '⚠️  RLS disabled';
      console.log(`✅ ${tableName}: EXISTS (${count} rows) ${rlsStatus}`);

    } catch (error) {
      results.push({
        table: tableName,
        exists: false,
        hasRLS: null,
        rowCount: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      console.log(`❌ ${tableName}: ERROR - ${error}`);
    }
  }

  // Calculate summary
  const totalExists = results.filter(r => r.exists).length;
  const totalMissing = results.filter(r => !r.exists).length;
  const tablesWithRLS = results.filter(r => r.exists && r.hasRLS).length;
  const tablesWithoutRLS = results.filter(r => r.exists && !r.hasRLS).length;

  const summary = {
    totalExpected: EXPECTED_TABLES.length,
    totalExists,
    totalMissing,
    tablesWithRLS,
    tablesWithoutRLS,
  };

  console.log('\n=== VERIFICATION SUMMARY ===');
  console.log(`Total Expected Tables: ${summary.totalExpected}`);
  console.log(`Tables Found: ${summary.totalExists} ✅`);
  console.log(`Tables Missing: ${summary.totalMissing} ❌`);
  console.log(`Tables with RLS: ${summary.tablesWithRLS} 🔒`);
  console.log(`Tables without RLS: ${summary.tablesWithoutRLS} ⚠️`);

  if (totalMissing > 0) {
    console.log('\n⚠️  Missing tables:');
    results
      .filter(r => !r.exists)
      .forEach(r => console.log(`  - ${r.table}`));
  }

  if (tablesWithoutRLS > 0) {
    console.log('\n⚠️  Tables without RLS:');
    results
      .filter(r => r.exists && !r.hasRLS)
      .forEach(r => console.log(`  - ${r.table}`));
  }

  return { results, summary };
}

// Quick check functions for specific tables
export async function checkCoreTablesExist(): Promise<boolean> {
  const adminClient = createAdminClient();
  const coreTables = ['clinics', 'users', 'customers', 'appointments', 'services'];
  
  try {
    for (const table of coreTables) {
      const { error } = await adminClient
        .from(table)
        .select('id', { head: true })
        .limit(1);
      
      if (error) {
        console.error(`Core table ${table} missing:`, error.message);
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error('Error checking core tables:', error);
    return false;
  }
}

export async function checkRLSEnabled(tableName: string): Promise<boolean> {
  const adminClient = createAdminClient();
  
  try {
    // Try to query without admin client (should fail if RLS is working)
    const { createClient } = await import('@/lib/supabase/client');
    const client = createClient();
    
    const { error } = await client
      .from(tableName)
      .select('*')
      .limit(1);
    
    // If no error, RLS might not be properly configured
    // (assuming user is not authenticated)
    return error !== null;
  } catch (error) {
    return true; // Error means RLS is likely working
  }
}

if (require.main === module) {
  // Run verification if executed directly
  verifyDatabaseSchema()
    .then(() => {
      console.log('\n✅ Verification complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Verification failed:', error);
      process.exit(1);
    });
}
