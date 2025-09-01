// EMERGENCY TIMEZONE FIX - Sunday night blocking issue
// August 31, 2025 21:24 Argentina time

const { getCurrentArgentinaDate, getWeekStartInArgentina, getWeekEndInArgentina } = require('./src/lib/timezone-utils');

console.log('=== EMERGENCY TIMEZONE DIAGNOSIS ===');
console.log('Current time in Argentina (your screenshot): August 31, 2025 21:24');
console.log('');

// Simulate the exact moment from the screenshot
const testDate = new Date('2025-09-01T00:24:00Z'); // Monday 00:24 UTC = Sunday 21:24 Argentina
console.log('Test date (UTC):', testDate.toISOString());
console.log('Test date (Argentina):', testDate.toLocaleString("en-US", {timeZone: "America/Argentina/Buenos_Aires"}));

// Get week boundaries
const weekStart = getWeekStartInArgentina(testDate);
const weekEnd = getWeekEndInArgentina(testDate);

console.log('\n=== WEEK BOUNDARIES ===');
console.log('Week Start (UTC):', weekStart.toISOString());
console.log('Week Start (Argentina):', weekStart.toLocaleString("en-US", {timeZone: "America/Argentina/Buenos_Aires"}));
console.log('Week End (UTC):', weekEnd.toISOString());
console.log('Week End (Argentina):', weekEnd.toLocaleString("en-US", {timeZone: "America/Argentina/Buenos_Aires"}));

// The problem check
console.log('\n=== THE CRITICAL CHECK ===');
const currentDate = getCurrentArgentinaDate();
console.log('getCurrentArgentinaDate():', currentDate);
console.log('weekStart:', weekStart);
console.log('weekEnd:', weekEnd);
console.log('');
console.log('currentDate >= weekStart?', currentDate >= weekStart, '(should be true)');
console.log('currentDate <= weekEnd?', currentDate <= weekEnd, '(should be true)');
console.log('isCurrentWeek?', currentDate >= weekStart && currentDate <= weekEnd, '(MUST BE TRUE!)');

// Show the actual comparison values
console.log('\n=== RAW MILLISECONDS ===');
console.log('currentDate.getTime():', currentDate.getTime());
console.log('weekStart.getTime():', weekStart.getTime());
console.log('weekEnd.getTime():', weekEnd.getTime());
console.log('');
console.log('Difference current - weekEnd:', currentDate.getTime() - weekEnd.getTime(), 'ms');

// The REAL problem
console.log('\n=== THE BUG ===');
console.log('The problem is that getCurrentArgentinaDate() creates a fake Date object');
console.log('by parsing toLocaleString which loses timezone information!');
console.log('');
console.log('Real UTC now:', new Date().toISOString());
console.log('Fake Argentina date from getCurrentArgentinaDate():', currentDate.toISOString());