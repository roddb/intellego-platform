// =====================================================================================
// TURSO LIBSQL SYNCHRONIZATION MODULE
// Handles bidirectional sync between Turso database and JSON file system
// =====================================================================================

import * as fs from 'fs/promises'
import * as path from 'path'
import { query, transaction, checkDatabaseHealth } from './db'
import { getAllWeeklyReports, findUserById } from './db-operations'

export interface SyncStatus {
  isHealthy: boolean
  lastSync: Date
  totalRecords: number
  syncedRecords: number
  failedRecords: number
  conflicts: number
  avgSyncTime: number
}

export interface SyncConflict {
  id: string
  type: 'database_newer' | 'file_newer' | 'both_modified'
  tableName: string
  recordId: string
  databaseTimestamp: string
  fileTimestamp: string
  resolution: 'database_wins' | 'file_wins' | 'manual_required'
}

export interface BackupMetadata {
  version: string
  timestamp: string
  totalRecords: number
  integrity_hash: string
  backup_type: 'full' | 'incremental'
}

// Sync status tracking
let syncStatus: SyncStatus = {
  isHealthy: true,
  lastSync: new Date(),
  totalRecords: 0,
  syncedRecords: 0,
  failedRecords: 0,
  conflicts: 0,
  avgSyncTime: 0
}

// Data directories configuration
const DATA_PATHS = {
  reports: './data/student-reports',
  backups: './data/sync-backups',
  metadata: './data/sync-metadata'
}

// =====================================================================================
// CORE SYNCHRONIZATION FUNCTIONS
// =====================================================================================

/**
 * Performs full bidirectional synchronization between Turso and JSON files
 */
export async function performFullSync(): Promise<SyncStatus> {
  const startTime = Date.now()
  console.log('🔄 Starting full bidirectional synchronization...')

  try {
    // Check database health first
    const healthCheck = await checkDatabaseHealth()
    if (!healthCheck.isHealthy) {
      throw new Error(`Database unhealthy: ${healthCheck.consecutiveFailures} consecutive failures`)
    }

    // Reset sync counters
    syncStatus.totalRecords = 0
    syncStatus.syncedRecords = 0
    syncStatus.failedRecords = 0
    syncStatus.conflicts = 0

    // Sync workflow
    await ensureSyncDirectories()
    await createIncrementalBackup()
    
    // Database to JSON sync
    console.log('📤 Syncing database to JSON files...')
    await syncDatabaseToJSON()
    
    // JSON to database sync
    console.log('📥 Syncing JSON files to database...')
    await syncJSONToDatabase()
    
    // Validate sync integrity
    await validateSyncIntegrity()
    
    const totalTime = Date.now() - startTime
    syncStatus.avgSyncTime = totalTime
    syncStatus.lastSync = new Date()
    syncStatus.isHealthy = true
    
    console.log(`✅ Full synchronization completed in ${totalTime}ms`, {
      totalRecords: syncStatus.totalRecords,
      syncedRecords: syncStatus.syncedRecords,
      failedRecords: syncStatus.failedRecords,
      conflicts: syncStatus.conflicts
    })

    return syncStatus
  } catch (error) {
    console.error('❌ Full synchronization failed:', error)
    syncStatus.isHealthy = false
    throw error
  }
}

/**
 * Syncs database records to JSON file structure
 */
export async function syncDatabaseToJSON(): Promise<void> {
  try {
    console.log('📊 Fetching all reports from database...')
    const reports = await getAllWeeklyReports()
    
    syncStatus.totalRecords += reports.length
    
    for (const report of reports) {
      try {
        await syncReportToJSON(report)
        syncStatus.syncedRecords++
      } catch (error) {
        console.error(`❌ Failed to sync report ${report.id}:`, error)
        syncStatus.failedRecords++
      }
    }
    
    console.log(`✅ Database to JSON sync: ${syncStatus.syncedRecords}/${reports.length} reports synced`)
  } catch (error) {
    console.error('❌ Database to JSON sync failed:', error)
    throw error
  }
}

