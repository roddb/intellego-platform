/**
 * Diagnose Schema Differences Between Local and Production
 */

const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');

// Production client
const productionClient = createClient({
  url: "libsql://intellego-production-roddb.aws-us-east-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTQyNDUyNjUsImlkIjoiMzZlNDhmZTQtMGE3ZC00Yjk5LWIyZmEtMWFiOTBiZTVkMzUzIiwicmlkIjoiNmY2ODFjNWUtNDdiOS00ZjYwLWFkYjctNjA3NWNhMmZjMzUyIn0.X6NQ5rLuainoba0mZlOKx3O7LGB1AdUR3X3aQlqqiLHLUh9lJ2JIx1JdYEeSorAIciUL4PhVwK3cVi8pf7fUAw"
});

// Local client  
const localClient = createClient({
  url: "file:./prisma/data/intellego.db"
});

async function analyzeSchemas() {
  console.log('🔍 Analyzing Schema Differences...');
  
  try {
    // Get production schema
    console.log('\n📊 Production Database Schema:');
    const prodTables = await productionClient.execute(`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `);
    
    console.log('Tables in production:');
    for (const table of prodTables.rows) {
      console.log(`  - ${table.name}`);
      
      // Get table structure
      const schema = await productionClient.execute(`PRAGMA table_info(${table.name})`);
      console.log(`    Columns (${schema.rows.length}):`);
      for (const col of schema.rows) {
        console.log(`      ${col.name} (${col.type})`);
      }
    }
    
    // Check specific PasswordPolicy table structure
    console.log('\n🔐 PasswordPolicy Table Analysis:');
    try {
      const policySchema = await productionClient.execute('PRAGMA table_info(PasswordPolicy)');
      console.log('Production PasswordPolicy columns:');
      const prodPolicyColumns = [];
      for (const col of policySchema.rows) {
        console.log(`  - ${col.name}: ${col.type} (default: ${col.dflt_value})`);
        prodPolicyColumns.push(col.name);
      }
      
      // Expected columns from our code
      const expectedColumns = [
        'id', 'minLength', 'requireUppercase', 'requireLowercase', 
        'requireNumbers', 'requireSpecialChars', 'preventReuse', 
        'reuseHistoryCount', 'maxAttempts', 'lockoutDuration',
        'createdAt', 'updatedAt'
      ];
      
      console.log('\n🎯 Expected columns:');
      const missingColumns = [];
      for (const col of expectedColumns) {
        const exists = prodPolicyColumns.includes(col);
        console.log(`  - ${col}: ${exists ? '✅' : '❌ MISSING'}`);
        if (!exists) missingColumns.push(col);
      }
      
      if (missingColumns.length > 0) {
        console.log('\n⚠️  Missing columns that need to be added:');
        for (const col of missingColumns) {
          console.log(`  - ${col}`);
        }
      }
      
      // Check if we have any policy records
      const policyCount = await productionClient.execute('SELECT COUNT(*) as count FROM PasswordPolicy');
      console.log(`\n📈 Policy records in production: ${policyCount.rows[0].count}`);
      
    } catch (error) {
      console.log('❌ PasswordPolicy table does not exist or has issues:', error.message);
    }
    
    // Check PasswordAudit table
    console.log('\n📋 PasswordAudit Table Analysis:');
    try {
      const auditSchema = await productionClient.execute('PRAGMA table_info(PasswordAudit)');
      console.log('Production PasswordAudit columns:');
      for (const col of auditSchema.rows) {
        console.log(`  - ${col.name}: ${col.type}`);
      }
      
      const auditCount = await productionClient.execute('SELECT COUNT(*) as count FROM PasswordAudit');
      console.log(`\n📈 Audit records in production: ${auditCount.rows[0].count}`);
      
    } catch (error) {
      console.log('❌ PasswordAudit table does not exist:', error.message);
    }
    
    // Test API endpoint failure
    console.log('\n🌐 Testing API Endpoint Behavior:');
    try {
      // Simulate the API call that's failing
      const testPolicy = await productionClient.execute(`
        SELECT * FROM PasswordPolicy LIMIT 1
      `);
      
      if (testPolicy.rows.length === 0) {
        console.log('⚠️  No password policy records found - need to create default policy');
      } else {
        console.log('✅ Password policy record exists');
        console.log('Policy data:', testPolicy.rows[0]);
      }
    } catch (error) {
      console.log('❌ Policy query failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Schema analysis failed:', error);
  } finally {
    await productionClient.close();
    await localClient.close();
  }
}

analyzeSchemas();