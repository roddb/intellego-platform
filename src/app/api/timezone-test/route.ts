import { NextResponse } from 'next/server';
import { formatArgentinaWeekRange, toArgentinaDate } from '@/lib/timezone-utils';

export async function GET() {
  try {
    // Test data that would be similar to what the instructor dashboard shows
    const testWeekStart = '2025-08-04T03:00:00.000Z'; // UTC Monday
    const testWeekEnd = '2025-08-10T02:59:59.999Z';   // UTC Sunday
    const testSubmissionDate = '2025-08-08T14:30:00.000Z'; // UTC submission

    const result = {
      status: 'SUCCESS',
      message: 'Timezone formatting test',
      test_data: {
        weekStart_UTC: testWeekStart,
        weekEnd_UTC: testWeekEnd,
        submission_UTC: testSubmissionDate
      },
      argentina_formatted: {
        week_range: formatArgentinaWeekRange(testWeekStart, testWeekEnd),
        submission_date: toArgentinaDate(testSubmissionDate),
        display_text: `Semana del ${formatArgentinaWeekRange(testWeekStart, testWeekEnd)}`
      },
      expected_format: {
        week_range: "04/08/2025 - 10/08/2025",
        submission_date: "08/08/2025",
        display_text: "Semana del 04/08/2025 - 10/08/2025"
      }
    };

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({
      status: 'ERROR',
      message: 'Timezone test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}