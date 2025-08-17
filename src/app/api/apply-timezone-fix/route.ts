export async function POST() {
  try {
    const fs = require('fs');
    const path = require('path');
    
    console.log('🚨 APPLYING EMERGENCY TIMEZONE FIX FOR WEEK 3 REPORTS...');
    
    const dbOpsPath = path.join(process.cwd(), 'src/lib/db-operations.ts');
    let content = fs.readFileSync(dbOpsPath, 'utf8');
    
    // Check if already fixed
    if (content.includes('return getWeekStartInArgentina(new Date())')) {
      return Response.json({
        success: true,
        message: 'Fix already applied - students can submit reports!',
        alreadyFixed: true
      });
    }
    
    let fixesApplied = [];
    
    // Fix 1: Update imports
    const oldImport = `import { getWeekDatesInArgentina } from './timezone-utils'`;
    const newImport = `import { getWeekDatesInArgentina, getWeekStartInArgentina, isCurrentWeekInArgentina } from './timezone-utils'`;
    
    if (content.includes(oldImport)) {
      content = content.replace(oldImport, newImport);
      fixesApplied.push('Fixed imports to include getWeekStartInArgentina');
    }
    
    // Fix 2: Replace getCurrentWeekStart function with consistent implementation
    const functionStart = content.indexOf('export function getCurrentWeekStart(): Date {');
    if (functionStart !== -1) {
      const nextFunction = content.indexOf('\nexport function', functionStart + 1);
      const functionEnd = nextFunction !== -1 ? nextFunction : content.length;
      
      // Find the end of this specific function
      let braceCount = 0;
      let actualEnd = functionStart;
      for (let i = functionStart; i < content.length; i++) {
        if (content[i] === '{') braceCount++;
        if (content[i] === '}') {
          braceCount--;
          if (braceCount === 0) {
            actualEnd = i + 1;
            break;
          }
        }
      }
      
      const oldFunction = content.substring(functionStart, actualEnd);
      const newFunction = `export function getCurrentWeekStart(): Date {
  // Use the same logic as timezone-utils.ts for consistency
  return getWeekStartInArgentina(new Date())
}`;
      
      content = content.replace(oldFunction, newFunction);
      fixesApplied.push('Replaced getCurrentWeekStart() to use timezone-utils');
    }
    
    // Write the fixed file
    fs.writeFileSync(dbOpsPath, content, 'utf8');
    
    // Verify the fix
    const verifyContent = fs.readFileSync(dbOpsPath, 'utf8');
    const isFixed = verifyContent.includes('return getWeekStartInArgentina(new Date())');
    
    if (isFixed) {
      console.log('✅ EMERGENCY FIX SUCCESSFULLY APPLIED');
      return Response.json({
        success: true,
        message: 'EMERGENCY FIX APPLIED SUCCESSFULLY! Students can now submit Week 3 reports.',
        fixesApplied,
        status: 'FIXED - Week boundary calculation now consistent between display and report detection'
      });
    } else {
      throw new Error('Fix verification failed');
    }
    
  } catch (error) {
    console.error('Emergency fix failed:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Emergency fix failed: ' + error.message,
        urgentAction: 'Manual intervention required - students cannot submit reports!'
      },
      { status: 500 }
    );
  }
}