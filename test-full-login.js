const axios = require('axios');

async function testFullLogin() {
  console.log('🔍 FULL LOGIN FLOW TEST\n');
  
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
    
    // Step 2: Attempt login
    console.log('\n📡 Step 2: Attempting login...');
    console.log('   Email:', testCredentials.email);
    console.log('   Password:', testCredentials.password);
    
    const loginData = new URLSearchParams();
    loginData.append('email', testCredentials.email);
    loginData.append('password', testCredentials.password);
    loginData.append('csrfToken', csrfToken);
    loginData.append('redirect', 'false');
    loginData.append('json', 'true');
    
    const loginResponse = await axios.post(
      `${baseURL}/api/auth/callback/credentials`,
      loginData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        withCredentials: true,
        maxRedirects: 0, // Don't follow redirects
        validateStatus: (status) => status < 500 // Accept 4xx responses
      }
    );
    
    console.log('📋 Login response status:', loginResponse.status);
    console.log('📋 Login response data:', loginResponse.data);
    
    if (loginResponse.status === 200 && loginResponse.data.url) {
      if (loginResponse.data.url.includes('error')) {
        console.log('❌ Login failed with error');
      } else {
        console.log('✅ Login appears successful!');
        console.log('   Redirect URL:', loginResponse.data.url);
      }
    }
    
    // Step 3: Check session
    console.log('\n📡 Step 3: Checking session...');
    const sessionResponse = await axios.get(
      `${baseURL}/api/auth/session`,
      {
        headers: {
          Cookie: loginResponse.headers['set-cookie']?.join('; ') || ''
        }
      }
    );
    
    console.log('📋 Session response:', sessionResponse.data);
    
    if (sessionResponse.data.user) {
      console.log('✅ SESSION ESTABLISHED!');
      console.log('   User:', sessionResponse.data.user);
    } else {
      console.log('❌ No session found');
    }
    
  } catch (error) {
    console.error('❌ Error during login test:', error.message);
    if (error.response) {
      console.log('   Response status:', error.response.status);
      console.log('   Response data:', error.response.data);
    }
  }
}

// Install axios first: npm install axios
testFullLogin();