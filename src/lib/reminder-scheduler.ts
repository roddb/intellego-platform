import { emailService, getWeekDates } from './email-service'
import { getAllUsers, getProgressReports, UserRole } from './temp-storage'

interface ReminderSchedule {
  userId: string
  userEmail: string
  userName: string
  preferredDay: number // 0 = Sunday, 1 = Monday, etc.
  preferredTime: string // HH:MM format
  lastReminderSent?: Date
  reminderType: 'initial' | 'follow_up_1' | 'follow_up_2' | 'urgent'
}

interface StudentProgress {
  userId: string
  weeklyPattern: {
    dayOfWeek: number
    averageSubmissionTime: string
  }
  lastSubmission?: Date
  consistencyScore: number // 0-100
}

// In-memory storage for reminder schedules
let reminderSchedules: ReminderSchedule[] = []
let studentProgressPatterns: StudentProgress[] = []

export const reminderScheduler = {
  // Initialize reminder system
  async initialize() {
    console.log('🚀 Initializing reminder scheduler...')
    
    // Get all students
    const users = await getAllUsers()
    const students = users.filter(user => user.role === UserRole.STUDENT)
    
    // Initialize reminder schedules for each student
    for (const student of students) {
      const pattern = await this.analyzeStudentPattern(student.id)
      
      reminderSchedules.push({
        userId: student.id,
        userEmail: student.email,
        userName: student.name,
        preferredDay: pattern.dayOfWeek || 1, // Default to Monday
        preferredTime: pattern.averageSubmissionTime || '09:00',
        reminderType: 'initial'
      })
    }
    
    console.log(`✅ Initialized reminder schedules for ${students.length} students`)
  },

  // Analyze student submission patterns
  async analyzeStudentPattern(userId: string): Promise<{
    dayOfWeek: number
    averageSubmissionTime: string
  }> {
    const reports = await getProgressReports(userId)
    
    if (reports.length === 0) {
      return { dayOfWeek: 1, averageSubmissionTime: '09:00' } // Default to Monday 9 AM
    }
    
    // Analyze submission patterns
    const submissions = reports.map(report => ({
      date: new Date(report.submittedAt),
      dayOfWeek: new Date(report.submittedAt).getDay(),
      hour: new Date(report.submittedAt).getHours()
    }))
    
    // Find most common day
    const dayCount: { [key: number]: number } = {}
    submissions.forEach(sub => {
      dayCount[sub.dayOfWeek] = (dayCount[sub.dayOfWeek] || 0) + 1
    })
    
    const mostCommonDay = Object.keys(dayCount).reduce((a, b) => 
      dayCount[parseInt(a)] > dayCount[parseInt(b)] ? a : b
    )
    
    // Calculate average submission time
    const avgHour = submissions.reduce((sum, sub) => sum + sub.hour, 0) / submissions.length
    const avgTime = `${Math.floor(avgHour).toString().padStart(2, '0')}:00`
    
    return {
      dayOfWeek: parseInt(mostCommonDay),
      averageSubmissionTime: avgTime
    }
  },

  // Check if student needs reminder
  async checkStudentNeedsReminder(userId: string): Promise<{
    needsReminder: boolean
    reminderType: 'initial' | 'follow_up_1' | 'follow_up_2' | 'urgent'
    daysLeft: number
  }> {
    const { start: weekStart, end: weekEnd } = getWeekDates()
    const reports = await getProgressReports(userId)
    
    // Check if student has submitted report for current week
    const hasSubmittedThisWeek = reports.some(report => {
      const reportDate = new Date(report.submittedAt)
      return reportDate >= weekStart && reportDate <= weekEnd
    })
    
    if (hasSubmittedThisWeek) {
      return { needsReminder: false, reminderType: 'initial', daysLeft: 0 }
    }
    
    // Calculate days left in week
    const now = new Date()
    const daysLeft = Math.ceil((weekEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    // Determine reminder type based on days left
    let reminderType: 'initial' | 'follow_up_1' | 'follow_up_2' | 'urgent'
    if (daysLeft <= 1) {
      reminderType = 'urgent'
    } else if (daysLeft <= 2) {
      reminderType = 'follow_up_2'
    } else if (daysLeft <= 4) {
      reminderType = 'follow_up_1'
    } else {
      reminderType = 'initial'
    }
    
    return { needsReminder: true, reminderType, daysLeft }
  },

  // Send reminder to specific student
  async sendReminderToStudent(userId: string, forceType?: 'initial' | 'follow_up_1' | 'follow_up_2' | 'urgent') {
    const schedule = reminderSchedules.find(s => s.userId === userId)
    if (!schedule) {
      console.error(`❌ No reminder schedule found for user ${userId}`)
      return
    }
    
    const reminderCheck = await this.checkStudentNeedsReminder(userId)
    
    if (!reminderCheck.needsReminder && !forceType) {
      console.log(`ℹ️ Student ${schedule.userName} doesn't need reminder (already submitted)`)
      return
    }
    
    const { startFormatted, endFormatted } = getWeekDates()
    const reminderType = forceType || reminderCheck.reminderType
    
    try {
      await emailService.sendWeeklyReminder(
        {
          id: schedule.userId,
          email: schedule.userEmail,
          name: schedule.userName
        },
        startFormatted,
        endFormatted,
        reminderCheck.daysLeft
      )
      
      // Update last reminder sent
      schedule.lastReminderSent = new Date()
      schedule.reminderType = reminderType
      
      console.log(`✅ Reminder sent to ${schedule.userName} (${reminderType})`)
      
    } catch (error) {
      console.error(`❌ Failed to send reminder to ${schedule.userName}:`, error)
    }
  },

  // Send reminders to all students who need them
  async sendAllReminders() {
    console.log('📧 Checking all students for reminders...')
    
    const users = await getAllUsers()
    const students = users.filter(user => user.role === UserRole.STUDENT)
    
    let remindersSent = 0
    
    for (const student of students) {
      const reminderCheck = await this.checkStudentNeedsReminder(student.id)
      
      if (reminderCheck.needsReminder) {
        await this.sendReminderToStudent(student.id)
        remindersSent++
        
        // Add small delay to avoid overwhelming email service
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    console.log(`✅ Sent ${remindersSent} reminders out of ${students.length} students`)
    return remindersSent
  },

  // Get reminder statistics
  async getReminderStats() {
    const users = await getAllUsers()
    const students = users.filter(user => user.role === UserRole.STUDENT)
    
    const stats = {
      totalStudents: students.length,
      needingReminders: 0,
      urgentReminders: 0,
      submittedThisWeek: 0,
      remindersSentToday: 0
    }
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    for (const student of students) {
      const reminderCheck = await this.checkStudentNeedsReminder(student.id)
      const schedule = reminderSchedules.find(s => s.userId === student.id)
      
      if (reminderCheck.needsReminder) {
        stats.needingReminders++
        if (reminderCheck.reminderType === 'urgent') {
          stats.urgentReminders++
        }
      } else {
        stats.submittedThisWeek++
      }
      
      if (schedule?.lastReminderSent && schedule.lastReminderSent >= today) {
        stats.remindersSentToday++
      }
    }
    
    return stats
  },

  // Manual trigger for testing
  async triggerManualReminder(userId: string) {
    console.log(`🔧 Manual reminder trigger for user ${userId}`)
    await this.sendReminderToStudent(userId, 'initial')
  }
}

// Helper function to check if it's Monday (start of week)
export function isMonday(): boolean {
  return new Date().getDay() === 1
}

// Helper function to get optimal reminder time
export function getOptimalReminderTime(): string {
  const now = new Date()
  const hour = now.getHours()
  
  // Send reminders at 9 AM if it's early morning, otherwise at 6 PM
  if (hour < 12) {
    return '09:00'
  } else {
    return '18:00'
  }
}

// Initialize reminder system on module load
reminderScheduler.initialize().catch(console.error)