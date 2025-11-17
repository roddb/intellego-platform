import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const TEST_EMAIL = 'paulasidabraandrich@gmail.com';
const TEST_PASSWORD = 'Intellego2025!';

async function testPasswordValidation() {
  console.log('🔍 Testing password validation...\n');

  try {
    // Get user from database
    const result = await client.execute({
      sql: 'SELECT email, name, password FROM User WHERE email = ?',
      args: [TEST_EMAIL],
    });

    if (result.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }

    const user = result.rows[0];
    const storedHash = String(user.password);

    console.log('User found:', user.name);
    console.log('Email:', user.email);
    console.log('Password hash:', storedHash);
    console.log('Hash length:', storedHash.length);
    console.log('Hash prefix:', storedHash.substring(0, 10));
    console.log('\nTesting password:', TEST_PASSWORD);
    console.log('─'.repeat(80));

    // Test password comparison
    const isValid = await bcrypt.compare(TEST_PASSWORD, storedHash);

    console.log('\n✅ Password validation result:', isValid);

    if (isValid) {
      console.log('✅ Password is CORRECT! Authentication should work.');
    } else {
      console.log('❌ Password is INCORRECT! This is the problem.');

      // Try to generate a new hash and compare
      console.log('\n🔧 Generating new hash for the same password...');
      const newHash = await bcrypt.hash(TEST_PASSWORD, 12);
      console.log('New hash:', newHash);

      const newHashValid = await bcrypt.compare(TEST_PASSWORD, newHash);
      console.log('New hash validation:', newHashValid);

      // Compare the two hashes
      console.log('\n📊 Hash comparison:');
      console.log('Stored hash:', storedHash);
      console.log('New hash:   ', newHash);
      console.log('Are they different?', storedHash !== newHash);
      console.log('(This is expected - bcrypt generates different salts)');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testPasswordValidation();
