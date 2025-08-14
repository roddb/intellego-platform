/**
 * VERIFICATION SCRIPT FOR WEEK ASSIGNMENT CORRECTION
 * 
 * Purpose: Verify that the week assignment correction was successful
 * Specifically check Mia Pleitel and other students
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'prisma', 'data', 'intellego.db');

function verifyCorrection() {
    console.log('🔍 VERIFYING WEEK ASSIGNMENT CORRECTION RESULTS\n');
    
    const db = new Database(dbPath);
    
    try {
        // 1. Check Week 2 and Week 3 report counts
        console.log('📊 WEEK DISTRIBUTION AFTER CORRECTION:');
        
        const week2Count = db.prepare(`
            SELECT COUNT(*) as count FROM ProgressReport 
            WHERE weekStart = '2025-08-04T00:00:00.000Z'
        `).get();
        
        const week3Count = db.prepare(`
            SELECT COUNT(*) as count FROM ProgressReport 
            WHERE weekStart = '2025-08-11T00:00:00.000Z'
        `).get();
        
        console.log(`Week 2 (Aug 4-10): ${week2Count.count} reports`);
        console.log(`Week 3 (Aug 11-17): ${week3Count.count} reports`);
        
        // 2. Verify Mia Pleitel specifically
        console.log('\n👩‍🎓 MIA PLEITEL VERIFICATION:');
        
        const miaReports = db.prepare(`
            SELECT 
                pr.id,
                pr.subject,
                pr.weekStart,
                pr.weekEnd,
                pr.submittedAt,
                datetime(pr.submittedAt, '-3 hours') as submittedAtArgentina,
                CASE 
                    WHEN pr.weekStart = '2025-08-04T00:00:00.000Z' THEN 'Week 2 (Aug 4-10)'
                    WHEN pr.weekStart = '2025-08-11T00:00:00.000Z' THEN 'Week 3 (Aug 11-17)'
                    ELSE 'Other Week'
                END as weekLabel
            FROM ProgressReport pr
            JOIN User u ON pr.userId = u.id
            WHERE (u.name LIKE '%Mia%' OR u.name LIKE '%Pleitel%')
            ORDER BY pr.submittedAt ASC
        `).all();
        
        if (miaReports.length === 0) {
            console.log('❌ No reports found for Mia Pleitel');
        } else {
            console.log(`✅ Found ${miaReports.length} reports for Mia Pleitel:`);
            miaReports.forEach(report => {
                console.log(`  - ${report.subject}: ${report.weekLabel}`);
                console.log(`    Submitted: ${report.submittedAtArgentina} Argentina time`);
            });
        }
        
        // 3. Check for any remaining Sunday submissions in Week 3
        console.log('\n⚠️  CHECKING FOR REMAINING ISSUES:');
        
        const remainingSundayInWeek3 = db.prepare(`
            SELECT 
                pr.id,
                u.name,
                u.studentId,
                pr.subject,
                pr.submittedAt,
                datetime(pr.submittedAt, '-3 hours') as submittedAtArgentina
            FROM ProgressReport pr
            JOIN User u ON pr.userId = u.id
            WHERE pr.weekStart = '2025-08-11T00:00:00.000Z'
            AND datetime(pr.submittedAt, '-3 hours') LIKE '2025-08-10%'
            AND CAST(strftime('%H', datetime(pr.submittedAt, '-3 hours')) AS INTEGER) >= 18
        `).all();
        
        if (remainingSundayInWeek3.length === 0) {
            console.log('✅ No Sunday submissions remaining in Week 3');
        } else {
            console.log(`❌ Found ${remainingSundayInWeek3.length} Sunday submissions still in Week 3:`);
            remainingSundayInWeek3.forEach(report => {
                console.log(`  - ${report.name} (${report.studentId}): ${report.subject}`);
            });
        }
        
        // 4. Show Week 2 by location breakdown
        console.log('\n🏫 WEEK 2 REPORTS BY LOCATION:');
        
        const week2ByLocation = db.prepare(`
            SELECT 
                u.sede,
                u.academicYear,
                u.division,
                COUNT(*) as reportCount,
                COUNT(DISTINCT u.id) as studentCount
            FROM ProgressReport pr
            JOIN User u ON pr.userId = u.id
            WHERE pr.weekStart = '2025-08-04T00:00:00.000Z'
            GROUP BY u.sede, u.academicYear, u.division
            ORDER BY u.sede, u.academicYear, u.division
        `).all();
        
        week2ByLocation.forEach(location => {
            console.log(`${location.sede} ${location.academicYear} ${location.division}: ${location.reportCount} reports from ${location.studentCount} students`);
        });
        
        // 5. Sample some corrected reports
        console.log('\n📋 SAMPLE CORRECTED REPORTS:');
        
        const sampleCorrected = db.prepare(`
            SELECT 
                u.name,
                u.studentId,
                pr.subject,
                datetime(pr.submittedAt, '-3 hours') as submittedAtArgentina,
                'Week 2 (Aug 4-10)' as newWeek
            FROM ProgressReport pr
            JOIN User u ON pr.userId = u.id
            WHERE pr.weekStart = '2025-08-04T00:00:00.000Z'
            AND datetime(pr.submittedAt, '-3 hours') LIKE '2025-08-10%'
            AND CAST(strftime('%H', datetime(pr.submittedAt, '-3 hours')) AS INTEGER) >= 18
            LIMIT 10
        `).all();
        
        console.log('Sample of students moved from Week 3 to Week 2:');
        sampleCorrected.forEach(report => {
            console.log(`  - ${report.name} (${report.studentId}): ${report.subject} - ${report.submittedAtArgentina}`);
        });
        
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎉 VERIFICATION COMPLETE');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        return {
            week2Count: week2Count.count,
            week3Count: week3Count.count,
            miaReportsFound: miaReports.length,
            miaInCorrectWeek: miaReports.filter(r => r.weekStart === '2025-08-04T00:00:00.000Z').length,
            remainingIssues: remainingSundayInWeek3.length,
            correctionSuccessful: remainingSundayInWeek3.length === 0 && miaReports.some(r => r.weekStart === '2025-08-04T00:00:00.000Z')
        };
        
    } catch (error) {
        console.error('❌ Verification failed:', error);
        throw error;
    } finally {
        db.close();
    }
}

// Execute verification
if (require.main === module) {
    try {
        const results = verifyCorrection();
        console.log('\n📊 VERIFICATION SUMMARY:');
        console.log(`✅ Correction successful: ${results.correctionSuccessful ? 'YES' : 'NO'}`);
        console.log(`📈 Mia reports in correct week: ${results.miaInCorrectWeek}/${results.miaReportsFound}`);
        console.log(`⚠️  Remaining issues: ${results.remainingIssues}`);
    } catch (error) {
        console.error('Fatal verification error:', error);
        process.exit(1);
    }
}

module.exports = { verifyCorrection };