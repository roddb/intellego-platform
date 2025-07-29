import { NextResponse } from 'next/server'
import { reminderScheduler } from '@/lib/reminder-scheduler'

// Prevent caching of this endpoint
export const dynamic = 'force-dynamic'

// POST handler for manual trigger
export async function POST(request: Request) {
  try {
    // Verify the request is authorized (in production, use proper auth)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET || 'dev-secret-token'
    
    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🔄 Weekly reminders cron job triggered')
    
    // Send reminders to all students
    const remindersSent = await reminderScheduler.sendAllReminders()
    
    // Get statistics
    const stats = await reminderScheduler.getReminderStats()
    
    const response = {
      success: true,
      message: `Weekly reminders processed successfully`,
      remindersSent,
      stats,
      timestamp: new Date().toISOString()
    }
    
    console.log('✅ Weekly reminders completed:', response)
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('❌ Error in weekly reminders cron:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET handler for status check
export async function GET() {
  try {
    const stats = await reminderScheduler.getReminderStats()
    
    return NextResponse.json({
      status: 'active',
      message: 'Weekly reminders system is operational',
      stats,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Error getting reminder stats:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}