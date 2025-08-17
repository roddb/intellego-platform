export async function GET() {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const dbOpsPath = path.join(process.cwd(), 'src/lib/db-operations.ts');
    const content = fs.readFileSync(dbOpsPath, 'utf8');
    
    // Find the getCurrentWeekStart function
    const start = content.indexOf('export function getCurrentWeekStart');
    const end = content.indexOf('\n}', start) + 2;
    const currentFunction = content.substring(start, end);
    
    return Response.json({
      success: true,
      currentFunction,
      needsFix: !content.includes('return getWeekStartInArgentina(new Date())'),
      imports: content.includes('getWeekStartInArgentina') ? 'Already imported' : 'Needs import fix'
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message });
  }
}