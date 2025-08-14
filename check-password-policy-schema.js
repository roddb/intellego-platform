/**
 * Check Password Policy Schema in Production
 */

const { createClient } = require('@libsql/client');

const client = createClient({
  url: "libsql://intellego-production-roddb.aws-us-east-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTQyNDUyNjUsImlkIjoiMzZlNDhmZTQtMGE3ZC00Yjk5LWIyZmEtMWFiOTBiZTVkMzUzIiwicmlkIjoiNmY2ODFjNWUtNDdiOS00ZjYwLWFkYjctNjA3NWNhMmZjMzUyIn0.X6NQ5rLuainoba0mZlOKx3O7LGB1AdUR3X3aQlqqiLHLUh9lJ2JIx1JdYEeSorAIciUL4PhVwK3cVi8pf7fUAw"
});

async function checkPasswordPolicySchema() {
  try {
    console.log('🔍 Checking PasswordPolicy Schema...');
    
    // Get table schema
    const schema = await client.execute('PRAGMA table_info(PasswordPolicy)');
    console.log('\n📊 Current PasswordPolicy columns:');
    
    const existingColumns = [];
    for (const col of schema.rows) {
      console.log(`  - ${col.name}: ${col.type} (${col.notnull ? 'NOT NULL' : 'NULL'})`);
      existingColumns.push(col.name);
    }
    
    // Check for missing columns that our code expects
    const expectedColumns = {
      'isActive': 'INTEGER DEFAULT 1',
      'policyName': 'TEXT',
      'description': 'TEXT',
      'maxLength': 'INTEGER DEFAULT 128',
      'allowedSpecialChars': 'TEXT DEFAULT "!@#$%^&*()_+-=[]{}|;:,.<>?"',
      'expirationDays': 'INTEGER',
      'appliesTo': 'TEXT DEFAULT "ALL"'
    };
    
    console.log('\n🎯 Column Analysis:');
    const missingColumns = [];
    
    for (const [columnName, columnDef] of Object.entries(expectedColumns)) {
      const exists = existingColumns.includes(columnName);
      console.log(`  - ${columnName}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
      if (!exists) {
        missingColumns.push({ name: columnName, definition: columnDef });
      }
    }
    
    // Check current records
    const records = await client.execute('SELECT * FROM PasswordPolicy');
    console.log(`\n📈 Current records: ${records.rows.length}`);
    
    if (records.rows.length > 0) {
      console.log('📝 First record:');
      console.log(records.rows[0]);
    }
    
    // Show what needs to be fixed
    if (missingColumns.length > 0) {
      console.log('\n🔧 SQL commands to add missing columns:');
      for (const col of missingColumns) {
        console.log(`ALTER TABLE PasswordPolicy ADD COLUMN ${col.name} ${col.definition};`);
      }
      
      console.log('\n🔧 Update existing record with missing values:');
      console.log(`UPDATE PasswordPolicy SET 
        isActive = 1,
        policyName = 'default_policy',
        description = 'Default password policy for Intellego Platform',
        maxLength = 128,
        allowedSpecialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?',
        appliesTo = 'ALL'
      WHERE id IS NOT NULL;`);
    }
    
  } catch (error) {
    console.error('❌ Error checking schema:', error);
  } finally {
    await client.close();
  }
}

checkPasswordPolicySchema();