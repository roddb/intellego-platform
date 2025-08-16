/**
 * DATE PARSING TEST ENDPOINT
 * 
 * Simple endpoint to demonstrate JavaScript Date constructor behavior
 * with both old and new timestamp formats from WeeklyDownloadModal.
 */

import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Test the exact scenarios from WeeklyDownloadModal
    const tests = [
      {
        name: 'Old Format (YYYY-MM-DD)',
        input: '2025-08-04',
        description: 'Original format sent by WeeklyDownloadModal'
      },
      {
        name: 'New Format (Full ISO)',
        input: '2025-08-04T00:00:00.000Z', 
        description: 'Updated format sent by WeeklyDownloadModal'
      },
      {
        name: 'End Date Old',
        input: '2025-08-11',
        description: 'End date in old format'
      },
      {
        name: 'End Date New',
        input: '2025-08-11T00:00:00.000Z',
        description: 'End date in new format'
      }
    ];

    const results = tests.map(test => {
      // This is the EXACT code that exists in the hierarchical API
      const date = new Date(test.input);
      const isValid = !isNaN(date.getTime());

      return {
        name: test.name,
        input: test.input,
        description: test.description,
        parsedDate: date,
        isValid,
        timestamp: date.getTime(),
        isoString: date.toISOString(),
        dateString: date.toDateString(),
        timeString: date.toTimeString()
      };
    });

    // Test range validation (lines 313-314, 365-366 equivalent)
    const rangeTests = [
      {
        scenario: 'Old format range',
        start: '2025-08-04',
        end: '2025-08-11'
      },
      {
        scenario: 'New format range', 
        start: '2025-08-04T00:00:00.000Z',
        end: '2025-08-11T00:00:00.000Z'
      },
      {
        scenario: 'Mixed format range',
        start: '2025-08-04',
        end: '2025-08-11T00:00:00.000Z'
      }
    ];

    const rangeResults = rangeTests.map(test => {
      const startDate = new Date(test.start);
      const endDate = new Date(test.end);
      
      // Replicate the exact validation logic from hierarchical API
      const startValid = !isNaN(startDate.getTime());
      const endValid = !isNaN(endDate.getTime());
      const rangeValid = startValid && endValid && endDate > startDate;

      return {
        scenario: test.scenario,
        start: test.start,
        end: test.end,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        startValid,
        endValid,
        rangeValid,
        daysDifference: rangeValid ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : null
      };
    });

    return Response.json({
      success: true,
      data: {
        individualDateTests: results,
        rangeValidationTests: rangeResults,
        conclusion: {
          message: 'JavaScript Date constructor handles both formats correctly',
          oldFormatWorks: results.filter(r => r.input.includes('T') === false).every(r => r.isValid),
          newFormatWorks: results.filter(r => r.input.includes('T') === true).every(r => r.isValid),
          allRangeTestsPass: rangeResults.every(r => r.rangeValid),
          apiCompatibility: 'Existing hierarchical API should work with new format without changes'
        },
        verification: {
          dateConstructor: 'new Date() natively supports both YYYY-MM-DD and ISO formats',
          validation: 'isNaN(date.getTime()) works consistently for both formats',
          comparison: 'Date comparison operators work regardless of input format',
          recommendation: 'No changes needed to existing API date parsing logic'
        }
      }
    });

  } catch (error) {
    console.error('Date parsing test error:', error);
    return Response.json({
      success: false,
      error: 'Error during date parsing test',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * SIMPLE TEST:
 * GET /api/instructor/date-parsing-test
 * 
 * This will prove that:
 * 1. new Date("2025-08-04") works correctly
 * 2. new Date("2025-08-04T00:00:00.000Z") works correctly  
 * 3. Date validation with isNaN() works for both
 * 4. Date comparison works for both formats
 * 
 * Expected result: ALL TESTS PASS
 */