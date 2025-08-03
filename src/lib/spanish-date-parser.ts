// Spanish Date Parser - Advanced natural language date interpretation for Spanish

export interface ParsedDate {
  date: Date | null
  confidence: number // 0-100
  interpretation: string
  isRelative: boolean
  originalText: string
}

export class SpanishDateParser {
  private static readonly DAYS_ES = {
    'lunes': 1, 'martes': 2, 'miércoles': 3, 'miercoles': 3,
    'jueves': 4, 'viernes': 5, 'sábado': 6, 'sabado': 6, 'domingo': 0
  }

  private static readonly MONTHS_ES = {
    'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3,
    'mayo': 4, 'junio': 5, 'julio': 6, 'agosto': 7,
    'septiembre': 8, 'setiembre': 8, 'octubre': 9,
    'noviembre': 10, 'diciembre': 11
  }

  private static readonly RELATIVE_TERMS = {
    'hoy': 0, 'mañana': 1, 'pasado mañana': 2,
    'la semana que viene': 7, 'la próxima semana': 7,
    'en una semana': 7, 'en dos semanas': 14,
    'el mes que viene': 30, 'el próximo mes': 30
  }

  /**
   * Parse natural language date in Spanish
   */
  static parseDate(text: string): ParsedDate {
    const normalized = text.toLowerCase().trim()
    
    // Try different parsing strategies
    const strategies = [
      this.parseRelativeDate,
      this.parseNumericDays,
      this.parseSpecificDay,
      this.parseSpecificDate,
      this.parseMonthDay,
      this.parseComplexDate
    ]

    for (const strategy of strategies) {
      const result = strategy.call(this, normalized)
      if (result.date) {
        return result
      }
    }

    return {
      date: null,
      confidence: 0,
      interpretation: `No pude interpretar la fecha: "${text}"`,
      isRelative: false,
      originalText: text
    }
  }

  /**
   * Parse relative dates (hoy, mañana, etc.)
   */
  private static parseRelativeDate(text: string): ParsedDate {
    for (const [term, days] of Object.entries(this.RELATIVE_TERMS)) {
      if (text.includes(term)) {
        const date = new Date()
        date.setDate(date.getDate() + days)
        
        return {
          date,
          confidence: 95,
          interpretation: `${term} (${date.toLocaleDateString('es-ES')})`,
          isRelative: true,
          originalText: text
        }
      }
    }

    return { date: null, confidence: 0, interpretation: '', isRelative: false, originalText: text }
  }

