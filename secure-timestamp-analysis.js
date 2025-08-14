#!/usr/bin/env node

/**
 * SECURE TIMESTAMP ANALYSIS AND INVESTIGATION TOOL
 * 
 * Security Features:
 * - Read-only operations on production data
 * - Comprehensive logging of all investigations
 * - No direct data modification capabilities
 * - Audit trail generation for compliance
 */

const { createClient } = require('@libsql/client');
const fs = require('fs');

// Environment detection
const isProduction = process.env.NODE_ENV === 'production' || 
                    process.env.TURSO_DATABASE_URL;

// Database configuration
const dbConfig = isProduction ? {
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
} : {
    url: 'file:./prisma/data/intellego.db'
};

const db = createClient(dbConfig);

// Investigation audit log
const investigationLog = {
    startTime: new Date().toISOString(),
    environment: isProduction ? 'PRODUCTION' : 'LOCAL',
    investigator: 'SYSTEM_ADMIN',
    purpose: 'TIMESTAMP_ANOMALY_INVESTIGATION',
    activities: []
};

function logInvestigationActivity(activity, data, findings = null) {
    const entry = {
        timestamp: new Date().toISOString(),
        activity,
        data,
        findings,
        environment: investigationLog.environment
    };
    
    investigationLog.activities.push(entry);
    console.log(`🔍 INVESTIGATION: ${activity}`, data);
    
    if (findings) {
        console.log(`📊 FINDINGS:`, findings);
    }
}

async function analyzeSubmissionTimestamps() {
    logInvestigationActivity('TIMESTAMP_ANALYSIS_STARTED', {
        scope: 'ALL_PROGRESS_REPORTS',
        readonly: true
    });
    
    try {
        // 1. Analyze submission patterns
        const submissionPatterns = await db.execute(`
            SELECT 
                COUNT(*) as totalSubmissions,
                DATE(submittedAt) as submissionDate,
                MIN(submittedAt) as earliestSubmission,
                MAX(submittedAt) as latestSubmission,
                COUNT(DISTINCT userId) as uniqueStudents
            FROM ProgressReport 
            GROUP BY DATE(submittedAt)
            ORDER BY submissionDate DESC
            LIMIT 30
        `);
        
        logInvestigationActivity('SUBMISSION_PATTERNS_ANALYZED', {
            daysAnalyzed: submissionPatterns.rows.length,
            totalDays: 30
        }, {
            patterns: submissionPatterns.rows.map(row => ({
                date: row.submissionDate,
                submissions: row.totalSubmissions,
                students: row.uniqueStudents
            }))
        });
        
        // 2. Check for temporal anomalies
        const temporalAnomalies = await db.execute(`
            SELECT 
                pr.id,
                pr.userId,
                u.name,
                u.email,
                pr.subject,
                pr.weekStart,
                pr.weekEnd,
                pr.submittedAt,
                CASE 
                    WHEN pr.submittedAt < pr.weekStart THEN 'SUBMITTED_BEFORE_WEEK_START'
                    WHEN pr.submittedAt > datetime(pr.weekEnd, '+7 days') THEN 'SUBMITTED_AFTER_WEEK_PLUS_7_DAYS'
                    ELSE 'NORMAL'
                END as anomalyType
            FROM ProgressReport pr
            JOIN User u ON pr.userId = u.id
            WHERE 
                pr.submittedAt < pr.weekStart 
                OR pr.submittedAt > datetime(pr.weekEnd, '+7 days')
            ORDER BY pr.submittedAt DESC
        `);
        
        logInvestigationActivity('TEMPORAL_ANOMALIES_CHECKED', {
            anomaliesFound: temporalAnomalies.rows.length
        }, {
            anomalies: temporalAnomalies.rows
        });
        
        // 3. Analyze week boundary confusion
        const weekBoundaryIssues = await db.execute(`
            SELECT 
                pr.id,
                u.name,
                u.email,
                pr.subject,
                pr.weekStart,
                pr.weekEnd,
                pr.submittedAt,
                strftime('%w', pr.submittedAt) as dayOfWeek,
                strftime('%H', pr.submittedAt) as hourOfDay,
                CASE strftime('%w', pr.submittedAt)
                    WHEN '0' THEN 'Sunday'
                    WHEN '1' THEN 'Monday' 
                    WHEN '2' THEN 'Tuesday'
                    WHEN '3' THEN 'Wednesday'
                    WHEN '4' THEN 'Thursday'
                    WHEN '5' THEN 'Friday'
                    WHEN '6' THEN 'Saturday'
                END as dayName
            FROM ProgressReport pr
            JOIN User u ON pr.userId = u.id
            WHERE 
                strftime('%w', pr.submittedAt) IN ('0', '1') -- Sunday or Monday
                OR strftime('%H', pr.submittedAt) < '6'     -- Very early morning
                OR strftime('%H', pr.submittedAt) > '23'    -- Very late night
            ORDER BY pr.submittedAt DESC
            LIMIT 50
        `);
        
        logInvestigationActivity('WEEK_BOUNDARY_ANALYSIS', {
            potentialBoundaryIssues: weekBoundaryIssues.rows.length
        }, {
            boundarySubmissions: weekBoundaryIssues.rows.map(row => ({
                student: row.name,
                subject: row.subject,
                submittedAt: row.submittedAt,
                dayName: row.dayName,
                hour: row.hourOfDay
            }))
        });
        
        // 4. Check for duplicate submissions (potential system issues)
        const duplicateSubmissions = await db.execute(`
            SELECT 
                userId,
                subject,
                weekStart,
                COUNT(*) as submissionCount,
                GROUP_CONCAT(id) as reportIds,
                GROUP_CONCAT(submittedAt) as submissionTimes
            FROM ProgressReport
            GROUP BY userId, subject, weekStart
            HAVING COUNT(*) > 1
            ORDER BY submissionCount DESC
        `);
        
        logInvestigationActivity('DUPLICATE_SUBMISSIONS_CHECK', {
            duplicateGroups: duplicateSubmissions.rows.length
        }, {
            duplicates: duplicateSubmissions.rows
        });
        
        // 5. Student perception analysis - recent submissions
        const recentSubmissions = await db.execute(`
            SELECT 
                u.name,
                u.email,
                u.studentId,
                pr.subject,
                pr.weekStart,
                pr.weekEnd,
                pr.submittedAt,
                ROUND(
                    (julianday(pr.submittedAt) - julianday(pr.weekStart)) * 24, 2
                ) as hoursAfterWeekStart,
                ROUND(
                    (julianday(pr.weekEnd) - julianday(pr.submittedAt)) * 24, 2
                ) as hoursBeforeWeekEnd
            FROM ProgressReport pr
            JOIN User u ON pr.userId = u.id
            WHERE pr.submittedAt >= datetime('now', '-14 days')
            ORDER BY pr.submittedAt DESC
            LIMIT 100
        `);
        
        logInvestigationActivity('RECENT_SUBMISSIONS_ANALYSIS', {
            recentCount: recentSubmissions.rows.length,
            timeRange: '14 days'
        }, {
            submissions: recentSubmissions.rows.slice(0, 10) // Show first 10 for brevity
        });
        
        return {
            submissionPatterns: submissionPatterns.rows,
            temporalAnomalies: temporalAnomalies.rows,
            weekBoundaryIssues: weekBoundaryIssues.rows,
            duplicateSubmissions: duplicateSubmissions.rows,
            recentSubmissions: recentSubmissions.rows
        };
        
    } catch (error) {
        logInvestigationActivity('TIMESTAMP_ANALYSIS_ERROR', {
            error: error.message
        });
        throw error;
    }
}

