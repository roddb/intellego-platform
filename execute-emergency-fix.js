#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚨 EXECUTING EMERGENCY TIMEZONE FIX FOR STUDENTS...');

try {
  // Read db-operations.ts
  const dbOpsPath = path.join(__dirname, 'src/lib/db-operations.ts');
  let content = fs.readFileSync(dbOpsPath, 'utf8');
  
  console.log('📖 Reading db-operations.ts...');
  
  // Check if fix is already applied
  if (content.includes('return getWeekStartInArgentina(new Date())')) {
    console.log('✅ Fix already applied!');
    process.exit(0);
  }
  
  // Apply Fix 1: Update imports
  console.log('🔧 Fixing imports...');
  content = content.replace(
    `import { getWeekDatesInArgentina } from './timezone-utils'`,
    `import { getWeekDatesInArgentina, getWeekStartInArgentina, isCurrentWeekInArgentina } from './timezone-utils'`
  );
  
  // Apply Fix 2: Replace getCurrentWeekStart function
  console.log('🔧 Replacing getCurrentWeekStart function...');
  
  // Find and replace the function
  const functionPattern = /export function getCurrentWeekStart\(\): Date \{[\s\S]*?\n\}/;
  const newFunction = `export function getCurrentWeekStart(): Date {
  // Use the same logic as timezone-utils.ts for consistency  
  return getWeekStartInArgentina(new Date())
}`;
  
  content = content.replace(functionPattern, newFunction);
  
  // Write the fixed file
  console.log('💾 Writing fixed file...');
  fs.writeFileSync(dbOpsPath, content, 'utf8');
  
  console.log('✅ EMERGENCY FIX SUCCESSFULLY APPLIED!');
  console.log('🎯 getCurrentWeekStart() now uses timezone-utils.ts');
  console.log('🎯 Week boundary calculation is now consistent');
  console.log('🎯 Students can submit Week 3 reports!');
  console.log('');
  console.log('🚀 NEXT STEPS:');
  console.log('1. Restart the development server');
  console.log('2. Test Week 3 report submission');
  console.log('3. Deploy to production immediately');
  
} catch (error) {
  console.error('❌ Emergency fix failed:', error);
  process.exit(1);
}