const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function testDirectLogin() {
  console.log('🔍 DIRECT DATABASE LOGIN TEST\n');
  
  const dbPath = path.join(__dirname, 'prisma', 'data', 'intellego.db');
  console.log('📁 Database path:', dbPath);
  
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('❌ Error opening database:', err);
      return;
    }
    console.log('✅ Connected to SQLite database');
  });
  
  const testCredentials = [
    { email: 'ugarciacanteli@gmail.com', password: 'test123' },
    { email: 'pleitelmia@gmail.com', password: 'test123' }
  ];
  
  for (const creds of testCredentials) {
    console.log(`\n📧 Testing: ${creds.email}`);
    console.log(`🔑 Password: ${creds.password}`);
    
    try {
      // Query user from database
      const user = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM User WHERE email = ?', [creds.email], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      
      if (!user) {
        console.log('❌ User NOT found in database');
        continue;
      }
      
      console.log('✅ User found:');
      console.log('   ID:', user.id);
      console.log('   Name:', user.name);
      console.log('   Student ID:', user.studentId);
      console.log('   Email:', user.email);
      console.log('   Password hash:', user.password);
      console.log('   Hash length:', user.password ? user.password.length : 'null');
      
      // Test password
      if (user.password) {
        console.log('\n🔍 Testing password comparison...');
        const isValid = await bcrypt.compare(creds.password, user.password);
        console.log('   bcrypt.compare result:', isValid);
        
        if (isValid) {
          console.log('✅ PASSWORD IS VALID! Login should work.');
        } else {
          console.log('❌ PASSWORD IS INVALID!');
          
          // Debug: show what the hash should be
          const correctHash = await bcrypt.hash(creds.password, 12);
          console.log('   Expected hash format:', correctHash);
          const testCorrectHash = await bcrypt.compare(creds.password, correctHash);
          console.log('   Test with new hash:', testCorrectHash);
        }
      } else {
        console.log('❌ No password hash found');
      }
      
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }
  
  db.close((err) => {
    if (err) {
      console.error('❌ Error closing database:', err);
    } else {
      console.log('\n✅ Database connection closed');
    }
  });
}

testDirectLogin();