import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import fs from 'fs';
import path from 'path';
import { requireSuperAdmin, handleAuthError } from '@/lib/auth/withAuth';

export async function POST(request: Request) {
  try {
    await requireSuperAdmin();
    const supabase = createAdminClient();
    
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'scripts', 'create-system-tables.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    const errors = [];
    let successCount = 0;
    
    // Execute each statement using direct SQL execution
    for (const statement of statements) {
      try {
        // Use direct SQL execution with .from() and .rpc()
        if (statement.toUpperCase().includes('CREATE TABLE')) {
          // Handle CREATE TABLE statements
          const tableName = statement.match(/CREATE TABLE.*?(\w+)/)?.[1];
          if (tableName) {
            const { error } = await supabase
              .from(tableName)
              .select('*')
              .limit(1);
            
            if (error && error.code !== 'PGRST116') { // PGRST116 = relation does not exist
              // Table doesn't exist, create it
              const { error: createError } = await supabase.rpc('exec', { sql: statement });
              if (createError) {
                console.error('Error creating table:', createError);
                errors.push(createError.message);
              } else {
                successCount++;
              }
            } else {
              successCount++; // Table already exists
            }
          }
        } else if (statement.toUpperCase().includes('CREATE INDEX')) {
          // Handle CREATE INDEX statements
          const { error: indexError } = await supabase.rpc('exec', { sql: statement });
          if (indexError) {
            console.error('Error creating index:', indexError);
            errors.push(indexError.message);
          } else {
            successCount++;
          }
        } else if (statement.toUpperCase().includes('INSERT INTO')) {
          // Handle INSERT statements
          const { error: insertError } = await supabase.rpc('exec', { sql: statement });
          if (insertError) {
            console.error('Error inserting data:', insertError);
            errors.push(insertError.message);
          } else {
            successCount++;
          }
        } else if (statement.toUpperCase().includes('ALTER TABLE')) {
          // Handle ALTER TABLE statements
          const { error: alterError } = await supabase.rpc('exec', { sql: statement });
          if (alterError) {
            console.error('Error altering table:', alterError);
            errors.push(alterError.message);
          } else {
            successCount++;
          }
        } else {
          // Handle other statements
          const { error: otherError } = await supabase.rpc('exec', { sql: statement });
          if (otherError) {
            console.error('Error executing statement:', otherError);
            errors.push(otherError.message);
          } else {
            successCount++;
          }
        }
      } catch (stmtError) {
        console.error('Statement error:', stmtError);
        errors.push(stmtError instanceof Error ? stmtError.message : 'Unknown error');
      }
    }
    
    if (errors.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: `Migration partially failed. ${errors.length} errors occurred.`,
        details: errors
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Database migration completed successfully. ${successCount} statements executed.` 
    });
    
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
