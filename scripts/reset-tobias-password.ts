import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function resetPassword() {
  try {
    const userId = 'u_7mj6dqo3jme73vuwb';
    const hashedPassword = '$2b$10$GIrwpi3dXfCQik6EyNPK2Oc5x3i7uXw.dt3YmuIXxcj0m/JI6nkAu';
    const newPassword = 'Intellego2025!';

    // Update password
    await client.execute({
      sql: 'UPDATE User SET password = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      args: [hashedPassword, userId]
    });

    // Verify update
    const result = await client.execute({
      sql: 'SELECT id, name, email, updatedAt FROM User WHERE id = ?',
      args: [userId]
    });

    console.log('✅ Password reset successful!');
    console.log('\nUser Details:');
    console.log(JSON.stringify(result.rows[0], null, 2));
    console.log('\n📧 New temporary password:', newPassword);
    console.log('\nPlease share this password with the student and ask them to change it after first login.');

  } catch (error) {
    console.error('❌ Error resetting password:', error);
    process.exit(1);
  }
}

resetPassword();
