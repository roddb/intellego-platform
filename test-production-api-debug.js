/**
 * Test Production API for Debugging
 */

async function debugProductionAPI() {
  console.log('🔍 Testing Production API Debug...');
  
  const baseUrl = 'https://intellego-platform.vercel.app';
  
  // Test different endpoints
  const endpoints = [
    { path: '/api/user/password/validate', method: 'GET', name: 'Password Policy' },
    { path: '/api/auth/providers', method: 'GET', name: 'Auth Providers' },
    { path: '/api/health-check', method: 'GET', name: 'Health Check' },
    { path: '/api/turso-health', method: 'GET', name: 'Database Health' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n🧪 Testing ${endpoint.name}:`);
      
      const response = await fetch(`${baseUrl}${endpoint.path}`, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`  Status: ${response.status}`);
      
      const text = await response.text();
      console.log(`  Response (first 200 chars): ${text.substring(0, 200)}`);
      
      // Try to parse as JSON
      try {
        const json = JSON.parse(text);
        if (json.error) {
          console.log(`  ❌ Error: ${json.error}`);
        }
        if (json.message) {
          console.log(`  💬 Message: ${json.message}`);
        }
      } catch (e) {
        console.log(`  📝 Text response (not JSON)`);
      }
      
    } catch (error) {
      console.log(`  ❌ Request failed: ${error.message}`);
    }
  }
  
  // Test password validation with POST
  console.log('\n🔐 Testing Password Validation with POST:');
  try {
    const response = await fetch(`${baseUrl}/api/user/password/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        password: 'TestPassword123!',
        checkReuse: false
      })
    });
    
    console.log(`  Status: ${response.status}`);
    const text = await response.text();
    console.log(`  Response: ${text}`);
    
  } catch (error) {
    console.log(`  ❌ POST request failed: ${error.message}`);
  }
}

debugProductionAPI();