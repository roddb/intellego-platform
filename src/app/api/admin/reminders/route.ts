import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { reminderScheduler } from '@/lib/reminder-scheduler'
import { UserRole } from '@/lib/temp-storage'

// GET - Get reminder statistics
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== UserRole.INSTRUCTOR) {
      return NextResponse.json(
        { error: 'Unauthorized - Instructor access required' },
        { status: 401 }
      )
    }
    
    const stats = await reminderScheduler.getReminderStats()
    
    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Error getting reminder statistics:', error)
    return NextResponse.json(
      { error: 'Failed to get reminder statistics' },
      { status: 500 }
    )
  }
}

// POST - Send manual reminders
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== UserRole.INSTRUCTOR) {
      return NextResponse.json(
        { error: 'Unauthorized - Instructor access required' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const { action, userId, reminderType } = body
    
    let result
    
    switch (action) {
      case 'send_all':
        result = await reminderScheduler.sendAllReminders()
        return NextResponse.json({
          success: true,
          message: `Sent ${result} reminders`,
          remindersSent: result
        })
        
      case 'send_single':
        if (!userId) {
          return NextResponse.json(
            { error: 'User ID is required for single reminder' },
            { status: 400 }
          )
        }
        
        await reminderScheduler.sendReminderToStudent(userId, reminderType)
        return NextResponse.json({
          success: true,
          message: 'Single reminder sent successfully'
        })
        
      case 'test_reminder':
        if (!userId) {
          return NextResponse.json(
            { error: 'User ID is required for test reminder' },
            { status: 400 }
          )
        }
        
        await reminderScheduler.triggerManualReminder(userId)
        return NextResponse.json({
          success: true,
          message: 'Test reminder sent successfully'
        })
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: send_all, send_single, or test_reminder' },
          { status: 400 }
        )
    }
    
  } catch (error) {
    console.error('❌ Error in manual reminder operation:', error)
    return NextResponse.json(
      { error: 'Failed to process reminder request' },
      { status: 500 }
    )
  }
}