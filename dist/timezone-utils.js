"use strict";
// Timezone utility functions for Argentina timezone conversion
// All functions handle timezone conversion from UTC to Argentina timezone
Object.defineProperty(exports, "__esModule", { value: true });
exports.toArgentinaTime = toArgentinaTime;
exports.toArgentinaDate = toArgentinaDate;
exports.toArgentinaTimeOnly = toArgentinaTimeOnly;
exports.toArgentinaDateWithDay = toArgentinaDateWithDay;
exports.formatSubmissionTimestamp = formatSubmissionTimestamp;
exports.formatArgentinaWeekRange = formatArgentinaWeekRange;
exports.getCurrentArgentinaDate = getCurrentArgentinaDate;
exports.isCurrentWeekInArgentina = isCurrentWeekInArgentina;
exports.isPastWeekInArgentina = isPastWeekInArgentina;
exports.isFutureWeekInArgentina = isFutureWeekInArgentina;
exports.getWeekStartInArgentina = getWeekStartInArgentina;
exports.getWeekEndInArgentina = getWeekEndInArgentina;
/**
 * Convert UTC date to Argentina time and return formatted string
 * Example: "10/08/2025 23:04"
 */
function toArgentinaTime(utcDate) {
    var date = new Date(utcDate);
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
function toArgentinaDate(utcDate) {
    var date = new Date(utcDate);
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
function toArgentinaTimeOnly(utcDate) {
    var date = new Date(utcDate);
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
function toArgentinaDateWithDay(utcDate) {
    var date = new Date(utcDate);
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
function formatSubmissionTimestamp(utcDate) {
    var argDate = toArgentinaDateWithDay(utcDate);
    var argTime = toArgentinaTimeOnly(utcDate);
    return "Enviado el ".concat(argDate, " a las ").concat(argTime, " (ART)");
}
/**
 * Format week range in Argentina timezone
 * Example: "04/08/2025 - 10/08/2025"
 */
function formatArgentinaWeekRange(weekStart, weekEnd) {
    var start = toArgentinaDate(weekStart);
    var end = toArgentinaDate(weekEnd);
    return "".concat(start, " - ").concat(end);
}
/**
 * Get current Argentina date as Date object
 * Useful for week calculations and comparisons
 * FIXED: Now returns the actual current time (UTC) which works correctly with week boundaries
 */
function getCurrentArgentinaDate() {
    // Simply return the current UTC time
    // The week boundaries are already properly calculated in UTC for Argentina timezone
    // This ensures correct comparisons for Sunday night submissions
    return new Date();
}
/**
 * Check if a date falls within the current week in Argentina timezone
 */
function isCurrentWeekInArgentina(weekStart, weekEnd) {
    var now = getCurrentArgentinaDate();
    var start = new Date(weekStart);
    var end = new Date(weekEnd);
    return now >= start && now <= end;
}
/**
 * Check if a date is in the past in Argentina timezone
 */
function isPastWeekInArgentina(weekEnd) {
    var now = getCurrentArgentinaDate();
    var end = new Date(weekEnd);
    return end < now;
}
/**
 * Check if a date is in the future in Argentina timezone
 */
function isFutureWeekInArgentina(weekStart) {
    var now = getCurrentArgentinaDate();
    var start = new Date(weekStart);
    return start > now;
}
/**
 * Get the start of the current week (Monday) in Argentina timezone
 * Returns a UTC Date object representing Monday 00:00:00 in Argentina time
 * FIXED: Correctly handles UTC-3 offset for Argentina
 */
function getWeekStartInArgentina(date) {
    var baseDate = date || new Date();
    // Get the day of the week in UTC (0 = Sunday, 1 = Monday, etc.)
    var currentDay = baseDate.getUTCDay();
    // Calculate how many days to go back to reach Monday
    var daysToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    // Create new date for Monday
    var monday = new Date(baseDate);
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
function getWeekEndInArgentina(date) {
    var weekStart = getWeekStartInArgentina(date);
    var weekEnd = new Date(weekStart);
    // Add 7 days to get to next Monday 00:00 Argentina
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);
    // Subtract 1 second to get Sunday 23:59:59 Argentina
    weekEnd.setUTCSeconds(weekEnd.getUTCSeconds() - 1);
    return weekEnd;
}
