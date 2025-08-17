export async function GET() {
  try {
    // Read the current files to understand the issue
    const fs = require('fs');
    const path = require('path');
    
    const timezoneUtilsPath = path.join(process.cwd(), 'src/lib/timezone-utils.ts');
    const dbOperationsPath = path.join(process.cwd(), 'src/lib/db-operations.ts');
    
    const timezoneUtilsContent = fs.readFileSync(timezoneUtilsPath, 'utf8');
    const dbOperationsContent = fs.readFileSync(dbOperationsPath, 'utf8');
    
    return Response.json({
      success: true,
      files: {
        'timezone-utils.ts': timezoneUtilsContent,
        'db-operations.ts': dbOperationsContent
      }
    });
  } catch (error) {
    console.error('Debug timezone error:', error);
    return Response.json(
      { success: false, error: 'Failed to read files' },
      { status: 500 }
    );
  }
}