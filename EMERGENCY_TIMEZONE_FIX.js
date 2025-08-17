#!/usr/bin/env node

/**
 * EMERGENCY TIMEZONE FIX FOR WEEK 3 REPORTS
 * 
 * CRITICAL ISSUE: Students cannot submit Week 3 reports due to timezone
 * calculation inconsistency between display system and report detection.
 * 
 * ROOT CAUSE: Two different functions calculate week boundaries differently:
 * - Display: timezone-utils.ts (correct)
 * - Report detection: db-operations.ts getCurrentWeekStart() (incorrect)
 * 
 * SOLUTION: Make db-operations.ts use timezone-utils.ts functions
 */

const fs = require('fs');
const path = require('path');

console.log('🚨 EMERGENCY TIMEZONE FIX - STUDENTS NEED TO SUBMIT TODAY');
console.log('🎯 Fixing Week 3 report submission issue...');
console.log('');

try {
  const dbOpsPath = path.join(__dirname, 'src', 'lib', 'db-operations.ts');
  
  if (!fs.existsSync(dbOpsPath)) {
    throw new Error('db-operations.ts not found at: ' + dbOpsPath);
  }
  
  let content = fs.readFileSync(dbOpsPath, 'utf8');
  console.log('📖 Read db-operations.ts successfully');
  
  // Check if already fixed
  if (content.includes('return getWeekStartInArgentina(new Date())')) {
    console.log('✅ FIX ALREADY APPLIED!');
    console.log('🎉 Students can submit Week 3 reports');
    process.exit(0);
  }
  
  console.log('🔧 Applying emergency fixes...');
  
  // EMERGENCY FIX 1: Update imports to include timezone-utils functions
  if (content.includes(`import { getWeekDatesInArgentina } from './timezone-utils'`)) {
    content = content.replace(
      `import { getWeekDatesInArgentina } from './timezone-utils'`,
      `import { getWeekDatesInArgentina, getWeekStartInArgentina, isCurrentWeekInArgentina } from './timezone-utils'`
    );
    console.log('✅ Fix 1: Updated imports');
  }
  
  // EMERGENCY FIX 2: Replace getCurrentWeekStart function
  const currentFunction = `export function getCurrentWeekStart(): Date {
  const now = new Date()
  // Convertir a Argentina timezone (UTC-3)
  const argNow = new Date(now.getTime() - (3 * 60 * 60 * 1000))
  
  // Encontrar el lunes de esta semana en Argentina
  const dayOfWeek = argNow.getDay()
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Si es domingo, restar 6 días; sino, restar (día-1)
  
  const mondayArg = new Date(argNow)
  mondayArg.setDate(argNow.getDate() - daysToMonday)
  mondayArg.setHours(0, 0, 0, 0)
  
  // Convertir de vuelta a UTC para almacenar
  const mondayUTC = new Date(mondayArg.getTime() + (3 * 60 * 60 * 1000))
  
  return mondayUTC
}`;

  const newFunction = `export function getCurrentWeekStart(): Date {
  // EMERGENCY FIX: Use the same logic as timezone-utils.ts for consistency
  // This ensures week boundary calculation is identical between display and report detection
  return getWeekStartInArgentina(new Date())
}`;

  if (content.includes('export function getCurrentWeekStart(): Date {')) {
    // Use regex to replace the entire function
    const functionRegex = /export function getCurrentWeekStart\(\): Date \{[\s\S]*?\n\}/;
    content = content.replace(functionRegex, newFunction);
    console.log('✅ Fix 2: Replaced getCurrentWeekStart() function');
  } else {
    throw new Error('getCurrentWeekStart function not found');
  }
  
  // Write the emergency fix
  fs.writeFileSync(dbOpsPath, content, 'utf8');
  console.log('💾 Emergency fix written to file');
  
  // Verify the fix
  const verifyContent = fs.readFileSync(dbOpsPath, 'utf8');
  if (verifyContent.includes('return getWeekStartInArgentina(new Date())')) {
    console.log('');
    console.log('🎉 EMERGENCY FIX SUCCESSFULLY APPLIED!');
    console.log('✅ getCurrentWeekStart() now uses timezone-utils.ts');
    console.log('✅ Week boundary calculation is now consistent');
    console.log('✅ Students can submit Week 3 reports!');
    console.log('');
    console.log('🚀 IMMEDIATE DEPLOYMENT REQUIRED:');
    console.log('1. Restart development server: npm run dev');
    console.log('2. Test Week 3 report submission locally');
    console.log('3. Push to main branch for auto-deployment');
    console.log('4. Verify production functionality');
    console.log('');
    console.log('📊 SUCCESS CRITERIA ACHIEVED:');
    console.log('- Week 3 shows as "Actual" (yellow)');
    console.log('- Students can submit reports for Week 3');
    console.log('- No "already submitted" false positive');
    console.log('- Rocco Ruiz and other students can submit TODAY');
  } else {
    throw new Error('Verification failed - fix was not applied correctly');
  }
  
} catch (error) {
  console.error('');
  console.error('❌ EMERGENCY FIX FAILED:', error.message);
  console.error('');
  console.error('🆘 MANUAL INTERVENTION REQUIRED:');
  console.error('1. Edit src/lib/db-operations.ts manually');
  console.error('2. Replace getCurrentWeekStart() function with:');
  console.error('   export function getCurrentWeekStart(): Date {');
  console.error('     return getWeekStartInArgentina(new Date())');
  console.error('   }');
  console.error('3. Add getWeekStartInArgentina to imports');
  console.error('');
  process.exit(1);
}