async function generateTimestampInvestigationReport() {
    console.log('🔍 Starting comprehensive timestamp investigation...\n');
    
    try {
        const analysis = await analyzeSubmissionTimestamps();
        
        // Generate comprehensive report
        const report = {
            metadata: {
                generatedAt: new Date().toISOString(),
                environment: investigationLog.environment,
                purpose: 'Student submission timestamp discrepancy investigation',
                scope: 'All progress reports in database'
            },
            summary: {
                totalAnomaliesFound: analysis.temporalAnomalies.length,
                weekBoundaryIssues: analysis.weekBoundaryIssues.length,
                duplicateSubmissions: analysis.duplicateSubmissions.length,
                recentSubmissionsAnalyzed: analysis.recentSubmissions.length
            },
            findings: {
                temporalAnomalies: analysis.temporalAnomalies,
                weekBoundarySubmissions: analysis.weekBoundaryIssues,
                duplicateSubmissions: analysis.duplicateSubmissions,
                submissionPatterns: analysis.submissionPatterns
            },
            recommendations: [
                {
                    category: 'USER_INTERFACE',
                    recommendation: 'Add clear week boundary indicators in the submission form',
                    priority: 'HIGH',
                    rationale: 'Prevent student confusion about submission windows'
                },
                {
                    category: 'TIMEZONE_HANDLING', 
                    recommendation: 'Implement explicit timezone display in all date/time fields',
                    priority: 'MEDIUM',
                    rationale: 'Eliminate timezone confusion in submissions'
                },
                {
                    category: 'VALIDATION',
                    recommendation: 'Add client-side validation for submission timing',
                    priority: 'HIGH',
                    rationale: 'Prevent submissions outside valid time windows'
                },
                {
                    category: 'AUDIT_TRAIL',
                    recommendation: 'Implement immutable audit logging for all timestamp-related operations',
                    priority: 'CRITICAL',
                    rationale: 'Maintain academic integrity and compliance'
                }
            ],
            investigationLog
        };
        
        // Save report to file
        const reportFilename = `timestamp-investigation-${Date.now()}.json`;
        fs.writeFileSync(reportFilename, JSON.stringify(report, null, 2));
        
        console.log(`\n📋 Investigation report saved to: ${reportFilename}`);
        console.log(`🔍 Found ${analysis.temporalAnomalies.length} temporal anomalies`);
        console.log(`⚠️  Found ${analysis.weekBoundaryIssues.length} potential week boundary issues`);
        console.log(`🔄 Found ${analysis.duplicateSubmissions.length} duplicate submission groups`);
        
        if (analysis.temporalAnomalies.length === 0) {
            console.log('✅ No timestamp anomalies detected - student reports may be UI/perception based');
        } else {
            console.log('⚠️  Timestamp anomalies detected - require further investigation');
        }
        
        return report;
        
    } catch (error) {
        console.error('❌ Investigation failed:', error);
        throw error;
    }
}

