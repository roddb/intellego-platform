const fs = require('fs');

// Read timezone-utils.ts
const timezoneUtils = fs.readFileSync('./src/lib/timezone-utils.ts', 'utf8');
console.log('=== TIMEZONE-UTILS.TS ===');
console.log(timezoneUtils);

// Read relevant part of db-operations.ts
const dbOps = fs.readFileSync('./src/lib/db-operations.ts', 'utf8');
console.log('\n=== CURRENT getCurrentWeekStart ===');
const start = dbOps.indexOf('export function getCurrentWeekStart');
const end = dbOps.indexOf('\n}', start) + 2;
console.log(dbOps.substring(start, end));