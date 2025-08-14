/**
 * Create Default Password Policy in Production
 * This fixes the API failures by ensuring a policy record exists
 */

const { createClient } = require('@libsql/client');

const client = createClient({
  url: "libsql://intellego-production-roddb.aws-us-east-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTQyNDUyNjUsImlkIjoiMzZlNDhmZTQtMGE3ZC00Yjk5LWIyZmEtMWFiOTBiZTVkMzUzIiwicmlkIjoiNmY2ODFjNWUtNDdiOS00ZjYwLWFkYjctNjA3NWNhMmZjMzUyIn0.X6NQ5rLuainoba0mZlOKx3O7LGB1AdUR3X3aQlqqiLHLUh9lJ2JIx1JdYEeSorAIciUL4PhVwK3cVi8pf7fUAw"
});

async function createDefaultPasswordPolicy() {
  try {
    console.log('🔐 Creating Default Password Policy...');
    
    // Check if policy already exists
    const existingPolicy = await client.execute('SELECT COUNT(*) as count FROM PasswordPolicy');
    
    if (existingPolicy.rows[0].count > 0) {
      console.log('✅ Password policy already exists, no action needed');
      return;
    }
    
    const now = new Date().toISOString();
    const policyId = `policy-${Date.now()}`;
    
    // Create default password policy
    await client.execute({
      sql: `INSERT INTO PasswordPolicy (
        id, minLength, requireUppercase, requireLowercase, 
        requireNumbers, requireSpecialChars, preventReuse, 
        reuseHistoryCount, maxAttempts, lockoutDuration,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        policyId,
        8,              // minLength
        1,              // requireUppercase (true)
        1,              // requireLowercase (true)  
        1,              // requireNumbers (true)
        1,              // requireSpecialChars (true)
        1,              // preventReuse (true)
        5,              // reuseHistoryCount
        5,              // maxAttempts
        300,            // lockoutDuration (5 minutes)
        now,            // createdAt
        now             // updatedAt
      ]
    });
    
    console.log('✅ Default password policy created successfully!');
    console.log('Policy details:');
    console.log('  - Minimum length: 8 characters');
    console.log('  - Requires: uppercase, lowercase, numbers, special chars');
    console.log('  - Prevents password reuse (last 5 passwords)');
    console.log('  - Max attempts: 5');
    console.log('  - Lockout duration: 5 minutes');
    
    // Verify creation
    const verification = await client.execute('SELECT * FROM PasswordPolicy');
    console.log('\n📊 Verification - Policy record:');
    console.log(verification.rows[0]);
    
    // Test the API endpoint logic
    console.log('\n🧪 Testing API Logic...');
    try {
      const policyTest = await client.execute(`
        SELECT 
          minLength,
          requireUppercase,
          requireLowercase, 
          requireNumbers,
          requireSpecialChars,
          preventReuse,
          reuseHistoryCount,
          maxAttempts,
          lockoutDuration
        FROM PasswordPolicy 
        LIMIT 1
      `);
      
      if (policyTest.rows.length > 0) {
        const policy = policyTest.rows[0];
        console.log('✅ Policy retrieval working:');
        console.log('  Requirements:');
        console.log(`    - Min length: ${policy.minLength}`);
        console.log(`    - Uppercase: ${policy.requireUppercase ? 'Required' : 'Optional'}`);
        console.log(`    - Lowercase: ${policy.requireLowercase ? 'Required' : 'Optional'}`);
        console.log(`    - Numbers: ${policy.requireNumbers ? 'Required' : 'Optional'}`);
        console.log(`    - Special chars: ${policy.requireSpecialChars ? 'Required' : 'Optional'}`);
        console.log(`    - Prevent reuse: ${policy.preventReuse ? 'Yes' : 'No'}`);
        
        // Log audit of policy creation
        await client.execute({
          sql: `INSERT INTO PasswordAudit (
            id, userId, action, performedBy, timestamp, reason
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          args: [
            `audit-policy-${Date.now()}`,
            'system',
            'CREATE_PASSWORD_POLICY',
            'deployment-script',
            now,
            'Default password policy created for production deployment'
          ]
        });
        
        console.log('📝 Audit log created for policy creation');
        
      } else {
        console.log('❌ Policy creation failed - no records found');
      }
      
    } catch (error) {
      console.log('❌ API logic test failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Failed to create password policy:', error);
  } finally {
    await client.close();
  }
}

createDefaultPasswordPolicy();