  /**
   * Parse numeric days (dentro de 15 días, en 5 días, etc.)
   */
  private static parseNumericDays(text: string): ParsedDate {
    // Patterns for "X días", "dentro de X días", "en X días"
    const patterns = [
      /(?:dentro de|en)\s*(\d+)\s*días?/i,
      /(\d+)\s*días?/i
    ]

    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        const days = parseInt(match[1], 10)
        if (days > 0 && days <= 365) { // Reasonable limit
          const date = new Date()
          date.setDate(date.getDate() + days)
          
          return {
            date,
            confidence: 90,
            interpretation: `En ${days} días (${date.toLocaleDateString('es-ES')})`,
            isRelative: true,
            originalText: text
          }
        }
      }
    }

    return { date: null, confidence: 0, interpretation: '', isRelative: false, originalText: text }
  }

  /**
   * Parse specific days of week (el viernes, este martes, etc.)
   */
  private static parseSpecificDay(text: string): ParsedDate {
    for (const [dayName, dayNum] of Object.entries(this.DAYS_ES)) {
      if (text.includes(dayName)) {
        const today = new Date()
        const currentDay = today.getDay()
        let targetDay = dayNum
        
        // Calculate days until target day
        let daysToAdd = (targetDay - currentDay + 7) % 7
        if (daysToAdd === 0 && !text.includes('hoy')) {
          daysToAdd = 7 // Next week if it's the same day
        }

        // Handle "próximo" or "que viene"
        if (text.includes('próximo') || text.includes('que viene')) {
          daysToAdd += 7
        }

        const date = new Date(today)
        date.setDate(today.getDate() + daysToAdd)

        return {
          date,
          confidence: 90,
          interpretation: `${dayName} ${date.toLocaleDateString('es-ES')}`,
          isRelative: true,
          originalText: text
        }
      }
    }

    return { date: null, confidence: 0, interpretation: '', isRelative: false, originalText: text }
  }

  /**
   * Parse specific dates (21 de agosto, 15/08, etc.)
   */
  private static parseSpecificDate(text: string): ParsedDate {
    // Pattern: "DD de MONTH" or "DD de MONTH de YYYY"
    const monthPattern = /(\d{1,2})\s+de\s+(\w+)(?:\s+de\s+(\d{4}))?/
    const match = text.match(monthPattern)
    
    if (match) {
      const day = parseInt(match[1])
      const monthName = match[2]
      const year = match[3] ? parseInt(match[3]) : new Date().getFullYear()
      
      const monthNum = this.MONTHS_ES[monthName as keyof typeof this.MONTHS_ES]
      if (monthNum !== undefined) {
        const date = new Date(year, monthNum, day)
        
        // If the date is in the past this year, assume next year
        if (date < new Date() && !match[3]) {
          date.setFullYear(date.getFullYear() + 1)
        }
        
        return {
          date,
          confidence: 95,
          interpretation: `${day} de ${monthName} de ${date.getFullYear()}`,
          isRelative: false,
          originalText: text
        }
      }
    }

    // Pattern: "DD/MM" or "DD/MM/YYYY"
    const numericPattern = /(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/
    const numMatch = text.match(numericPattern)
    
    if (numMatch) {
      const day = parseInt(numMatch[1])
      const month = parseInt(numMatch[2]) - 1 // JavaScript months are 0-indexed
      const year = numMatch[3] ? parseInt(numMatch[3]) : new Date().getFullYear()
      
      const date = new Date(year, month, day)
      
      // If the date is in the past this year, assume next year
      if (date < new Date() && !numMatch[3]) {
        date.setFullYear(date.getFullYear() + 1)
      }
      
      return {
        date,
        confidence: 90,
        interpretation: `${day}/${month + 1}/${date.getFullYear()}`,
        isRelative: false,
        originalText: text
      }
    }

    return { date: null, confidence: 0, interpretation: '', isRelative: false, originalText: text }
  }

  /**
   * Parse month and day without year
   */
  private static parseMonthDay(text: string): ParsedDate {
    for (const [monthName, monthNum] of Object.entries(this.MONTHS_ES)) {
      if (text.includes(monthName)) {
        // Look for day number near the month
        const dayPattern = new RegExp(`(\\d{1,2}).*${monthName}|${monthName}.*?(\\d{1,2})`)
        const match = text.match(dayPattern)
        
        if (match) {
          const day = parseInt(match[1] || match[2])
          const currentYear = new Date().getFullYear()
          const date = new Date(currentYear, monthNum, day)
          
          // If the date is in the past, assume next year
          if (date < new Date()) {
            date.setFullYear(currentYear + 1)
          }
          
          return {
            date,
            confidence: 85,
            interpretation: `${day} de ${monthName} de ${date.getFullYear()}`,
            isRelative: false,
            originalText: text
          }
        }
      }
    }

    return { date: null, confidence: 0, interpretation: '', isRelative: false, originalText: text }
  }

  /**
   * Parse complex date expressions
   */
  private static parseComplexDate(text: string): ParsedDate {
    const today = new Date()
    
    // "en X días"
    const daysPattern = /en\s+(\d+)\s+d[ií]as?/
    const daysMatch = text.match(daysPattern)
    if (daysMatch) {
      const days = parseInt(daysMatch[1])
      const date = new Date(today)
      date.setDate(today.getDate() + days)
      
      return {
        date,
        confidence: 90,
        interpretation: `en ${days} días (${date.toLocaleDateString('es-ES')})`,
        isRelative: true,
        originalText: text
      }
    }

    // "dentro de X semanas"
    const weeksPattern = /dentro\s+de\s+(\d+)\s+semanas?/
    const weeksMatch = text.match(weeksPattern)
    if (weeksMatch) {
      const weeks = parseInt(weeksMatch[1])
      const date = new Date(today)
      date.setDate(today.getDate() + (weeks * 7))
      
      return {
        date,
        confidence: 90,
        interpretation: `dentro de ${weeks} semana(s) (${date.toLocaleDateString('es-ES')})`,
        isRelative: true,
        originalText: text
      }
    }

    return { date: null, confidence: 0, interpretation: '', isRelative: false, originalText: text }
  }

  /**
   * Calculate days between two dates
   */
  static daysBetween(date1: Date, date2: Date): number {
    const timeDiff = Math.abs(date2.getTime() - date1.getTime())
    return Math.ceil(timeDiff / (1000 * 3600 * 24))
  }

  /**
   * Check if a date is valid and in the future
   */
  static isValidFutureDate(date: Date): boolean {
    const now = new Date()
    return date instanceof Date && !isNaN(date.getTime()) && date > now
  }

  /**
   * Format date for display in Spanish
   */
  static formatSpanishDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }
    return date.toLocaleDateString('es-ES', options)
  }
}