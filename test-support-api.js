// Test script for Support Tickets API
const http = require('http');

// Test API endpoint
async function testSupportAPI() {
  try {
    // First, try to get a real token by logging in
    console.log('Testing Support Tickets API...');
    
    // Test without token (should get 401)
    const response1 = await fetch('http://localhost:3000/api/admin/support/tickets?page=1&limit=20');
    console.log('Without token:', response1.status, response1.statusText);
    
    // Test with invalid token (should get 401)
    const response2 = await fetch('http://localhost:3000/api/admin/support/tickets?page=1&limit=20', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token'
      }
    });
    console.log('With invalid token:', response2.status, response2.statusText);
    
    // Try to get data from the response
    const data1 = await response1.json();
    console.log('Response without token:', data1);
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Simple fetch implementation for Node.js
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          statusText: res.statusMessage,
          json: () => Promise.resolve(JSON.parse(data))
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

testSupportAPI();
