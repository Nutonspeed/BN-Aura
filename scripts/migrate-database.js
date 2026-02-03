import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Starting database migration...');
    
    // Read the SQL file
    const fs = await import('fs');
    const path = await import('path');
    const sqlPath = path.join(process.cwd(), 'scripts', 'create-system-tables.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 100) + '...');
        
        const { error } = await supabase.rpc('exec_sql', {
          sql_query: statement
        });
        
        if (error) {
          console.error('Error executing statement:', error);
          // Continue with other statements
        } else {
          console.log('✅ Success');
        }
      }
    }
    
    console.log('Migration completed!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
