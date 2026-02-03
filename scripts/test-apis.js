// Test API endpoints
async function testAPIs() {
  const baseUrl = 'http://localhost:3000';
  
  // Test Support Tickets API
  console.log('Testing Support Tickets API...');
  try {
    const response = await fetch(`${baseUrl}/api/admin/support/tickets`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Support Tickets API:', data.success ? 'Success' : 'Failed');
      console.log('Tickets count:', data.data?.tickets?.length || 0);
    } else {
      console.log('❌ Support Tickets API:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ Support Tickets API Error:', error.message);
  }
  
  // Test Announcements API
  console.log('\nTesting Announcements API...');
  try {
    const response = await fetch(`${baseUrl}/api/admin/announcements`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Announcements API:', data.success ? 'Success' : 'Failed');
      console.log('Announcements count:', data.data?.length || 0);
    } else {
      console.log('❌ Announcements API:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ Announcements API Error:', error.message);
  }
  
  // Test System Alerts API
  console.log('\nTesting System Alerts API...');
  try {
    const response = await fetch(`${baseUrl}/api/admin/system/alerts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ System Alerts API:', data.success ? 'Success' : 'Failed');
      console.log('Alerts count:', data.data?.length || 0);
    } else {
      console.log('❌ System Alerts API:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ System Alerts API Error:', error.message);
  }
  
  // Test Billing Records API
  console.log('\nTesting Billing Records API...');
  try {
    const response = await fetch(`${baseUrl}/api/admin/billing/records`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Billing Records API:', data.success ? 'Success' : 'Failed');
      console.log('Records count:', data.data?.records?.length || 0);
    } else {
      console.log('❌ Billing Records API:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ Billing Records API Error:', error.message);
  }
}

testAPIs();
