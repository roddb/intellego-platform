/**
 * TIMESTAMP COMPATIBILITY VERIFICATION
 * 
 * This endpoint verifies that the hierarchical API endpoints can handle 
 * the updated timestamp format from WeeklyDownloadModal:
 * 
 * OLD FORMAT: "2025-08-04" (YYYY-MM-DD)
 * NEW FORMAT: "2025-08-04T00:00:00.000Z" (Full ISO timestamp)
 * 
 * Replicates the exact date parsing logic from:
 * /src/app/api/instructor/hierarchical/route.ts (lines 313-314, 365-366)
 */

import { NextRequest } from 'next/server';

interface DateParsingResult {
  input: string;
  format: 'old' | 'new' | 'unknown';
  parsed: Date;
  isValid: boolean;
  timestamp: number | null;
  isoString: string | null;
}

interface DateRangeValidation {
  startInput: string;
  endInput: string;
  startResult: DateParsingResult;
  endResult: DateRangeValidation;
  rangeIsValid: boolean;
  errorMessage?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      previewWeekStart, 
      previewWeekEnd, 
      downloadWeekStart, 
      downloadWeekEnd 
    } = body;

    // Validate required parameters
    if (!previewWeekStart || !previewWeekEnd || !downloadWeekStart || !downloadWeekEnd) {
      return Response.json({
        success: false,
        error: 'Missing required date parameters',
        required: ['previewWeekStart', 'previewWeekEnd', 'downloadWeekStart', 'downloadWeekEnd']
      }, { status: 400 });
    }

    // Function to detect format and parse date
    function analyzeDateString(dateString: string): DateParsingResult {
      let format: 'old' | 'new' | 'unknown' = 'unknown';
      
      // Detect format
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        format = 'old'; // YYYY-MM-DD
      } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(dateString)) {
        format = 'new'; // Full ISO timestamp
      }

      // Parse date - THIS IS THE EXACT LOGIC FROM HIERARCHICAL ROUTE
      const parsed = new Date(dateString);
      const isValid = !isNaN(parsed.getTime());

      return {
        input: dateString,
        format,
        parsed,
        isValid,
        timestamp: isValid ? parsed.getTime() : null,
        isoString: isValid ? parsed.toISOString() : null
      };
    }

    // Function to validate date range - REPLICATES HIERARCHICAL ROUTE LOGIC
    function validateDateRange(startString: string, endString: string): DateRangeValidation {
      const startResult = analyzeDateString(startString);
      const endResult = analyzeDateString(endString);

      let rangeIsValid = false;
      let errorMessage: string | undefined;

      // Replicate the exact validation from hierarchical route
      if (!startResult.isValid) {
        errorMessage = 'Invalid start date format';
      } else if (!endResult.isValid) {
        errorMessage = 'Invalid end date format';
      } else if (endResult.parsed <= startResult.parsed) {
        errorMessage = 'End date must be after start date';
        rangeIsValid = false;
      } else {
        rangeIsValid = true;
      }

      return {
        startInput: startString,
        endInput: endString,
        startResult,
        endResult,
        rangeIsValid,
        errorMessage
      };
    }

    // Test weekly-preview endpoint date logic (lines 313-314 equivalent)
    const previewValidation = validateDateRange(previewWeekStart, previewWeekEnd);

    // Test weekly-download endpoint date logic (lines 365-366 equivalent)
    const downloadValidation = validateDateRange(downloadWeekStart, downloadWeekEnd);

    // Additional compatibility tests
    const compatibilityTests = [
      {
        name: 'Old format to new format conversion',
        oldFormat: '2025-08-04',
        newFormat: '2025-08-04T00:00:00.000Z',
        sameDate: new Date('2025-08-04').toDateString() === new Date('2025-08-04T00:00:00.000Z').toDateString()
      },
      {
        name: 'Time zone handling',
        utcFormat: '2025-08-04T00:00:00.000Z',
        localFormat: '2025-08-04',
        timezoneOffset: new Date().getTimezoneOffset()
      }
    ];

    // Edge case tests
    const edgeCases = [
      { input: '', description: 'Empty string' },
      { input: 'invalid-date', description: 'Invalid date string' },
      { input: '2025-02-30', description: 'Invalid date (Feb 30)' },
      { input: '2025-08-04T25:00:00.000Z', description: 'Invalid time (25 hours)' },
      { input: '2025-08-04T00:00:00', description: 'ISO without timezone' }
    ].map(testCase => ({
      ...testCase,
      result: analyzeDateString(testCase.input)
    }));

    return Response.json({
      success: true,
      data: {
        previewEndpoint: {
          validation: previewValidation,
          compatible: previewValidation.rangeIsValid,
          notes: 'Replicates lines 313-314 from hierarchical route'
        },
        downloadEndpoint: {
          validation: downloadValidation,
          compatible: downloadValidation.rangeIsValid,
          notes: 'Replicates lines 365-366 from hierarchical route'
        },
        compatibilityTests,
        edgeCases,
        summary: {
          previewWorking: previewValidation.rangeIsValid,
          downloadWorking: downloadValidation.rangeIsValid,
          bothEndpointsCompatible: previewValidation.rangeIsValid && downloadValidation.rangeIsValid,
          recommendedAction: 
            previewValidation.rangeIsValid && downloadValidation.rangeIsValid 
              ? 'API endpoints are fully compatible with new timestamp format'
              : 'API endpoints require updates for timestamp compatibility'
        }
      }
    });

  } catch (error) {
    console.error('Timestamp compatibility check error:', error);
    return Response.json({
      success: false,
      error: 'Internal server error during compatibility check',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * USAGE EXAMPLE:
 * 
 * POST /api/instructor/timestamp-compatibility-check
 * {
 *   "previewWeekStart": "2025-08-04T00:00:00.000Z",
 *   "previewWeekEnd": "2025-08-11T00:00:00.000Z", 
 *   "downloadWeekStart": "2025-08-04T00:00:00.000Z",
 *   "downloadWeekEnd": "2025-08-11T00:00:00.000Z"
 * }
 * 
 * Expected Response:
 * {
 *   "success": true,
 *   "data": {
 *     "previewEndpoint": {
 *       "compatible": true,
 *       "validation": {...}
 *     },
 *     "downloadEndpoint": {
 *       "compatible": true,
 *       "validation": {...}
 *     },
 *     "summary": {
 *       "bothEndpointsCompatible": true,
 *       "recommendedAction": "API endpoints are fully compatible with new timestamp format"
 *     }
 *   }
 * }
 */