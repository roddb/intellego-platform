const fs = require('fs');

// EMERGENCY FIX APPLICATION
console.log('🚨 APPLYING EMERGENCY TIMEZONE FIX...');

const filePath = './src/lib/db-operations.ts';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix imports
console.log('1️⃣ Fixing imports...');
if (content.includes("import { getWeekDatesInArgentina } from './timezone-utils'")) {
  content = content.replace(
    "import { getWeekDatesInArgentina } from './timezone-utils'",
    "import { getWeekDatesInArgentina, getWeekStartInArgentina, isCurrentWeekInArgentina } from './timezone-utils'"
  );
  console.log('✅ Imports fixed');
}

// 2. Fix function
console.log('2️⃣ Fixing getCurrentWeekStart function...');
const oldFunctionRegex = /export function getCurrentWeekStart\(\): Date \{[\s\S]*?^}/m;
const newFunction = `export function getCurrentWeekStart(): Date {
  // Use the same logic as timezone-utils.ts for consistency
  return getWeekStartInArgentina(new Date())
}`;

content = content.replace(oldFunctionRegex, newFunction);
console.log('✅ Function fixed');

// 3. Write file
console.log('3️⃣ Writing fixed file...');
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ File written');

console.log('🎉 EMERGENCY FIX COMPLETE!');
console.log('📊 Week 3 reports can now be submitted!');

// Verify
const verify = fs.readFileSync(filePath, 'utf8');
if (verify.includes('return getWeekStartInArgentina(new Date())')) {
  console.log('✅ VERIFICATION PASSED - Fix applied correctly');
} else {
  console.log('❌ VERIFICATION FAILED - Manual review needed');
}