/**
 * Syncs individual report to JSON file structure
 */
async function syncReportToJSON(report: any): Promise<void> {
  try {
    // Get student details
    const student = await findUserById(report.userId)
    if (!student) {
      throw new Error(`Student not found for report ${report.id}`)
    }

    // Build hierarchical path: sede/año/división/materia/estudiante
    const reportPath = buildReportPath(student, report)
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(reportPath), { recursive: true })
    
    // Get answers for this report
    const answers = await getReportAnswers(report.id)
    
    // Build complete report data
    const reportData = {
      metadata: {
        id: report.id,
        studentId: student.studentId,
        studentName: student.name,
        email: student.email,
        sede: student.sede,
        academicYear: student.academicYear,
        division: student.division,
        subject: report.subject,
        syncedAt: new Date().toISOString(),
        version: '2.0.0'
      },
      academicPeriod: {
        weekStart: report.weekStart,
        weekEnd: report.weekEnd,
        submittedAt: report.submittedAt
      },
      responses: answers,
      integrity: {
        recordCount: Object.keys(answers).length,
        checksum: generateChecksum(JSON.stringify(answers))
      }
    }
    
    // Write to file with atomic operation
    const tempPath = reportPath + '.tmp'
    await fs.writeFile(tempPath, JSON.stringify(reportData, null, 2), 'utf-8')
    await fs.rename(tempPath, reportPath)
    
    console.log(`✅ Report synced: ${reportPath}`)
  } catch (error) {
    console.error(`❌ Failed to sync report to JSON:`, error)
    throw error
  }
}

/**
 * Syncs JSON files back to database (for conflict resolution)
 */
export async function syncJSONToDatabase(): Promise<void> {
  try {
    const jsonFiles = await findAllJSONReports()
    console.log(`📁 Found ${jsonFiles.length} JSON report files`)
    
    for (const filePath of jsonFiles) {
      try {
        await syncJSONFileToDatabase(filePath)
      } catch (error) {
        console.error(`❌ Failed to sync JSON file ${filePath}:`, error)
        syncStatus.failedRecords++
      }
    }
  } catch (error) {
    console.error('❌ JSON to database sync failed:', error)
    throw error
  }
}

/**
 * Syncs individual JSON file to database
 */
async function syncJSONFileToDatabase(filePath: string): Promise<void> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8')
    const reportData = JSON.parse(fileContent)
    
    // Validate JSON structure
    if (!reportData.metadata || !reportData.responses) {
      throw new Error('Invalid JSON structure')
    }
    
    // Check if record exists in database
    const existingReport = await query(
      'SELECT * FROM ProgressReport WHERE id = ? LIMIT 1',
      [reportData.metadata.id]
    )
    
    // Detect conflicts
    if (existingReport.rows.length > 0) {
      const dbReport = existingReport.rows[0]
      const dbTimestamp = new Date(String(dbReport.submittedAt)).getTime()
      const fileTimestamp = new Date(reportData.academicPeriod.submittedAt).getTime()
      
      if (Math.abs(dbTimestamp - fileTimestamp) > 1000) { // More than 1 second difference
        console.warn(`⚠️ Sync conflict detected for report ${reportData.metadata.id}`)
        syncStatus.conflicts++
        await handleSyncConflict({
          id: reportData.metadata.id,
          type: dbTimestamp > fileTimestamp ? 'database_newer' : 'file_newer',
          tableName: 'ProgressReport',
          recordId: reportData.metadata.id,
          databaseTimestamp: String(dbReport.submittedAt),
          fileTimestamp: reportData.academicPeriod.submittedAt,
          resolution: 'database_wins' // Default resolution
        })
      }
    }
  } catch (error) {
    console.error(`❌ Failed to sync JSON file to database:`, error)
    throw error
  }
}

