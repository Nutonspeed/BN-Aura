// Simple migration script using Next.js API
async function runMigration() {
  try {
    console.log('Starting database migration...');
    
    // Call the migration API endpoint
    const response = await fetch('http://localhost:3000/api/admin/database/migrate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Migration failed:', error);
      return false;
    }
    
    const result = await response.json();
    console.log('Migration completed:', result);
    return true;
    
  } catch (error) {
    console.error('Migration error:', error);
    return false;
  }
}

runMigration().then(success => {
  if (success) {
    console.log('✅ Database migration completed successfully!');
  } else {
    console.log('❌ Database migration failed!');
  }
  process.exit(success ? 0 : 1);
});
