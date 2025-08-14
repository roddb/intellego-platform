/**
 * WEEK ASSIGNMENT BUG ANALYSIS SCRIPT
 * 
 * Purpose: Analyze the UTC midnight cutoff bug affecting week assignments
 * Problem: Students submitting Sunday night Argentina time got assigned to wrong week
 * 
 * Expected Findings:
 * - 59 reports incorrectly assigned to Week 3 (Aug 11-17)
 * - These should be in Week 2 (Aug 4-10) 
 * - Submissions occurred on Sunday Aug 10 night Argentina time
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'prisma', 'data', 'intellego.db');

function analyzeWeekAssignmentBug() {
    console.log('🔍 ANALYZING WEEK ASSIGNMENT BUG...\n');
    
    const db = new Database(dbPath);
    
    try {
        // 1. Get all reports in Week 3 (Aug 11-17)
        console.log('📊 STEP 1: Analyzing Week 3 reports (Aug 11-17)');
        const week3Reports = db.prepare(`
            SELECT 
                pr.id,
                pr.userId,
                u.name as userName,
                u.studentId,
                u.sede,
                u.academicYear,
                u.division,
                pr.subject,
                pr.weekStart,
                pr.weekEnd,
                pr.submittedAt,
                datetime(pr.submittedAt) as submittedAt_readable,
                -- Convert to Argentina time (UTC-3)
                datetime(pr.submittedAt, '-3 hours') as submittedAt_argentina
            FROM ProgressReport pr
            JOIN User u ON pr.userId = u.id
            WHERE pr.weekStart = '2025-08-11T00:00:00.000Z'
            ORDER BY pr.submittedAt ASC
        `).all();
        
        console.log(`Found ${week3Reports.length} reports in Week 3\n`);
        
        // 2. Identify potentially misassigned reports (Sunday submissions)
        console.log('🎯 STEP 2: Identifying potentially misassigned reports');
        const sundaySubmissions = week3Reports.filter(report => {
            const argentinaTime = new Date(report.submittedAt);
            argentinaTime.setUTCHours(argentinaTime.getUTCHours() - 3); // Convert to Argentina time
            
            // Check if submission was on Sunday (day 0) in Argentina time
            const dayOfWeek = argentinaTime.getUTCDay();
            const hour = argentinaTime.getUTCHours();
            
            // Sunday night submissions (after 6 PM Argentina time = 21:00 UTC)
            return dayOfWeek === 0 && hour >= 18; // Sunday after 6 PM Argentina time
        });
        
        console.log(`Found ${sundaySubmissions.length} Sunday night submissions that should be in Week 2\n`);
        
        // 3. Check for existing Week 2 reports for these users/subjects
        console.log('⚠️  STEP 3: Checking for potential conflicts in Week 2');
        const conflictCheck = [];
        
        for (const report of sundaySubmissions) {
            const existingWeek2 = db.prepare(`
                SELECT * FROM ProgressReport 
                WHERE userId = ? 
                AND subject = ? 
                AND weekStart = '2025-08-04T00:00:00.000Z'
            `).get(report.userId, report.subject);
            
            if (existingWeek2) {
                conflictCheck.push({
                    user: report.userName,
                    studentId: report.studentId,
                    subject: report.subject,
                    conflict: 'Already has Week 2 report'
                });
            }
        }
        
        console.log(`Found ${conflictCheck.length} potential conflicts\n`);
        
        // 4. Detailed analysis by sede and division
        console.log('🏫 STEP 4: Analysis by Sede and Division');
        const byLocation = {};
        
        sundaySubmissions.forEach(report => {
            const key = `${report.sede}-${report.academicYear}-${report.division}`;
            if (!byLocation[key]) {
                byLocation[key] = [];
            }
            byLocation[key].push(report);
        });
        
        for (const [location, reports] of Object.entries(byLocation)) {
            console.log(`${location}: ${reports.length} reports to correct`);
        }
        
        // 5. Check Mia Pleitel specifically
        console.log('\n👩‍🎓 STEP 5: Checking Mia Pleitel specifically');
        const miaReports = sundaySubmissions.filter(report => 
            report.userName.toLowerCase().includes('mia') || 
            report.userName.toLowerCase().includes('pleitel')
        );
        
        if (miaReports.length > 0) {
            console.log('✅ Found Mia Pleitel in affected reports:');
            miaReports.forEach(report => {
                console.log(`  - ${report.userName} (${report.studentId}): ${report.subject}`);
                console.log(`    Submitted: ${report.submittedAt_argentina} Argentina time`);
            });
        } else {
            console.log('❌ Mia Pleitel not found in Sunday submissions');
            // Search for Mia in all Week 3 reports
            const allMiaReports = week3Reports.filter(report => 
                report.userName.toLowerCase().includes('mia') || 
                report.userName.toLowerCase().includes('pleitel')
            );
            if (allMiaReports.length > 0) {
                console.log('📍 Found Mia in Week 3 reports (not Sunday submissions):');
                allMiaReports.forEach(report => {
                    console.log(`  - ${report.userName}: ${report.submittedAt_argentina} Argentina time`);
                });
            }
        }
        
        // 6. Generate summary report
        const analysisReport = {
            timestamp: new Date().toISOString(),
            summary: {
                totalWeek3Reports: week3Reports.length,
                sundaySubmissionsToCorrect: sundaySubmissions.length,
                potentialConflicts: conflictCheck.length,
                affectedSedes: Object.keys(byLocation).length
            },
            affectedReports: sundaySubmissions.map(report => ({
                id: report.id,
                userId: report.userId,
                userName: report.userName,
                studentId: report.studentId,
                sede: report.sede,
                academicYear: report.academicYear,
                division: report.division,
                subject: report.subject,
                submittedAt: report.submittedAt,
                submittedAtArgentina: report.submittedAt_argentina
            })),
            conflicts: conflictCheck,
            locationBreakdown: byLocation,
            miaPleitellFound: miaReports.length > 0,
            miaReports: miaReports
        };
        
        // Save analysis report
        fs.writeFileSync(
            'week-assignment-bug-analysis.json',
            JSON.stringify(analysisReport, null, 2)
        );
        
        console.log('\n📋 ANALYSIS SUMMARY:');
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`Total Week 3 reports: ${analysisReport.summary.totalWeek3Reports}`);
        console.log(`Sunday submissions to correct: ${analysisReport.summary.sundaySubmissionsToCorrect}`);
        console.log(`Potential conflicts: ${analysisReport.summary.potentialConflicts}`);
        console.log(`Affected sedes: ${analysisReport.summary.affectedSedes}`);
        console.log(`Mia Pleitel found: ${analysisReport.miaPleitellFound ? '✅ YES' : '❌ NO'}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        
        if (conflictCheck.length > 0) {
            console.log('\n⚠️  CONFLICTS DETECTED:');
            conflictCheck.forEach(conflict => {
                console.log(`  - ${conflict.user} (${conflict.studentId}): ${conflict.subject} - ${conflict.conflict}`);
            });
        }
        
        console.log('\n📄 Analysis report saved to: week-assignment-bug-analysis.json');
        console.log('🔧 Ready to proceed with correction script creation\n');
        
        return analysisReport;
        
    } catch (error) {
        console.error('❌ Error during analysis:', error);
        throw error;
    } finally {
        db.close();
    }
}

// Execute analysis
if (require.main === module) {
    try {
        analyzeWeekAssignmentBug();
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

module.exports = { analyzeWeekAssignmentBug };