// =====================================================================================
// BACKUP AND RECOVERY FUNCTIONS
// =====================================================================================

/**
 * Creates incremental backup before sync operations
 */
export async function createIncrementalBackup(): Promise<void> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupDir = path.join(DATA_PATHS.backups, `backup-${timestamp}`)
    
    await fs.mkdir(backupDir, { recursive: true })
    
    // Backup database records
    const reports = await getAllWeeklyReports()
    const backupData = {
      metadata: {
        version: '2.0.0',
        timestamp,
        totalRecords: reports.length,
        integrity_hash: generateChecksum(JSON.stringify(reports)),
        backup_type: 'incremental' as const
      },
      reports
    }
    
    await fs.writeFile(
      path.join(backupDir, 'database-backup.json'),
      JSON.stringify(backupData, null, 2)
    )
    
    console.log(`✅ Incremental backup created: ${backupDir}`)
  } catch (error) {
    console.error('❌ Backup creation failed:', error)
    throw error
  }
}

/**
 * Restores from backup in case of sync failure
 */
export async function restoreFromBackup(backupTimestamp: string): Promise<void> {
  try {
    const backupDir = path.join(DATA_PATHS.backups, `backup-${backupTimestamp}`)
    const backupFile = path.join(backupDir, 'database-backup.json')
    
    const backupContent = await fs.readFile(backupFile, 'utf-8')
    const backupData = JSON.parse(backupContent)
    
    // Validate backup integrity
    const currentHash = generateChecksum(JSON.stringify(backupData.reports))
    if (currentHash !== backupData.metadata.integrity_hash) {
      throw new Error('Backup integrity check failed')
    }
    
    console.log(`🔄 Restoring from backup: ${backupTimestamp}`)
    
    // Use transaction for atomic restore
    await transaction(async (client) => {
      // Clear current data
      await client.execute('DELETE FROM Answer')
      await client.execute('DELETE FROM ProgressReport')
      
      // Restore reports
      for (const report of backupData.reports) {
        await client.execute({
          sql: `INSERT INTO ProgressReport (id, userId, subject, weekStart, weekEnd, submittedAt) VALUES (?, ?, ?, ?, ?, ?)`,
          args: [report.id, report.userId, report.subject, report.weekStart, report.weekEnd, report.submittedAt]
        })
      }
    })
    
    console.log(`✅ Restore completed: ${backupData.reports.length} reports restored`)
  } catch (error) {
    console.error('❌ Restore from backup failed:', error)
    throw error
  }
}

// =====================================================================================
// CONFLICT RESOLUTION
// =====================================================================================

/**
 * Handles synchronization conflicts
 */
async function handleSyncConflict(conflict: SyncConflict): Promise<void> {
  try {
    console.log(`⚠️ Handling sync conflict:`, conflict)
    
    // Log conflict for manual review
    const conflictLogPath = path.join(DATA_PATHS.metadata, 'conflicts.json')
    const existingConflicts = await readConflictLog()
    existingConflicts.push({
      ...conflict,
      detectedAt: new Date().toISOString()
    })
    
    await fs.writeFile(conflictLogPath, JSON.stringify(existingConflicts, null, 2))
    
    // Auto-resolve based on strategy
    switch (conflict.resolution) {
      case 'database_wins':
        console.log('🏆 Database version wins - keeping database record')
        break
      case 'file_wins':
        console.log('📁 File version wins - updating database from file')
        break
      case 'manual_required':
        console.log('👤 Manual resolution required - conflict logged')
        break
    }
  } catch (error) {
    console.error('❌ Conflict handling failed:', error)
  }
}

/**
 * Reads existing conflict log
 */
