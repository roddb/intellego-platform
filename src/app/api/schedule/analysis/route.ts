import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient, DayOfWeek } from "@prisma/client"

const prisma = new PrismaClient()

interface TimeSlot {
  startTime: string
  endTime: string
  durationMinutes: number
  isAvailable: boolean
  type: 'free' | 'occupied' | 'buffer'
}

interface ScheduleStats {
  totalClassHours: number
  totalExtracurricularHours: number
  totalCommittedHours: number
  averageFreeHoursPerDay: number
  busiestDay: DayOfWeek | null
  lightestDay: DayOfWeek | null
  freeTimeSlots: TimeSlot[]
  subjects: string[]
  activities: string[]
  weeklyFreeHours: number
}

// GET /api/schedule/analysis - Analyze user's schedule for free time and patterns
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const schedules = await prisma.recurringSchedule.findMany({
      where: {
        userId: session.user.id,
        isActive: true
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    })

    // Helper functions
    const timeToMinutes = (timeStr: string): number => {
      const [hours, minutes] = timeStr.split(':').map(Number)
      return hours * 60 + minutes
    }

    const minutesToTime = (minutes: number): string => {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
    }

    const calculateDuration = (startTime: string, endTime: string): number => {
      return timeToMinutes(endTime) - timeToMinutes(startTime)
    }

    // Group schedules by day
    const schedulesByDay: { [key in DayOfWeek]: any[] } = {
      MONDAY: [],
      TUESDAY: [],
      WEDNESDAY: [],
      THURSDAY: [],
      FRIDAY: [],
      SATURDAY: [],
      SUNDAY: []
    }

    schedules.forEach(schedule => {
      schedulesByDay[schedule.dayOfWeek].push(schedule)
    })

    // Calculate statistics
    let totalClassHours = 0
    let totalExtracurricularHours = 0
    const subjects = new Set<string>()
    const activities = new Set<string>()
    const dailyHours: { [key in DayOfWeek]: number } = {
      MONDAY: 0,
      TUESDAY: 0,
      WEDNESDAY: 0,
      THURSDAY: 0,
      FRIDAY: 0,
      SATURDAY: 0,
      SUNDAY: 0
    }

    // Process each day
    Object.entries(schedulesByDay).forEach(([day, daySchedules]) => {
      let dayTotal = 0
      
      daySchedules.forEach(schedule => {
        const duration = calculateDuration(schedule.startTime, schedule.endTime) / 60 // Convert to hours
        dayTotal += duration

        if (schedule.type === 'CLASS') {
          totalClassHours += duration
          if (schedule.category) subjects.add(schedule.category)
        } else if (schedule.type === 'EXTRACURRICULAR') {
          totalExtracurricularHours += duration
          if (schedule.category) activities.add(schedule.category)
        }
      })
      
      dailyHours[day as DayOfWeek] = dayTotal
    })

    // Find busiest and lightest days
    const weekdays: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
    const weekdayHours = weekdays.map(day => ({ day, hours: dailyHours[day] }))
    
    const busiestDay = weekdayHours.reduce((max, current) => 
      current.hours > max.hours ? current : max
    ).day

    const lightestDay = weekdayHours.reduce((min, current) => 
      current.hours < min.hours ? current : min
    ).day

    // Calculate free time slots for each weekday
    const freeTimeSlots: TimeSlot[] = []
    const workingHoursStart = 6 * 60 // 6 AM
    const workingHoursEnd = 22 * 60 // 10 PM

    weekdays.forEach(day => {
      const daySchedules = schedulesByDay[day].sort((a, b) => 
        timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
      )

      let currentTime = workingHoursStart

      daySchedules.forEach(schedule => {
        const scheduleStart = timeToMinutes(schedule.startTime)
        const scheduleEnd = timeToMinutes(schedule.endTime)

        // Add free time before this schedule
        if (currentTime < scheduleStart) {
          const duration = scheduleStart - currentTime
          if (duration >= 30) { // Only slots of 30+ minutes
            freeTimeSlots.push({
              startTime: minutesToTime(currentTime),
              endTime: minutesToTime(scheduleStart),
              durationMinutes: duration,
              isAvailable: true,
              type: 'free'
            })
          }
        }

        currentTime = Math.max(currentTime, scheduleEnd)
      })

      // Add remaining free time at end of day
      if (currentTime < workingHoursEnd) {
        const duration = workingHoursEnd - currentTime
        if (duration >= 30) {
          freeTimeSlots.push({
            startTime: minutesToTime(currentTime),
            endTime: minutesToTime(workingHoursEnd),
            durationMinutes: duration,
            isAvailable: true,
            type: 'free'
          })
        }
      }
    })

    // Calculate total metrics
    const totalCommittedHours = totalClassHours + totalExtracurricularHours
    const weeklyFreeHours = freeTimeSlots.reduce((total, slot) => total + (slot.durationMinutes / 60), 0)
    const averageFreeHoursPerDay = weeklyFreeHours / 5 // Only weekdays

    const stats: ScheduleStats = {
      totalClassHours: Math.round(totalClassHours * 10) / 10,
      totalExtracurricularHours: Math.round(totalExtracurricularHours * 10) / 10,
      totalCommittedHours: Math.round(totalCommittedHours * 10) / 10,
      averageFreeHoursPerDay: Math.round(averageFreeHoursPerDay * 10) / 10,
      busiestDay,
      lightestDay,
      freeTimeSlots: freeTimeSlots.sort((a, b) => a.durationMinutes - b.durationMinutes).reverse(),
      subjects: Array.from(subjects),
      activities: Array.from(activities),
      weeklyFreeHours: Math.round(weeklyFreeHours * 10) / 10
    }

    return NextResponse.json({ 
      stats,
      schedules,
      dailyHours 
    })
  } catch (error) {
    console.error("Error analyzing schedule:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// POST /api/schedule/analysis - Check for conflicts with a new schedule
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { dayOfWeek, startTime, endTime } = body

    if (!dayOfWeek || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Día, hora de inicio y hora de fin son requeridos" },
        { status: 400 }
      )
    }

    // Get existing schedules for that day
    const existingSchedules = await prisma.recurringSchedule.findMany({
      where: {
        userId: session.user.id,
        dayOfWeek: dayOfWeek as DayOfWeek,
        isActive: true
      }
    })

    const timeToMinutes = (timeStr: string): number => {
      const [hours, minutes] = timeStr.split(':').map(Number)
      return hours * 60 + minutes
    }

    const newStartMinutes = timeToMinutes(startTime)
    const newEndMinutes = timeToMinutes(endTime)

    const conflicts = existingSchedules.filter(existing => {
      const existingStartMinutes = timeToMinutes(existing.startTime)
      const existingEndMinutes = timeToMinutes(existing.endTime)

      return newStartMinutes < existingEndMinutes && newEndMinutes > existingStartMinutes
    })

    const hasConflict = conflicts.length > 0

    // Suggest alternative times if there's a conflict
    const suggestions: string[] = []
    if (hasConflict) {
      const duration = newEndMinutes - newStartMinutes
      const workingHoursStart = 6 * 60 // 6 AM
      const workingHoursEnd = 22 * 60 // 10 PM

      // Sort existing schedules by start time
      const sortedSchedules = existingSchedules.sort((a, b) => 
        timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
      )

      let currentTime = workingHoursStart

      sortedSchedules.forEach(schedule => {
        const scheduleStart = timeToMinutes(schedule.startTime)
        
        if (currentTime + duration <= scheduleStart) {
          const suggestionStart = Math.max(currentTime, workingHoursStart)
          if (suggestionStart + duration <= scheduleStart) {
            suggestions.push(`${Math.floor(suggestionStart / 60).toString().padStart(2, '0')}:${(suggestionStart % 60).toString().padStart(2, '0')} - ${Math.floor((suggestionStart + duration) / 60).toString().padStart(2, '0')}:${((suggestionStart + duration) % 60).toString().padStart(2, '0')}`)
          }
        }

        currentTime = Math.max(currentTime, timeToMinutes(schedule.endTime))
      })

      // Check end of day
      if (currentTime + duration <= workingHoursEnd) {
        suggestions.push(`${Math.floor(currentTime / 60).toString().padStart(2, '0')}:${(currentTime % 60).toString().padStart(2, '0')} - ${Math.floor((currentTime + duration) / 60).toString().padStart(2, '0')}:${((currentTime + duration) % 60).toString().padStart(2, '0')}`)
      }
    }

    return NextResponse.json({
      hasConflict,
      conflicts,
      suggestions: suggestions.slice(0, 3) // Limit to 3 suggestions
    })
  } catch (error) {
    console.error("Error checking schedule conflicts:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}