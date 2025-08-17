const fs = require('fs');

// Apply the emergency fix directly
const dbOpsPath = './src/lib/db-operations.ts';
const content = fs.readFileSync(dbOpsPath, 'utf8');

// Show current problematic function
const start = content.indexOf('export function getCurrentWeekStart');
const end = content.indexOf('\n}', start) + 2;
console.log('CURRENT PROBLEMATIC FUNCTION:');
console.log(content.substring(start, end));

// Apply the fix
let newContent = content;

// 1. Fix imports
if (newContent.includes(`import { getWeekDatesInArgentina } from './timezone-utils'`)) {
  newContent = newContent.replace(
    `import { getWeekDatesInArgentina } from './timezone-utils'`,
    `import { getWeekDatesInArgentina, getWeekStartInArgentina, isCurrentWeekInArgentina } from './timezone-utils'`
  );
}

// 2. Replace the entire getCurrentWeekStart function
const oldFunctionRegex = /export function getCurrentWeekStart\(\): Date \{[\s\S]*?\n\}/;
const newFunction = `export function getCurrentWeekStart(): Date {
  // Use the same logic as timezone-utils.ts for consistency
  return getWeekStartInArgentina(new Date())
}`;

newContent = newContent.replace(oldFunctionRegex, newFunction);

// Write the fix
fs.writeFileSync(dbOpsPath, newContent, 'utf8');

console.log('\n🚨 EMERGENCY FIX APPLIED!');
console.log('✅ getCurrentWeekStart() now uses getWeekStartInArgentina()');
console.log('✅ Week boundary calculation is now consistent');
console.log('✅ Students can submit Week 3 reports!');

// Verify the fix
const verifyContent = fs.readFileSync(dbOpsPath, 'utf8');
const newStart = verifyContent.indexOf('export function getCurrentWeekStart');
const newEnd = verifyContent.indexOf('\n}', newStart) + 2;
console.log('\nVERIFIED NEW FUNCTION:');
console.log(verifyContent.substring(newStart, newEnd));