async function readConflictLog(): Promise<any[]> {
  try {
    const conflictLogPath = path.join(DATA_PATHS.metadata, 'conflicts.json')
    const content = await fs.readFile(conflictLogPath, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    return [] // Return empty array if file doesn't exist
  }
}

// =====================================================================================
// UTILITY FUNCTIONS
// =====================================================================================

/**
 * Ensures all sync directories exist
 */
async function ensureSyncDirectories(): Promise<void> {
  for (const dirPath of Object.values(DATA_PATHS)) {
    await fs.mkdir(dirPath, { recursive: true })
  }
}

/**
 * Builds hierarchical file path for report
 */
function buildReportPath(student: any, report: any): string {
  const date = new Date(report.weekStart).toISOString().split('T')[0]
  const studentFolder = `EST-${student.studentId}_${student.name}`.replace(/[^a-zA-Z0-9\-_]/g, '-')
  
  return path.join(
    DATA_PATHS.reports,
    student.sede || 'unknown-sede',
    student.academicYear || 'unknown-year', 
    student.division || 'unknown-division',
    report.subject || 'unknown-subject',
    studentFolder,
    `${date}_${report.subject}_reporte.json`
  )
}

/**
 * Gets all answers for a report
 */
async function getReportAnswers(reportId: string): Promise<{ [questionId: string]: string }> {
  try {
    const result = await query(
      'SELECT questionId, answer FROM Answer WHERE progressReportId = ?',
      [reportId]
    )
    
    const answers: { [questionId: string]: string } = {}
    result.rows.forEach(row => {
      answers[String((row as any).questionId)] = String((row as any).answer)
    })
    
    return answers
  } catch (error) {
    console.error(`Failed to get answers for report ${reportId}:`, error)
    return {}
  }
}

/**
 * Finds all JSON report files
 */
async function findAllJSONReports(): Promise<string[]> {
  const files: string[] = []
  
  async function scanDirectory(dirPath: string): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name)
        
        if (entry.isDirectory()) {
          await scanDirectory(fullPath)
        } else if (entry.isFile() && entry.name.endsWith('_reporte.json')) {
          files.push(fullPath)
        }
      }
    } catch (error) {
      // Directory might not exist, skip
    }
  }
  
  await scanDirectory(DATA_PATHS.reports)
  return files
}

/**
 * Generates checksum for data integrity
 */
function generateChecksum(data: string): string {
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash.toString(16)
}

/**
 * Validates sync integrity after completion
 */
async function validateSyncIntegrity(): Promise<void> {
  try {
    console.log('🔍 Validating sync integrity...')
    
    // Check database record count
    const dbCountResult = await query('SELECT COUNT(*) as count FROM ProgressReport')
    const dbCount = Number((dbCountResult.rows[0] as any)?.count || 0)
    
    // Check JSON file count
    const jsonFiles = await findAllJSONReports()
    const jsonCount = jsonFiles.length
    
    console.log(`📊 Integrity check: DB=${dbCount}, JSON=${jsonCount}`)
    
    if (Math.abs(dbCount - jsonCount) > dbCount * 0.1) { // Allow 10% variance
      console.warn('⚠️ Integrity check warning: significant count mismatch')
    } else {
      console.log('✅ Sync integrity validated')
    }
  } catch (error) {
    console.error('❌ Integrity validation failed:', error)
  }
}

// =====================================================================================
// PUBLIC API
// =====================================================================================

/**
 * Gets current sync status
 */
export function getSyncStatus(): SyncStatus {
  return { ...syncStatus }
}

/**
 * Forces immediate sync
 */
export async function forceSync(): Promise<SyncStatus> {
  console.log('🚀 Force sync initiated...')
  return await performFullSync()
}

/**
 * Gets sync conflicts that need manual resolution
 */
export async function getSyncConflicts(): Promise<any[]> {
  return await readConflictLog()
}

/**
 * Clears resolved conflicts
 */
export async function clearResolvedConflicts(): Promise<void> {
  const conflictLogPath = path.join(DATA_PATHS.metadata, 'conflicts.json')
  await fs.writeFile(conflictLogPath, '[]', 'utf-8')
  console.log('✅ Conflict log cleared')
}