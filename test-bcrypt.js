const bcrypt = require('bcryptjs');

async function testBcrypt() {
  const password = 'test123';
  const existingHash = '$2b$12$mfHqNmGjO29ywkx4JWHAZ.iRBi6rIQlGWSia5dAd4wzlIzZNroqei';
  
  console.log('🔍 Testing bcrypt hash validity...');
  console.log('Password:', password);
  console.log('Hash:', existingHash);
  
  try {
    // Test existing hash
    const isValid = await bcrypt.compare(password, existingHash);
    console.log('✅ Existing hash valid:', isValid);
    
    // Generate new hash for comparison
    const newHash = await bcrypt.hash(password, 12);
    console.log('🆕 New hash:', newHash);
    
    // Test new hash
    const newHashValid = await bcrypt.compare(password, newHash);
    console.log('✅ New hash valid:', newHashValid);
    
    if (!isValid) {
      console.log('❌ PROBLEM: Existing hash is INVALID!');
      console.log('💡 Solution: Use new hash:', newHash);
    } else {
      console.log('✅ Hash is valid, problem might be elsewhere');
    }
    
  } catch (error) {
    console.error('❌ Error testing bcrypt:', error);
  }
}

testBcrypt();