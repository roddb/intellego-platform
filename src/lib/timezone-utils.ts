// Timezone utility functions for Argentina timezone conversion
// All functions handle timezone conversion from UTC to Argentina timezone

/**
 * Convert UTC date to Argentina time and return formatted string
 * Example: "10/08/2025 23:04"
 */
export function toArgentinaTime(utcDate: string | Date): string {
  const date = new Date(utcDate);
  return date.toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Convert UTC date to Argentina date only (no time)
 * Example: "10/08/2025"
 */
export function toArgentinaDate(utcDate: string | Date): string {
  const date = new Date(utcDate);
  return date.toLocaleDateString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Convert UTC date to Argentina time only (no date)
 * Example: "23:04"
 */
export function toArgentinaTimeOnly(utcDate: string | Date): string {
  const date = new Date(utcDate);
  return date.toLocaleTimeString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

/**
 * Convert UTC date to formatted Argentina date with day name
 * Example: "domingo 10/08/2025"
 */
export function toArgentinaDateWithDay(utcDate: string | Date): string {
  const date = new Date(utcDate);
  return date.toLocaleDateString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Format submission timestamp for display in instructor views
 * Example: "Enviado el domingo 10/08/2025 a las 23:04 (ART)"
 */
export function formatSubmissionTimestamp(utcDate: string | Date): string {
  const argDate = toArgentinaDateWithDay(utcDate);
  const argTime = toArgentinaTimeOnly(utcDate);
  return `Enviado el ${argDate} a las ${argTime} (ART)`;
}

/**
 * Format week range in Argentina timezone
 * Example: "04/08/2025 - 10/08/2025"
 */
export function formatArgentinaWeekRange(weekStart: string | Date, weekEnd: string | Date): string {
  const start = toArgentinaDate(weekStart);
  const end = toArgentinaDate(weekEnd);
  return `${start} - ${end}`;
}

/**
 * Get current Argentina date as Date object
 * Useful for week calculations and comparisons
 * FIXED: Now returns the actual current time (UTC) which works correctly with week boundaries
 */
export function getCurrentArgentinaDate(): Date {
  // Simply return the current UTC time
  // The week boundaries are already properly calculated in UTC for Argentina timezone
  // This ensures correct comparisons for Sunday night submissions
  return new Date();
}

/**
 * Check if a date falls within the current week in Argentina timezone
 */
export function isCurrentWeekInArgentina(weekStart: string | Date, weekEnd: string | Date): boolean {
  const now = getCurrentArgentinaDate();
  const start = new Date(weekStart);
  const end = new Date(weekEnd);
  
  return now >= start && now <= end;
}

/**
 * Check if a date is in the past in Argentina timezone
 */
export function isPastWeekInArgentina(weekEnd: string | Date): boolean {
  const now = getCurrentArgentinaDate();
  const end = new Date(weekEnd);
  
  return end < now;
}

/**
 * Check if a date is in the future in Argentina timezone
 */
export function isFutureWeekInArgentina(weekStart: string | Date): boolean {
  const now = getCurrentArgentinaDate();
  const start = new Date(weekStart);
  
  return start > now;
}

/**
 * Get the start of the current week (Monday) in Argentina timezone
 * Returns a UTC Date object representing Monday 00:00:00 in Argentina time
 * FIXED: Correctly handles UTC-3 offset for Argentina
 */
export function getWeekStartInArgentina(date?: Date): Date {
  const baseDate = date || new Date();
  
  // Get the day of the week in UTC (0 = Sunday, 1 = Monday, etc.)
  const currentDay = baseDate.getUTCDay();
  
  // Calculate how many days to go back to reach Monday
  const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  
  // Create new date for Monday
  const monday = new Date(baseDate);
  monday.setUTCDate(monday.getUTCDate() + daysToMonday);
  
  // Set to 00:00 Argentina time = 03:00 UTC (Argentina is UTC-3)
  monday.setUTCHours(3, 0, 0, 0);
  
  return monday;
}

/**
 * Get the end of the current week (Sunday) in Argentina timezone
 * Returns a UTC Date object representing Sunday 23:59:59 in Argentina time
 * FIXED: Correctly calculates Sunday 23:59:59 Argentina = Monday 02:59:59 UTC
 */
export function getWeekEndInArgentina(date?: Date): Date {
  const weekStart = getWeekStartInArgentina(date);
  const weekEnd = new Date(weekStart);
  
  // Add 7 days to get to next Monday 00:00 Argentina
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);
  
  // Subtract 1 second to get Sunday 23:59:59 Argentina
  weekEnd.setUTCSeconds(weekEnd.getUTCSeconds() - 1);
  
  return weekEnd;
}