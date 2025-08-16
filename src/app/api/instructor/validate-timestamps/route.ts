/**
 * API ENDPOINT VALIDATION: Timestamp Format Compatibility
 * 
 * This endpoint validates that our API can handle both:
 * - OLD FORMAT: "2025-08-04" (YYYY-MM-DD) 
 * - NEW FORMAT: "2025-08-04T00:00:00.000Z" (Full ISO timestamp)
 */

import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testCases } = body;

    if (!testCases || !Array.isArray(testCases)) {
      return Response.json(
        { 
          success: false, 
          error: 'Missing testCases array in request body' 
        },
        { status: 400 }
      );
    }

    const results = testCases.map((testCase: any) => {
      const { format, dateString, label } = testCase;
      
      try {
        // Test Date constructor with various formats
        const date = new Date(dateString);
        const isValid = !isNaN(date.getTime());
        
        return {
          label,
          format,
          dateString,
          isValid,
          parsedDate: isValid ? date.toISOString() : null,
          timestamp: isValid ? date.getTime() : null
        };
      } catch (error) {
        return {
          label,
          format,
          dateString,
          isValid: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          parsedDate: null,
          timestamp: null
        };
      }
    });

    // Test date range validation logic
    const dateRangeTests = [];
    
    // Test with old format
    const oldStartDate = new Date("2025-08-04");
    const oldEndDate = new Date("2025-08-11");
    dateRangeTests.push({
      type: 'old_format_range',
      startDate: oldStartDate.toISOString(),
      endDate: oldEndDate.toISOString(),
      startValid: !isNaN(oldStartDate.getTime()),
      endValid: !isNaN(oldEndDate.getTime()),
      rangeValid: oldEndDate > oldStartDate
    });

    // Test with new format
    const newStartDate = new Date("2025-08-04T00:00:00.000Z");
    const newEndDate = new Date("2025-08-11T00:00:00.000Z");
    dateRangeTests.push({
      type: 'new_format_range',
      startDate: newStartDate.toISOString(),
      endDate: newEndDate.toISOString(),
      startValid: !isNaN(newStartDate.getTime()),
      endValid: !isNaN(newEndDate.getTime()),
      rangeValid: newEndDate > newStartDate
    });

    // Test mixed formats
    const mixedStartDate = new Date("2025-08-04");
    const mixedEndDate = new Date("2025-08-11T00:00:00.000Z");
    dateRangeTests.push({
      type: 'mixed_format_range',
      startDate: mixedStartDate.toISOString(),
      endDate: mixedEndDate.toISOString(),
      startValid: !isNaN(mixedStartDate.getTime()),
      endValid: !isNaN(mixedEndDate.getTime()),
      rangeValid: mixedEndDate > mixedStartDate
    });

    return Response.json({
      success: true,
      data: {
        individualTests: results,
        dateRangeTests,
        summary: {
          totalTests: results.length,
          passedTests: results.filter(r => r.isValid).length,
          failedTests: results.filter(r => !r.isValid).length,
          allRangeTestsPassed: dateRangeTests.every(test => 
            test.startValid && test.endValid && test.rangeValid
          )
        }
      }
    });

  } catch (error) {
    console.error('Timestamp validation error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Internal server error during timestamp validation' 
      },
      { status: 500 }
    );
  }
}

/**
 * Test Cases for Frontend Integration:
 * 
 * POST /api/instructor/validate-timestamps
 * {
 *   "testCases": [
 *     {
 *       "label": "Old format - date only",
 *       "format": "YYYY-MM-DD", 
 *       "dateString": "2025-08-04"
 *     },
 *     {
 *       "label": "New format - full ISO",
 *       "format": "ISO", 
 *       "dateString": "2025-08-04T00:00:00.000Z"
 *     },
 *     {
 *       "label": "ISO with timezone",
 *       "format": "ISO_TZ", 
 *       "dateString": "2025-08-04T00:00:00-03:00"
 *     },
 *     {
 *       "label": "Invalid format",
 *       "format": "INVALID", 
 *       "dateString": "invalid-date"
 *     }
 *   ]
 * }
 */