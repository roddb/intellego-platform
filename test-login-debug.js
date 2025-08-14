import { validateUserPassword, findUserByEmail } from './src/lib/db-operations.js';
import bcrypt from 'bcryptjs';

async function debugLogin() {
  console.log('🔍 DEBUG: Testing login for temporary credentials...\n');
  
  const testCredentials = [
    { email: 'ugarciacanteli@gmail.com', password: 'test123' },
    { email: 'pleitelmia@gmail.com', password: 'test123' }
  ];
  
  for (const creds of testCredentials) {
    console.log(`\n📧 Testing: ${creds.email}`);
    console.log(`🔑 Password: ${creds.password}`);
    
    try {
      // Step 1: Find user by email
      console.log('\n🔍 Step 1: Finding user by email...');
      const user = await findUserByEmail(creds.email);
      
      if (!user) {
        console.log('❌ User NOT found in database');
        continue;
      }
      
      console.log('✅ User found:');
      console.log('   ID:', user.id);
      console.log('   Name:', user.name);
      console.log('   Student ID:', user.studentId);
      console.log('   Password hash:', user.password);
      console.log('   Hash length:', String(user.password).length);
      
      // Step 2: Test bcrypt compare manually
      console.log('\n🔍 Step 2: Testing bcrypt.compare...');
      const passwordString = String(user.password);
      const isValidHash = await bcrypt.compare(creds.password, passwordString);
      
      console.log('   bcrypt.compare result:', isValidHash);
      
      if (!isValidHash) {
        console.log('❌ Password hash comparison FAILED');
        
        // Generate new hash for comparison
        console.log('\n🔧 Generating new hash for comparison...');
        const newHash = await bcrypt.hash(creds.password, 12);
        console.log('   New hash:', newHash);
        const newHashTest = await bcrypt.compare(creds.password, newHash);
        console.log('   New hash test:', newHashTest);
      }
      
      // Step 3: Test validateUserPassword function
      console.log('\n🔍 Step 3: Testing validateUserPassword function...');
      const validationResult = await validateUserPassword(creds.email, creds.password);
      
      if (validationResult) {
        console.log('✅ validateUserPassword SUCCESS');
        console.log('   Returned user ID:', validationResult.id);
        console.log('   Returned user name:', validationResult.name);
      } else {
        console.log('❌ validateUserPassword FAILED');
      }
      
    } catch (error) {
      console.error('❌ Error during test:', error.message);
      console.error('   Stack:', error.stack);
    }
  }
}

// Run the debug test
debugLogin().catch(console.error);