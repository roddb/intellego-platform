import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { exportApiRateLimit } from '@/lib/rate-limit';
import { 
  logUnauthorizedAccess, 
  logRoleViolation, 
  logDataAccess, 
  logExportAction, 
  logRateLimitExceeded 
} from '@/lib/security-logger';
import { generateDatabaseExportStructure } from '@/lib/db-operations';
import JSZip from 'jszip';

// Helper function to extract sede breakdown from files
function extractSedeBreakdown(files: Array<{ path: string; content: string }>) {
  const sedeMap = new Map<string, { studentCount: Set<string>; subjects: Set<string> }>();
  
  for (const file of files) {
    const pathParts = file.path.split('/');
    if (pathParts.length >= 4) {
      const sede = pathParts[0];
      const subject = pathParts[2];
      const studentName = pathParts[3];
      
      if (!sedeMap.has(sede)) {
        sedeMap.set(sede, { studentCount: new Set(), subjects: new Set() });
      }
      
      const sedeData = sedeMap.get(sede)!;
      sedeData.studentCount.add(studentName);
      sedeData.subjects.add(subject);
    }
  }
  
  return Array.from(sedeMap.entries()).map(([sede, data]) => ({
    sede: sede.replace(/_/g, ' '),
    studentCount: data.studentCount.size,
    subjects: Array.from(data.subjects).map(s => s.replace(/_/g, ' '))
  }));
}

export async function GET(request: Request) {
  try {
    // Enhanced session validation
    const session = await auth();
    
    if (!session?.user) {
      logUnauthorizedAccess('/api/instructor/database-export');
      return NextResponse.json(
        { error: 'Unauthorized. Authentication required.' }, 
        { status: 401 }
      );
    }

    if (session.user.role !== 'INSTRUCTOR') {
      logRoleViolation('INSTRUCTOR', session.user.role || 'unknown', '/api/instructor/database-export', session.user.id, session.user.email || undefined);
      return NextResponse.json(
        { error: 'Forbidden. Instructor access required.' }, 
        { status: 403 }
      );
    }

    // Apply rate limiting for export actions
    const rateLimitResult = await exportApiRateLimit.limit(session.user.id);
    if (!rateLimitResult.success) {
      logRateLimitExceeded(session.user.id, session.user.email || 'unknown', 'database-export', rateLimitResult.limit);
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.reset
        }, 
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          }
        }
      );
    }

    // Log data access for audit trail
    logDataAccess('database-export', '/api/instructor/database-export', session.user.id, session.user.email || 'unknown', session.user.role || 'unknown');
    
    // Log export action
    logExportAction('complete-database', 'all-structured-data', session.user.id, session.user.email || 'unknown');

    console.log(`📊 Database export requested by instructor: ${session.user.email}`);

    // Extract request parameters
    const { searchParams } = new URL(request.url);
    const preview = searchParams.get('preview') === 'true';

    // Generate the structured database export
    const { files, metadata } = await generateDatabaseExportStructure();

    if (preview) {
      // Return preview with metadata
      return NextResponse.json({
        success: true,
        preview: true,
        metadata: {
          ...metadata,
          sedeBreakdown: extractSedeBreakdown(files)
        },
        timestamp: new Date().toISOString()
      });
    }

    // Create ZIP file
    const zip = new JSZip();
    
    // Add metadata file to the root of the ZIP
    zip.file('metadata.json', JSON.stringify(metadata, null, 2));
    
    // Add all structured files to the ZIP
    for (const file of files) {
      zip.file(file.path, file.content);
    }
    
    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({ 
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });
    
    // Return ZIP file as downloadable
    const filename = `intellego_database_export_${new Date().toISOString().split('T')[0]}.zip`;
    
    return new NextResponse(zipBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': zipBuffer.length.toString()
      }
    });

  } catch (error) {
    console.error('Error in database export API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }, 
      { status: 500 }
    );
  }
}