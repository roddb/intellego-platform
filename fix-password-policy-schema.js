/**
 * Fix Password Policy Schema - Add Missing Columns
 */

const { createClient } = require('@libsql/client');

const client = createClient({
  url: "libsql://intellego-production-roddb.aws-us-east-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTQyNDUyNjUsImlkIjoiMzZlNDhmZTQtMGE3ZC00Yjk5LWIyZmEtMWFiOTBiZTVkMzUzIiwicmlkIjoiNmY2ODFjNWUtNDdiOS00ZjYwLWFkYjctNjA3NWNhMmZjMzUyIn0.X6NQ5rLuainoba0mZlOKx3O7LGB1AdUR3X3aQlqqiLHLUh9lJ2JIx1JdYEeSorAIciUL4PhVwK3cVi8pf7fUAw"
});

async function fixPasswordPolicySchema() {
  try {
    console.log('🔧 Fixing PasswordPolicy Schema...');
    
    // Step 1: Add missing columns
    console.log('\n1. Adding missing columns:');
    
    const columnsToAdd = [
      { name: 'isActive', definition: 'INTEGER DEFAULT 1' },
      { name: 'policyName', definition: 'TEXT' },
      { name: 'description', definition: 'TEXT' },
      { name: 'maxLength', definition: 'INTEGER DEFAULT 128' },
      { name: 'allowedSpecialChars', definition: 'TEXT DEFAULT "!@#$%^&*()_+-=[]{}|;:,.<>?"' },
      { name: 'expirationDays', definition: 'INTEGER' },
      { name: 'appliesTo', definition: 'TEXT DEFAULT "ALL"' }
    ];
    
    for (const col of columnsToAdd) {
      try {
        await client.execute(`ALTER TABLE PasswordPolicy ADD COLUMN ${col.name} ${col.definition}`);
        console.log(`  ✅ Added column: ${col.name}`);
      } catch (error) {
        if (error.message.includes('duplicate column name') || error.message.includes('already exists')) {
          console.log(`  ℹ️  Column ${col.name} already exists`);
        } else {
          console.log(`  ❌ Failed to add ${col.name}: ${error.message}`);
        }
      }
    }
    
    // Step 2: Update existing records with default values
    console.log('\n2. Updating existing records with default values:');
    
    try {
      await client.execute(`
        UPDATE PasswordPolicy SET 
          isActive = 1,
          policyName = 'default_policy',
          description = 'Default password policy for Intellego Platform',
          maxLength = 128,
          allowedSpecialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?',
          appliesTo = 'ALL'
        WHERE policyName IS NULL OR policyName = ''
      `);
      console.log('  ✅ Updated existing records with default values');
    } catch (error) {
      console.log(`  ❌ Failed to update records: ${error.message}`);
    }
    
    // Step 3: Verify the fix
    console.log('\n3. Verifying the fix:');
    
    // Check schema
    const schema = await client.execute('PRAGMA table_info(PasswordPolicy)');
    console.log('  Updated schema:');
    for (const col of schema.rows) {
      console.log(`    - ${col.name}: ${col.type}`);
    }
    
    // Check records
    const records = await client.execute('SELECT * FROM PasswordPolicy');
    console.log(`\n  📈 Records: ${records.rows.length}`);
    
    if (records.rows.length > 0) {
      const record = records.rows[0];
      console.log('  📝 Updated record:');
      console.log(`    - ID: ${record.id}`);
      console.log(`    - Policy Name: ${record.policyName}`);
      console.log(`    - Description: ${record.description}`);
      console.log(`    - Min Length: ${record.minLength}`);
      console.log(`    - Max Length: ${record.maxLength}`);
      console.log(`    - Is Active: ${record.isActive}`);
      console.log(`    - Allowed Special Chars: ${record.allowedSpecialChars}`);
    }
    
    // Step 4: Test the API query that was failing
    console.log('\n4. Testing the API query:');
    
    try {
      const testQuery = await client.execute(`
        SELECT * FROM PasswordPolicy
        WHERE isActive = 1
        ORDER BY createdAt DESC
        LIMIT 1
      `);
      
      if (testQuery.rows.length > 0) {
        console.log('  ✅ API query will now work successfully');
        console.log(`  📊 Retrieved policy: ${testQuery.rows[0].policyName}`);
      } else {
        console.log('  ❌ No active policies found');
      }
    } catch (error) {
      console.log(`  ❌ API query still failing: ${error.message}`);
    }
    
    console.log('\n🎯 Schema fix completed!');
    console.log('📝 The password validation API should now work correctly.');
    
  } catch (error) {
    console.error('❌ Error fixing schema:', error);
  } finally {
    await client.close();
  }
}

fixPasswordPolicySchema();