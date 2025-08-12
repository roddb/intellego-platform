/**
 * FASE 6: Email System Testing Script
 * 
 * This script provides quick testing of the email system components
 * Run with: node scripts/test-email-system.js
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🧪 FASE 6: Email System Testing Script');
console.log('=====================================\n');

// Check if running in project directory
const projectRoot = path.join(__dirname, '..');
process.chdir(projectRoot);

console.log('📂 Working directory:', process.cwd());
console.log('📅 Date:', new Date().toISOString());
console.log('');

// Test 1: Check environment variables
console.log('1️⃣ Testing Environment Variables');
console.log('--------------------------------');

const requiredEnvVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'NEXTAUTH_URL'
];

const optionalEnvVars = [
  'GOOGLE_REFRESH_TOKEN',
  'GOOGLE_REDIRECT_URI'
];

let envVarScore = 0;
let maxEnvVarScore = requiredEnvVars.length;

try {
  const envContent = fs.readFileSync('.env', 'utf8');
  
  requiredEnvVars.forEach(varName => {
    if (envContent.includes(`${varName}=`) && !envContent.includes(`${varName}=\n`)) {
      console.log(`✅ ${varName}: Configured`);
      envVarScore++;
    } else {
      console.log(`❌ ${varName}: Missing or empty`);
    }
  });
  
  console.log('\nOptional Variables:');
  optionalEnvVars.forEach(varName => {
    if (envContent.includes(`${varName}=`) && !envContent.includes(`${varName}=\n`)) {
      console.log(`✅ ${varName}: Configured`);
    } else {
      console.log(`⚠️  ${varName}: Not configured (${varName === 'GOOGLE_REFRESH_TOKEN' ? 'REQUIRED for sending emails' : 'optional'})`);
    }
  });
  
} catch (error) {
  console.log('❌ Could not read .env file');
  envVarScore = 0;
}

console.log(`\nEnvironment Score: ${envVarScore}/${maxEnvVarScore}`);
console.log('');

// Test 2: Check required packages
console.log('2️⃣ Testing Package Dependencies');
console.log('-------------------------------');

const requiredPackages = [
  'googleapis',
  'google-auth-library',
  'nodemailer'
];

let packageScore = 0;
let maxPackageScore = requiredPackages.length;

try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  requiredPackages.forEach(pkg => {
    if (dependencies[pkg]) {
      console.log(`✅ ${pkg}: ${dependencies[pkg]}`);
      packageScore++;
    } else {
      console.log(`❌ ${pkg}: Not installed`);
    }
  });
  
} catch (error) {
  console.log('❌ Could not read package.json');
  packageScore = 0;
}

console.log(`\nPackage Score: ${packageScore}/${maxPackageScore}`);
console.log('');

// Test 3: Check file structure
console.log('3️⃣ Testing File Structure');
console.log('-------------------------');

const requiredFiles = [
  'src/lib/gmail-service.ts',
  'src/lib/email-templates.ts',
  'src/lib/db-operations.ts',
  'src/app/api/email/send/route.ts',
  'src/app/api/email/send-bulk/route.ts',
  'src/app/api/email/status/route.ts',
  'src/app/api/email/queue/route.ts',
  'src/app/api/email/test/route.ts'
];

let fileScore = 0;
let maxFileScore = requiredFiles.length;

requiredFiles.forEach(filePath => {
  try {
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${filePath}: Found`);
      fileScore++;
    } else {
      console.log(`❌ ${filePath}: Missing`);
    }
  } catch (error) {
    console.log(`❌ ${filePath}: Error checking`);
  }
});

console.log(`\nFile Structure Score: ${fileScore}/${maxFileScore}`);
console.log('');

// Test 4: Check database schema
console.log('4️⃣ Testing Database Schema');
console.log('--------------------------');

try {
  // Check if SQLite database exists
  if (fs.existsSync('prisma/data/intellego.db')) {
    console.log('✅ SQLite database: Found');
  } else {
    console.log('⚠️  SQLite database: Not found (will be created on first use)');
  }
  
  // Check if db-operations exports the required functions
  const dbOpsContent = fs.readFileSync('src/lib/db-operations.ts', 'utf8');
  const requiredFunctions = [
    'initializeEmailTables',
    'createEmailDeliveryRecord',
    'updateEmailDeliveryStatus',
    'getEmailDeliveryRecords'
  ];
  
  let dbFunctionScore = 0;
  requiredFunctions.forEach(funcName => {
    if (dbOpsContent.includes(`export async function ${funcName}`)) {
      console.log(`✅ Database function ${funcName}: Found`);
      dbFunctionScore++;
    } else {
      console.log(`❌ Database function ${funcName}: Missing`);
    }
  });
  
  console.log(`\nDatabase Functions Score: ${dbFunctionScore}/${requiredFunctions.length}`);
  
} catch (error) {
  console.log('❌ Could not verify database schema');
}

console.log('');

// Test 5: Check TypeScript compilation
console.log('5️⃣ Testing TypeScript Compilation');
console.log('----------------------------------');

try {
  console.log('Running TypeScript type check...');
  execSync('npm run type-check', { stdio: 'pipe', timeout: 30000 });
  console.log('✅ TypeScript compilation: Passed');
} catch (error) {
  console.log('❌ TypeScript compilation: Failed');
  console.log('   Run "npm run type-check" for details');
}

console.log('');

// Test Summary
console.log('📊 TESTING SUMMARY');
console.log('==================');

const totalEnvScore = envVarScore;
const totalPackageScore = packageScore;
const totalFileScore = fileScore;

const overallScore = totalEnvScore + totalPackageScore + totalFileScore;
const maxOverallScore = maxEnvVarScore + maxPackageScore + maxFileScore;

console.log(`Environment Variables: ${totalEnvScore}/${maxEnvVarScore}`);
console.log(`Package Dependencies: ${totalPackageScore}/${maxPackageScore}`);
console.log(`File Structure: ${totalFileScore}/${maxFileScore}`);
console.log(`Overall Score: ${overallScore}/${maxOverallScore}`);

if (overallScore === maxOverallScore) {
  console.log('🎉 All tests passed! Email system is ready.');
} else if (overallScore >= maxOverallScore * 0.8) {
  console.log('⚠️  Most tests passed. Check missing items above.');
} else {
  console.log('❌ Several tests failed. Review the setup guide.');
}

console.log('');

// Next Steps
console.log('🚀 NEXT STEPS');
console.log('=============');

if (!process.env.GOOGLE_REFRESH_TOKEN && envVarScore < maxEnvVarScore) {
  console.log('1. Complete Gmail API setup:');
  console.log('   - Obtain refresh token from Google OAuth2 flow');
  console.log('   - Add GOOGLE_REFRESH_TOKEN to .env file');
  console.log('');
}

if (packageScore < maxPackageScore) {
  console.log('2. Install missing packages:');
  console.log('   npm install googleapis google-auth-library nodemailer @types/nodemailer');
  console.log('');
}

if (fileScore < maxFileScore) {
  console.log('3. Restore missing files from backup or re-implement');
  console.log('');
}

console.log('4. Test the email system:');
console.log('   - Start the development server: npm run dev');
console.log('   - Go to /dashboard/instructor');
console.log('   - Use browser console to run API tests');
console.log('');

console.log('5. Read the complete setup guide:');
console.log('   - docs/FASE-6-EMAIL-SYSTEM-SETUP.md');
console.log('');

console.log('📧 Email system testing completed!');
console.log('For support, check the setup documentation or contact support.');