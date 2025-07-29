// Hybrid storage system that can work with database or fallback to temp-storage
import * as tempStorage from './temp-storage'

// For now, use temp-storage exclusively to ensure stability
const useDatabase = false

console.log('🔄 Using temp-storage system for reliability')

// Initialize the storage system
export async function initializeStorage() {
  console.log('✅ Temp-storage system initialized')
}

// User management functions with fallback
export async function createUser(userData: any) {
  const hashedPassword = require('bcryptjs').hashSync(userData.password, 12)
  const user = {
    id: Date.now().toString(),
    ...userData,
    password: hashedPassword,
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'ACTIVE' as const,
  }
  tempStorage.addUser(user)
  return user
}

export async function findUserByEmail(email: string) {
  return tempStorage.findUserByEmail(email)
}

export async function getAllUsers() {
  return tempStorage.getAllUsers()
}

export async function findUsersByRole(role: any) {
  return tempStorage.findUsersByRole(role)
}

export async function findUserById(id: string) {
  return tempStorage.findUserById(id)
}

export async function generateStudentId() {
  return tempStorage.generateStudentId()
}

// Progress reports functions with fallback
export async function createProgressReport(data: any) {
  const report = {
    id: Date.now().toString(),
    userId: data.userId,
    weekStart: data.weekStart,
    weekEnd: data.weekEnd,
    submittedAt: new Date(),
    responses: data.responses
  }
  tempStorage.addWeeklyReport(report)
  return report
}

export async function findProgressReportsByUser(userId: string) {
  return tempStorage.findWeeklyReportsByUser(userId)
}

export async function getAllProgressReports() {
  return tempStorage.getAllWeeklyReports()
}

export async function findProgressReportByUserAndWeek(userId: string, weekStart: Date) {
  return tempStorage.findWeeklyReportByUserAndWeek(userId, weekStart)
}

export async function canSubmitThisWeek(userId: string) {
  return tempStorage.canSubmitThisWeek(userId)
}

// Utility functions (same for both)
export function getCurrentWeekStart() {
  return tempStorage.getCurrentWeekStart()
}

export function getCurrentWeekEnd() {
  return tempStorage.getCurrentWeekEnd()
}

export function getMonthWeeks(year: number, month: number) {
  return tempStorage.getMonthWeeks(year, month)
}

export function validateStudentId(studentId: string) {
  return tempStorage.validateStudentId(studentId)
}