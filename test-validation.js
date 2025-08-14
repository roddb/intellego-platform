// Import database operations - using CommonJS for Node.js testing
const { validateUserPassword } = require('./dist/lib/db-operations.js');

async function testValidation() {
  console.log('🔍 Testing validateUserPassword function...');
  
  const testCredentials = [
    { email: 'ugarciacanteli@gmail.com', password: 'test123' },
    { email: 'pleitelmia@gmail.com', password: 'test123' },
    { email: 'invalid@example.com', password: 'wrong' }
  ];
  
  for (const creds of testCredentials) {
    try {
      console.log(`\n📧 Testing: ${creds.email}`);
      const result = await validateUserPassword(creds.email, creds.password);
      
      if (result) {
        console.log('✅ Validation SUCCESS');
        console.log('   User ID:', result.id);
        console.log('   Name:', result.name);
        console.log('   Student ID:', result.studentId);
        console.log('   Role:', result.role);
      } else {
        console.log('❌ Validation FAILED');
      }
    } catch (error) {
      console.error('❌ Error during validation:', error.message);
    }
  }
}

testValidation();