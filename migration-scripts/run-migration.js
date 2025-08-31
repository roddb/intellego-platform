#!/usr/bin/env node

const readline = require('readline');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise(resolve => rl.question(query, resolve));

console.log('='.repeat(70));
console.log('🚀 TURSO DATABASE MIGRATION TOOL');
console.log('='.repeat(70));
console.log('\nThis tool will help you migrate your Turso production database.');
console.log('Make sure you have set the following environment variables:');
console.log('  • TURSO_DATABASE_URL');
console.log('  • TURSO_AUTH_TOKEN\n');

async function runMigration() {
  try {
    // Check environment variables
    if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
      console.log('❌ ERROR: Missing Turso credentials!');
      console.log('\nPlease set the environment variables and try again:');
      console.log('  export TURSO_DATABASE_URL="your-database-url"');
      console.log('  export TURSO_AUTH_TOKEN="your-auth-token"\n');
      process.exit(1);
    }
    
    console.log('✅ Turso credentials found\n');
    console.log('Available operations:');
    console.log('  1. Backup production database');
    console.log('  2. Create Feedback table');
    console.log('  3. Normalize timestamps');
    console.log('  4. Validate migration');
    console.log('  5. Run full migration (all steps)');
    console.log('  0. Exit\n');
    
    const choice = await question('Select an operation (0-5): ');
    console.log();
    
    switch(choice) {
      case '1':
        console.log('📦 Running backup...\n');
        execSync('node backup-production.js', { 
          stdio: 'inherit', 
          cwd: __dirname 
        });
        break;
        
      case '2':
        console.log('📊 Creating Feedback table...\n');
        const dryRun = await question('Run in DRY RUN mode? (Y/n): ');
        const feedbackCmd = dryRun.toLowerCase() === 'n' 
          ? 'node migrate-feedback.js' 
          : 'node migrate-feedback.js --dry-run';
        execSync(feedbackCmd, { 
          stdio: 'inherit', 
          cwd: __dirname 
        });
        break;
        
      case '3':
        console.log('🔧 Normalizing timestamps...\n');
        const execute = await question('Run in EXECUTE mode? (y/N): ');
        const normalizeCmd = execute.toLowerCase() === 'y'
          ? 'node normalize-production-timestamps.js --execute'
          : 'node normalize-production-timestamps.js';
        execSync(normalizeCmd, { 
          stdio: 'inherit', 
          cwd: __dirname 
        });
        break;
        
      case '4':
        console.log('🔍 Validating migration...\n');
        execSync('node validate-migration.js', { 
          stdio: 'inherit', 
          cwd: __dirname 
        });
        break;
        
      case '5':
        console.log('🚀 Running FULL MIGRATION...\n');
        console.log('This will:');
        console.log('  1. Backup the database');
        console.log('  2. Create Feedback table');
        console.log('  3. Normalize timestamps');
        console.log('  4. Validate everything\n');
        
        const confirm = await question('Are you SURE you want to proceed? (yes/NO): ');
        
        if (confirm === 'yes') {
          console.log('\n='.repeat(70));
          console.log('STARTING FULL MIGRATION');
          console.log('='.repeat(70));
          
          // Step 1: Backup
          console.log('\n[1/4] Creating backup...\n');
          execSync('node backup-production.js', { 
            stdio: 'inherit', 
            cwd: __dirname 
          });
          
          // Step 2: Create Feedback table
          console.log('\n[2/4] Creating Feedback table...\n');
          execSync('node migrate-feedback.js', { 
            stdio: 'inherit', 
            cwd: __dirname 
          });
          
          // Step 3: Normalize timestamps
          console.log('\n[3/4] Normalizing timestamps...\n');
          execSync('node normalize-production-timestamps.js --execute', { 
            stdio: 'inherit', 
            cwd: __dirname 
          });
          
          // Step 4: Validate
          console.log('\n[4/4] Validating migration...\n');
          execSync('node validate-migration.js', { 
            stdio: 'inherit', 
            cwd: __dirname 
          });
          
          console.log('\n='.repeat(70));
          console.log('✅ FULL MIGRATION COMPLETED!');
          console.log('='.repeat(70));
          
        } else {
          console.log('Migration cancelled.');
        }
        break;
        
      case '0':
        console.log('Exiting...');
        break;
        
      default:
        console.log('Invalid option. Please try again.');
        await runMigration();
        return;
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

runMigration();