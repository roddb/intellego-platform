import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    console.log('🔍 Validating migration results in production');
    
    // Test 1: Check subjects format
    const subjectsFormatResult = await query(`
      SELECT subjects, COUNT(*) as count 
      FROM User 
      WHERE role = 'STUDENT' 
      AND subjects IS NOT NULL 
      GROUP BY subjects 
      ORDER BY subjects
    `);
    
    // Test 2: Simulate instructor dropdown
    const dropdownSubjectsResult = await query(`
      SELECT DISTINCT subject
      FROM (
        -- Get subjects from user profiles (comma-separated)
        SELECT TRIM(SUBSTR(subjects, 1, CASE 
          WHEN INSTR(subjects, ',') = 0 THEN LENGTH(subjects)
          ELSE INSTR(subjects, ',') - 1 
        END)) as subject
        FROM User 
        WHERE role = 'STUDENT' 
        AND subjects IS NOT NULL 
        AND subjects != ''
        
        UNION ALL
        
        SELECT TRIM(SUBSTR(subjects, INSTR(subjects, ',') + 1)) as subject
        FROM User 
        WHERE role = 'STUDENT' 
        AND subjects IS NOT NULL 
        AND subjects != '' 
        AND INSTR(subjects, ',') > 0
        
        UNION ALL
        
        -- Get subjects from submitted reports
        SELECT DISTINCT subject
        FROM ProgressReport 
        WHERE subject IS NOT NULL 
        AND subject != ''
      ) combined_subjects
      WHERE subject IS NOT NULL 
      AND subject != ''
      ORDER BY subject
    `);
    
    // Analyze results
    const rawSubjectFormats = subjectsFormatResult.rows.map(row => ({
      subjects: (row as any).subjects,
      count: (row as any).count
    }));
    
    const dropdownSubjects = dropdownSubjectsResult.rows.map(row => (row as any).subject);
    
    const cleanSubjects = dropdownSubjects.filter((s: string) => 
      s === 'Física' || s === 'Química' || s === 'Matemáticas'
    );
    
    const corruptedSubjects = dropdownSubjects.filter((s: string) => 
      s.includes('[') || s.includes(']') || s.includes('"')
    );
    
    const migrationSuccessful = corruptedSubjects.length === 0 && cleanSubjects.length >= 2;
    
    return NextResponse.json({
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      migration: {
        successful: migrationSuccessful,
        message: migrationSuccessful 
          ? '✅ Migration successful: Clean subjects format detected'
          : '❌ Migration issues detected: Corrupted subjects found'
      },
      analysis: {
        rawSubjectFormats,
        dropdownSubjects,
        cleanSubjects,
        corruptedSubjects,
        totalUsers: rawSubjectFormats.reduce((sum, item) => sum + item.count, 0)
      },
      validation: {
        expectedInDropdown: ['Física', 'Química', 'Matemáticas'],
        actualInDropdown: cleanSubjects,
        corruptedFound: corruptedSubjects,
        dropdownWillWork: corruptedSubjects.length === 0
      }
    });
    
  } catch (error) {
    console.error('Error validating migration:', error);
    return NextResponse.json({
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}