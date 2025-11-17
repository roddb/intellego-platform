import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

// Generic temporary password for all CONSUDEC students
const TEMPORARY_PASSWORD = 'Intellego2025!';

async function resetConsudecPasswords() {
  console.log('🔧 Resetting CONSUDEC student passwords...\n');

  try {
    // Get all CONSUDEC students
    const result = await client.execute({
      sql: 'SELECT id, name, email, studentId FROM User WHERE sede = ? ORDER BY studentId',
      args: ['CONSUDEC'],
    });

    console.log(`📊 Found ${result.rows.length} CONSUDEC students\n`);

    if (result.rows.length === 0) {
      console.log('❌ No CONSUDEC students found');
      return;
    }

    // Generate new password hash
    console.log('🔐 Generating new password hash...');
    const hashedPassword = await bcrypt.hash(TEMPORARY_PASSWORD, 12);
    console.log('✅ Password hash generated\n');

    // Update each user's password
    console.log('📝 Updating passwords...');
    console.log('─'.repeat(80));

    let successCount = 0;
    let failCount = 0;

    for (const user of result.rows) {
      try {
        const now = new Date().toISOString();

        await client.execute({
          sql: 'UPDATE User SET password = ?, updatedAt = ? WHERE id = ?',
          args: [hashedPassword, now, user.id],
        });

        console.log(`✅ ${user.name} (${user.studentId})`);
        successCount++;
      } catch (error: unknown) {
        console.error(`❌ Failed to update ${user.name}:`, error instanceof Error ? error.message : 'Unknown error');
        failCount++;
      }
    }

    console.log('─'.repeat(80));
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);

    // Verify one user's password
    console.log('\n🔍 Verifying password update...');
    const testUser = result.rows[0];
    const verifyResult = await client.execute({
      sql: 'SELECT password FROM User WHERE id = ?',
      args: [testUser.id],
    });

    if (verifyResult.rows.length > 0) {
      const storedHash = String(verifyResult.rows[0].password);
      const isValid = await bcrypt.compare(TEMPORARY_PASSWORD, storedHash);

      if (isValid) {
        console.log(`✅ Password verification SUCCESSFUL for ${testUser.name}`);
      } else {
        console.log(`❌ Password verification FAILED for ${testUser.name}`);
      }
    }

    // Print updated credentials
    console.log('\n🔑 UPDATED CREDENTIALS:\n');
    console.log('═'.repeat(80));
    console.log('Temporary Password (all students): Intellego2025!');
    console.log('═'.repeat(80));
    console.log('\nStudents:');
    result.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Student ID: ${user.studentId}`);
      console.log('─'.repeat(80));
    });

    console.log('\n✅ Password reset completed!');
    console.log('📧 Please inform students that their password has been reset to: Intellego2025!');
    console.log('⚠️  Ask them to change it after first login.\n');

  } catch (error: unknown) {
    console.error('❌ Error resetting passwords:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

resetConsudecPasswords();
