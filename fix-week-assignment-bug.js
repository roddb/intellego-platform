/**
 * WEEK ASSIGNMENT BUG CORRECTION SCRIPT
 * 
 * Purpose: Fix UTC midnight cutoff bug affecting 50 progress reports
 * Problem: Sunday night submissions (Argentina time) incorrectly assigned to Week 3
 * Solution: Move these reports from Week 3 (Aug 11-17) to Week 2 (Aug 4-10)
 * 
 * SAFETY FEATURES:
 * - Pre-correction validation and backup
 * - Atomic transaction (all-or-nothing)
 * - Post-correction verification
 * - Rollback capability
 * - Detailed logging
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'prisma', 'data', 'intellego.db');

class WeekAssignmentCorrector {
    constructor() {
        this.db = null;
        this.backupData = {};
        this.correctionLog = [];
        this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    }

    log(message, level = 'INFO') {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message
        };
        this.correctionLog.push(logEntry);
        console.log(`[${level}] ${message}`);
    }

    async init() {
        this.log('🚀 Initializing Week Assignment Corrector');
        this.db = new Database(dbPath);
        
        // Enable foreign key constraints
        this.db.pragma('foreign_keys = ON');
        
        this.log('✅ Database connection established');
    }

    async validatePreconditions() {
        this.log('🔍 Validating pre-correction conditions');
        
        // 1. Verify database integrity
        const integrityCheck = this.db.pragma('integrity_check');
        if (integrityCheck[0].integrity_check !== 'ok') {
            throw new Error('Database integrity check failed');
        }
        this.log('✅ Database integrity verified');
        
        // 2. Count affected reports
        const affectedCount = this.db.prepare(`
            SELECT COUNT(*) as count
            FROM ProgressReport pr
            WHERE pr.weekStart = '2025-08-11T00:00:00.000Z'
            AND datetime(pr.submittedAt, '-3 hours') LIKE '2025-08-10%'
            AND CAST(strftime('%H', datetime(pr.submittedAt, '-3 hours')) AS INTEGER) >= 18
        `).get();
        
        if (affectedCount.count === 0) {
            throw new Error('No reports found matching correction criteria');
        }
        
        this.log(`📊 Found ${affectedCount.count} reports requiring correction`);
        
        // 3. Verify no conflicts in target week
        const conflictCheck = this.db.prepare(`
            SELECT 
                source.userId,
                source.subject,
                u.name as userName,
                u.studentId
            FROM ProgressReport source
            JOIN User u ON source.userId = u.id
            WHERE source.weekStart = '2025-08-11T00:00:00.000Z'
            AND datetime(source.submittedAt, '-3 hours') LIKE '2025-08-10%'
            AND CAST(strftime('%H', datetime(source.submittedAt, '-3 hours')) AS INTEGER) >= 18
            AND EXISTS (
                SELECT 1 FROM ProgressReport target
                WHERE target.userId = source.userId
                AND target.subject = source.subject
                AND target.weekStart = '2025-08-04T00:00:00.000Z'
            )
        `).all();
        
        if (conflictCheck.length > 0) {
            this.log('❌ CONFLICTS DETECTED:', 'ERROR');
            conflictCheck.forEach(conflict => {
                this.log(`  - ${conflict.userName} (${conflict.studentId}): ${conflict.subject}`, 'ERROR');
            });
            throw new Error(`${conflictCheck.length} conflicts detected in target week`);
        }
        
        this.log('✅ No conflicts detected in target week');
        return affectedCount.count;
    }

    async createBackup() {
        this.log('💾 Creating comprehensive backup');
        
        // Get all affected reports with full details
        const affectedReports = this.db.prepare(`
            SELECT 
                pr.*,
                u.name as userName,
                u.studentId,
                u.sede,
                u.academicYear,
                u.division,
                datetime(pr.submittedAt, '-3 hours') as submittedAtArgentina
            FROM ProgressReport pr
            JOIN User u ON pr.userId = u.id
            WHERE pr.weekStart = '2025-08-11T00:00:00.000Z'
            AND datetime(pr.submittedAt, '-3 hours') LIKE '2025-08-10%'
            AND CAST(strftime('%H', datetime(pr.submittedAt, '-3 hours')) AS INTEGER) >= 18
            ORDER BY pr.submittedAt ASC
        `).all();
        
        // Get all answers for affected reports
        const affectedAnswers = this.db.prepare(`
            SELECT a.*
            FROM Answer a
            JOIN ProgressReport pr ON a.progressReportId = pr.id
            WHERE pr.weekStart = '2025-08-11T00:00:00.000Z'
            AND datetime(pr.submittedAt, '-3 hours') LIKE '2025-08-10%'
            AND CAST(strftime('%H', datetime(pr.submittedAt, '-3 hours')) AS INTEGER) >= 18
        `).all();
        
        this.backupData = {
            timestamp: new Date().toISOString(),
            correctionType: 'week-assignment-bug-fix',
            description: 'Backup before moving Sunday submissions from Week 3 to Week 2',
            affectedReportsCount: affectedReports.length,
            affectedAnswersCount: affectedAnswers.length,
            reports: affectedReports,
            answers: affectedAnswers,
            targetWeekStart: '2025-08-04T00:00:00.000Z',
            targetWeekEnd: '2025-08-10T23:59:59.999Z'
        };
        
        // Save backup to file
        const backupFilename = `week-correction-backup-${this.timestamp}.json`;
        fs.writeFileSync(backupFilename, JSON.stringify(this.backupData, null, 2));
        
        this.log(`💾 Backup saved: ${backupFilename}`);
        this.log(`📋 Backup contains ${affectedReports.length} reports and ${affectedAnswers.length} answers`);
        
        return backupFilename;
    }

    async executeCorrection() {
        this.log('🔧 Executing week assignment correction');
        
        // Start transaction
        const transaction = this.db.transaction(() => {
            // Update all affected progress reports
            const updateResult = this.db.prepare(`
                UPDATE ProgressReport 
                SET 
                    weekStart = '2025-08-04T00:00:00.000Z',
                    weekEnd = '2025-08-10T23:59:59.999Z'
                WHERE weekStart = '2025-08-11T00:00:00.000Z'
                AND datetime(submittedAt, '-3 hours') LIKE '2025-08-10%'
                AND CAST(strftime('%H', datetime(submittedAt, '-3 hours')) AS INTEGER) >= 18
            `).run();
            
            this.log(`📊 Updated ${updateResult.changes} progress reports`);
            
            if (updateResult.changes !== this.backupData.affectedReportsCount) {
                throw new Error(`Expected to update ${this.backupData.affectedReportsCount} reports, but updated ${updateResult.changes}`);
            }
            
            return updateResult.changes;
        });
        
        try {
            const updatedCount = transaction();
            this.log(`✅ Successfully corrected ${updatedCount} reports`);
            return updatedCount;
        } catch (error) {
            this.log(`❌ Correction failed: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    async validateCorrection() {
        this.log('🔍 Validating correction results');
        
        // 1. Verify no reports left in wrong week
        const remainingWrongWeek = this.db.prepare(`
            SELECT COUNT(*) as count
            FROM ProgressReport
            WHERE weekStart = '2025-08-11T00:00:00.000Z'
            AND datetime(submittedAt, '-3 hours') LIKE '2025-08-10%'
            AND CAST(strftime('%H', datetime(submittedAt, '-3 hours')) AS INTEGER) >= 18
        `).get();
        
        if (remainingWrongWeek.count > 0) {
            throw new Error(`${remainingWrongWeek.count} reports still in wrong week`);
        }
        this.log('✅ No reports remaining in wrong week');
        
        // 2. Verify all reports moved to correct week
        const movedReports = this.db.prepare(`
            SELECT COUNT(*) as count
            FROM ProgressReport
            WHERE weekStart = '2025-08-04T00:00:00.000Z'
            AND id IN (${this.backupData.reports.map(() => '?').join(',')})
        `).get(...this.backupData.reports.map(r => r.id));
        
        if (movedReports.count !== this.backupData.affectedReportsCount) {
            throw new Error(`Expected ${this.backupData.affectedReportsCount} reports in correct week, found ${movedReports.count}`);
        }
        this.log(`✅ All ${movedReports.count} reports correctly moved to Week 2`);
        
        // 3. Verify Mia Pleitel specifically
        const miaReports = this.db.prepare(`
            SELECT 
                pr.id,
                u.name,
                u.studentId,
                pr.subject,
                pr.weekStart,
                pr.weekEnd
            FROM ProgressReport pr
            JOIN User u ON pr.userId = u.id
            WHERE (u.name LIKE '%Mia%' OR u.name LIKE '%Pleitel%')
            AND pr.weekStart = '2025-08-04T00:00:00.000Z'
            AND pr.id IN (${this.backupData.reports.map(() => '?').join(',')})
        `).all(...this.backupData.reports.map(r => r.id));
        
        if (miaReports.length > 0) {
            this.log(`✅ Mia Pleitel correction verified:`);
            miaReports.forEach(report => {
                this.log(`  - ${report.name} (${report.studentId}): ${report.subject} now in Week 2`);
            });
        }
        
        // 4. Verify data integrity
        const integrityCheck = this.db.pragma('integrity_check');
        if (integrityCheck[0].integrity_check !== 'ok') {
            throw new Error('Database integrity compromised after correction');
        }
        this.log('✅ Database integrity maintained');
        
        return {
            totalCorrected: this.backupData.affectedReportsCount,
            verifiedInCorrectWeek: movedReports.count,
            miaPleitellCorrected: miaReports.length,
            integrityMaintained: true
        };
    }

    async generateReport() {
        this.log('📋 Generating correction summary report');
        
        // Get final state of corrected reports
        const correctedReports = this.db.prepare(`
            SELECT 
                pr.id,
                u.name as userName,
                u.studentId,
                u.sede,
                u.academicYear,
                u.division,
                pr.subject,
                pr.weekStart,
                pr.weekEnd,
                pr.submittedAt,
                datetime(pr.submittedAt, '-3 hours') as submittedAtArgentina
            FROM ProgressReport pr
            JOIN User u ON pr.userId = u.id
            WHERE pr.id IN (${this.backupData.reports.map(() => '?').join(',')})
            ORDER BY u.sede, u.academicYear, u.division, u.name, pr.subject
        `).all(...this.backupData.reports.map(r => r.id));
        
        const summaryReport = {
            timestamp: new Date().toISOString(),
            correctionType: 'week-assignment-bug-fix',
            status: 'COMPLETED',
            summary: {
                totalReportsCorrected: correctedReports.length,
                originalWeek: 'Week 3 (Aug 11-17, 2025)',
                correctedWeek: 'Week 2 (Aug 4-10, 2025)',
                affectedSedes: [...new Set(correctedReports.map(r => r.sede))],
                affectedStudents: [...new Set(correctedReports.map(r => r.userName))].length,
                miaPleitellIncluded: correctedReports.some(r => r.userName.toLowerCase().includes('mia'))
            },
            correctedReports: correctedReports,
            byLocation: this.groupByLocation(correctedReports),
            miaPleitellReports: correctedReports.filter(r => 
                r.userName.toLowerCase().includes('mia') || 
                r.userName.toLowerCase().includes('pleitel')
            ),
            log: this.correctionLog
        };
        
        // Save report
        const reportFilename = `week-correction-report-${this.timestamp}.json`;
        fs.writeFileSync(reportFilename, JSON.stringify(summaryReport, null, 2));
        
        this.log(`📄 Correction report saved: ${reportFilename}`);
        return { summaryReport, reportFilename };
    }

    groupByLocation(reports) {
        const grouped = {};
        reports.forEach(report => {
            const key = `${report.sede}-${report.academicYear}-${report.division}`;
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(report);
        });
        return grouped;
    }

    async createRollbackScript() {
        this.log('🔄 Creating rollback script');
        
        const rollbackScript = `/**
 * ROLLBACK SCRIPT FOR WEEK ASSIGNMENT CORRECTION
 * Generated: ${new Date().toISOString()}
 * 
 * This script will restore the original week assignments if needed.
 * CAUTION: Only use if the correction was incorrect.
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'prisma', 'data', 'intellego.db');
const backupFile = 'week-correction-backup-${this.timestamp}.json';

function rollbackWeekCorrection() {
    console.log('🔄 Starting rollback process...');
    
    if (!fs.existsSync(backupFile)) {
        throw new Error(\`Backup file not found: \${backupFile}\`);
    }
    
    const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    const db = new Database(dbPath);
    
    try {
        const transaction = db.transaction(() => {
            let restoredCount = 0;
            
            backup.reports.forEach(report => {
                const result = db.prepare(\`
                    UPDATE ProgressReport 
                    SET weekStart = ?, weekEnd = ?
                    WHERE id = ?
                \`).run(report.weekStart, report.weekEnd, report.id);
                
                if (result.changes === 1) {
                    restoredCount++;
                }
            });
            
            console.log(\`✅ Restored \${restoredCount} reports to original week assignments\`);
            return restoredCount;
        });
        
        const restored = transaction();
        console.log(\`🔄 Rollback completed: \${restored} reports restored\`);
        
    } catch (error) {
        console.error('❌ Rollback failed:', error);
        throw error;
    } finally {
        db.close();
    }
}

// Uncomment to execute rollback
// rollbackWeekCorrection();

module.exports = { rollbackWeekCorrection };`;

        const rollbackFilename = `rollback-week-correction-${this.timestamp}.js`;
        fs.writeFileSync(rollbackFilename, rollbackScript);
        
        this.log(`🔄 Rollback script created: ${rollbackFilename}`);
        return rollbackFilename;
    }

    async cleanup() {
        if (this.db) {
            this.db.close();
            this.log('🔒 Database connection closed');
        }
    }

    async execute() {
        try {
            await this.init();
            
            const affectedCount = await this.validatePreconditions();
            const backupFile = await this.createBackup();
            const correctedCount = await this.executeCorrection();
            const validation = await this.validateCorrection();
            const { reportFilename } = await this.generateReport();
            const rollbackFile = await this.createRollbackScript();
            
            this.log('🎉 WEEK ASSIGNMENT CORRECTION COMPLETED SUCCESSFULLY');
            this.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            this.log(`📊 Reports corrected: ${correctedCount}`);
            this.log(`📄 Summary report: ${reportFilename}`);
            this.log(`💾 Backup file: ${backupFile}`);
            this.log(`🔄 Rollback script: ${rollbackFile}`);
            this.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            
            // Verify Mia Pleitel specifically
            if (validation.miaPleitellCorrected > 0) {
                this.log(`✅ Mia Pleitel's reports successfully moved to Week 2`);
            }
            
            this.log('🔍 Next step: Verify in instructor dashboard that Mia appears in "Semana 2 (04/08 - 10/08) ART"');
            
            return {
                success: true,
                correctedCount,
                validation,
                files: {
                    backup: backupFile,
                    report: reportFilename,
                    rollback: rollbackFile
                }
            };
            
        } catch (error) {
            this.log(`❌ CORRECTION FAILED: ${error.message}`, 'ERROR');
            throw error;
        } finally {
            await this.cleanup();
        }
    }
}

// Execute correction if run directly
if (require.main === module) {
    const corrector = new WeekAssignmentCorrector();
    corrector.execute()
        .then(result => {
            console.log('\\n✅ Correction completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('\\n❌ Correction failed:', error.message);
            process.exit(1);
        });
}

module.exports = { WeekAssignmentCorrector };