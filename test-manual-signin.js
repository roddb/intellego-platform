const axios = require('axios');

async function testManualSignin() {
  console.log('🔍 MANUAL SIGNIN TEST\n');
  
  const baseURL = 'http://localhost:3000';
  const testCredentials = { 
    email: 'ugarciacanteli@gmail.com', 
    password: 'test123' 
  };
  
  try {
    // Step 1: Get CSRF token
    console.log('📡 Step 1: Getting CSRF token...');
    const csrfResponse = await axios.get(`${baseURL}/api/auth/csrf`);
    const csrfToken = csrfResponse.data.csrfToken;
    console.log('✅ CSRF token received:', csrfToken);
    
    // Step 2: Use signIn like the frontend would
    console.log('\n📡 Step 2: Testing signIn endpoint...');
    console.log('   Email:', testCredentials.email);
    console.log('   Password:', testCredentials.password);
    
    const signinData = new URLSearchParams();
    signinData.append('email', testCredentials.email);
    signinData.append('password', testCredentials.password);
    signinData.append('csrfToken', csrfToken);
    signinData.append('redirect', 'false');
    signinData.append('json', 'true');
    
    console.log('📡 Sending POST to /api/auth/signin/credentials...');
    
    const signinResponse = await axios.post(
      `${baseURL}/api/auth/signin/credentials`,
      signinData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        withCredentials: true,
        maxRedirects: 0,
        validateStatus: (status) => status < 500
      }
    );
    
    console.log('📋 SignIn response status:', signinResponse.status);
    console.log('📋 SignIn response data:', signinResponse.data);
    console.log('📋 SignIn response headers:', signinResponse.headers);
    
    // Check for cookies
    const cookies = signinResponse.headers['set-cookie'];
    console.log('📋 Response cookies:', cookies);
    
    if (signinResponse.data.error) {
      console.log('❌ SignIn error:', signinResponse.data.error);
    }
    
    if (signinResponse.data.url && !signinResponse.data.url.includes('error')) {
      console.log('✅ SignIn successful, redirect to:', signinResponse.data.url);
    }
    
  } catch (error) {
    console.error('❌ Error during signin test:', error.message);
    if (error.response) {
      console.log('   Response status:', error.response.status);
      console.log('   Response data:', error.response.data);
      console.log('   Response headers:', error.response.headers);
    }
  }
}

testManualSignin();