// Safe timestamp modification function (LOCAL ONLY)
async function safeTimestampModification(reportId, newTimestamp, reason, approver) {
    if (isProduction) {
        throw new Error('❌ PRODUCTION TIMESTAMP MODIFICATION PROHIBITED - Use staging environment');
    }
    
    logInvestigationActivity('TIMESTAMP_MODIFICATION_REQUESTED', {
        reportId,
        newTimestamp,
        reason,
        approver,
        environment: 'LOCAL_ONLY'
    });
    
    try {
        // 1. Create backup of original data
        const originalReport = await db.execute(`
            SELECT * FROM ProgressReport WHERE id = ?
        `, [reportId]);
        
        if (originalReport.rows.length === 0) {
            throw new Error(`Report ${reportId} not found`);
        }
        
        const original = originalReport.rows[0];
        
        // 2. Create audit trail entry
        await db.execute(`
            CREATE TABLE IF NOT EXISTS timestamp_modifications_audit (
                id TEXT PRIMARY KEY,
                reportId TEXT,
                originalSubmittedAt TEXT,
                newSubmittedAt TEXT,
                reason TEXT,
                approvedBy TEXT,
                modifiedAt TEXT,
                modifiedBy TEXT,
                originalData TEXT
            )
        `);
        
        const auditId = 'audit_' + Date.now();
        await db.execute(`
            INSERT INTO timestamp_modifications_audit 
            (id, reportId, originalSubmittedAt, newSubmittedAt, reason, approvedBy, modifiedAt, modifiedBy, originalData)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            auditId,
            reportId,
            original.submittedAt,
            newTimestamp,
            reason,
            approver,
            new Date().toISOString(),
            'SYSTEM_ADMIN',
            JSON.stringify(original)
        ]);
        
        // 3. Perform the modification
        await db.execute(`
            UPDATE ProgressReport 
            SET submittedAt = ?, updatedAt = CURRENT_TIMESTAMP 
            WHERE id = ?
        `, [newTimestamp, reportId]);
        
        logInvestigationActivity('TIMESTAMP_MODIFICATION_COMPLETED', {
            reportId,
            auditId,
            originalTimestamp: original.submittedAt,
            newTimestamp
        });
        
        console.log(`✅ Timestamp modified successfully`);
        console.log(`   Report ID: ${reportId}`);
        console.log(`   Original: ${original.submittedAt}`);
        console.log(`   New: ${newTimestamp}`);
        console.log(`   Audit ID: ${auditId}`);
        
        return { auditId, original: original.submittedAt, new: newTimestamp };
        
    } catch (error) {
        logInvestigationActivity('TIMESTAMP_MODIFICATION_FAILED', {
            reportId,
            error: error.message
        });
        throw error;
    }
}

// Execute if run directly
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args[0] === 'investigate') {
        generateTimestampInvestigationReport()
            .then(() => {
                console.log('\n✅ Timestamp investigation completed');
                process.exit(0);
            })
            .catch((error) => {
                console.error('\n❌ Investigation failed:', error);
                process.exit(1);
            });
    } else if (args[0] === 'modify' && args.length === 4) {
        const [, reportId, newTimestamp, reason] = args;
        safeTimestampModification(reportId, newTimestamp, reason, 'MANUAL_ADMIN')
            .then(() => {
                console.log('\n✅ Timestamp modification completed');
                process.exit(0);
            })
            .catch((error) => {
                console.error('\n❌ Modification failed:', error);
                process.exit(1);
            });
    } else {
        console.log('Usage:');
        console.log('  node secure-timestamp-analysis.js investigate');
        console.log('  node secure-timestamp-analysis.js modify <reportId> <newTimestamp> <reason>');
        process.exit(1);
    }
}

module.exports = {
    analyzeSubmissionTimestamps,
    generateTimestampInvestigationReport,
    safeTimestampModification
};