#!/usr/bin/env node

/**
 * Sunday Boundary Analysis Script
 * Analyzes progress reports submitted around the August 4-10 / August 11-17 week boundary
 * to identify potential misclassifications and timing issues.
 */

const Database = require('better-sqlite3');
const path = require('path');

// Database connection
const dbPath = path.join(__dirname, 'prisma', 'data', 'intellego.db');
const db = new Database(dbPath, { readonly: true });

console.log('='.repeat(80));
console.log('SUNDAY BOUNDARY ANALYSIS REPORT');
console.log('Analysis Period: August 4-10, 2025 vs August 11-17, 2025');
console.log('='.repeat(80));

// 1. IDENTIFY SUNDAY BOUNDARY SUBMISSIONS
console.log('\n1. SUNDAY BOUNDARY SUBMISSION ANALYSIS');
console.log('-'.repeat(50));

const sundaySubmissions = db.prepare(`
    SELECT 
        pr.id,
        pr.userId,
        u.name as studentName,
        u.studentId,
        pr.subject,
        pr.weekStart,
        pr.weekEnd,
        pr.submittedAt,
        date(pr.submittedAt) as submitDate,
        time(pr.submittedAt) as submitTime,
        strftime('%w', pr.submittedAt) as dayOfWeek,
        CASE 
            WHEN date(pr.submittedAt) = '2025-08-10' THEN 'Sunday Aug 10 (End of Week 1)'
            WHEN date(pr.submittedAt) = '2025-08-11' THEN 'Sunday Aug 11 (Start of Week 2)'
            ELSE 'Other'
        END as boundaryType
    FROM ProgressReport pr
    JOIN User u ON pr.userId = u.id
    WHERE 
        (pr.weekStart = '2025-08-04T00:00:00.000Z' OR pr.weekStart = '2025-08-11T00:00:00.000Z')
        AND date(pr.submittedAt) IN ('2025-08-10', '2025-08-11')
    ORDER BY pr.submittedAt
`).all();

console.log(`Total Sunday submissions found: ${sundaySubmissions.length}`);

// Group by boundary type
const aug10Submissions = sundaySubmissions.filter(s => s.submitDate === '2025-08-10');
const aug11Submissions = sundaySubmissions.filter(s => s.submitDate === '2025-08-11');

console.log(`\nAugust 10 (Sunday - End of Week 1): ${aug10Submissions.length} submissions`);
console.log(`August 11 (Monday - Start of Week 2): ${aug11Submissions.length} submissions`);

// 2. ANALYZE POTENTIAL MISCLASSIFICATIONS
console.log('\n2. MISCLASSIFICATION ANALYSIS');
console.log('-'.repeat(50));

// Check for reports submitted on Aug 11 but assigned to previous week
const misclassifiedAug11 = db.prepare(`
    SELECT 
        pr.id,
        pr.userId,
        u.name as studentName,
        u.studentId,
        pr.subject,
        pr.weekStart,
        pr.submittedAt
    FROM ProgressReport pr
    JOIN User u ON pr.userId = u.id
    WHERE 
        date(pr.submittedAt) = '2025-08-11'
        AND pr.weekStart = '2025-08-04T00:00:00.000Z'
`).all();

// Check for reports submitted on Aug 10 but assigned to next week
const misclassifiedAug10 = db.prepare(`
    SELECT 
        pr.id,
        pr.userId,
        u.name as studentName,
        u.studentId,
        pr.subject,
        pr.weekStart,
        pr.submittedAt
    FROM ProgressReport pr
    JOIN User u ON pr.userId = u.id
    WHERE 
        date(pr.submittedAt) = '2025-08-10'
        AND pr.weekStart = '2025-08-11T00:00:00.000Z'
`).all();

console.log(`Reports submitted Aug 11 but assigned to Week 1: ${misclassifiedAug11.length}`);
console.log(`Reports submitted Aug 10 but assigned to Week 2: ${misclassifiedAug10.length}`);

if (misclassifiedAug11.length > 0) {
    console.log('\nMISCLASSIFIED AUG 11 REPORTS (should be in Week 2):');
    misclassifiedAug11.forEach(report => {
        console.log(`  ${report.studentId} (${report.studentName}) - ${report.subject} - ${report.submittedAt}`);
    });
}

if (misclassifiedAug10.length > 0) {
    console.log('\nMISCLASSIFIED AUG 10 REPORTS (should be in Week 1):');
    misclassifiedAug10.forEach(report => {
        console.log(`  ${report.studentId} (${report.studentName}) - ${report.subject} - ${report.submittedAt}`);
    });
}

// 3. STUDENT IMPACT ASSESSMENT
console.log('\n3. STUDENT IMPACT ASSESSMENT');
console.log('-'.repeat(50));

const duplicateReports = db.prepare(`
    SELECT 
        u.studentId,
        u.name as studentName,
        pr.subject,
        COUNT(*) as reportCount,
        GROUP_CONCAT(pr.weekStart || ' (submitted: ' || date(pr.submittedAt) || ' at ' || time(pr.submittedAt) || ')') as reportDetails
    FROM ProgressReport pr
    JOIN User u ON pr.userId = u.id
    WHERE 
        pr.weekStart IN ('2025-08-04T00:00:00.000Z', '2025-08-11T00:00:00.000Z')
    GROUP BY u.studentId, pr.subject
    HAVING COUNT(*) > 1
    ORDER BY u.studentId, pr.subject
`).all();

console.log(`Students with reports in both weeks (potential duplicates): ${duplicateReports.length}`);

if (duplicateReports.length > 0) {
    console.log('\nSTUDENTS WITH REPORTS IN BOTH WEEKS:');
    duplicateReports.forEach(student => {
        console.log(`\n${student.studentId} (${student.studentName}) - ${student.subject}:`);
        console.log(`  ${student.reportDetails}`);
    });
}

// 4. CRITICAL TIMELINE ANALYSIS
console.log('\n4. CRITICAL TIMELINE ANALYSIS');
console.log('-'.repeat(50));

const criticalTimings = db.prepare(`
    SELECT 
        pr.id,
        u.studentId,
        u.name as studentName,
        pr.subject,
        pr.weekStart,
        pr.submittedAt,
        time(pr.submittedAt) as submitTime,
        CASE 
            WHEN date(pr.submittedAt) = '2025-08-10' AND time(pr.submittedAt) >= '23:50:00' THEN 'CRITICAL - Very late Sunday'
            WHEN date(pr.submittedAt) = '2025-08-11' AND time(pr.submittedAt) <= '00:10:00' THEN 'CRITICAL - Very early Monday'
            ELSE 'Normal'
        END as timingRisk
    FROM ProgressReport pr
    JOIN User u ON pr.userId = u.id
    WHERE 
        pr.weekStart IN ('2025-08-04T00:00:00.000Z', '2025-08-11T00:00:00.000Z')
        AND (
            (date(pr.submittedAt) = '2025-08-10' AND time(pr.submittedAt) >= '23:50:00') OR
            (date(pr.submittedAt) = '2025-08-11' AND time(pr.submittedAt) <= '00:10:00')
        )
    ORDER BY pr.submittedAt
`).all();

console.log(`Critical timing submissions (within 10 minutes of midnight): ${criticalTimings.length}`);

if (criticalTimings.length > 0) {
    console.log('\nCRITICAL TIMING SUBMISSIONS:');
    criticalTimings.forEach(report => {
        console.log(`  ${report.studentId} (${report.studentName}) - ${report.subject}`);
        console.log(`    Submitted: ${report.submittedAt} | Week: ${report.weekStart}`);
        console.log(`    Risk: ${report.timingRisk}`);
    });
}

// 5. DATA CORRECTION PLANNING
console.log('\n5. DATA CORRECTION PLANNING');
console.log('-'.repeat(50));

const correctionNeeded = [...misclassifiedAug11, ...misclassifiedAug10];

if (correctionNeeded.length === 0) {
    console.log('✅ GOOD NEWS: No misclassified reports found!');
    console.log('All Sunday boundary submissions appear to be correctly assigned.');
} else {
    console.log(`⚠️  ${correctionNeeded.length} reports need correction:`);
    
    correctionNeeded.forEach(report => {
        const correctWeek = report.submitDate === '2025-08-11' ? 
            '2025-08-11T00:00:00.000Z to 2025-08-17T23:59:59.999Z' : 
            '2025-08-04T00:00:00.000Z to 2025-08-10T23:59:59.999Z';
        
        console.log(`\nReport ID: ${report.id}`);
        console.log(`  Student: ${report.studentId} (${report.studentName})`);
        console.log(`  Subject: ${report.subject}`);
        console.log(`  Submitted: ${report.submittedAt}`);
        console.log(`  Current Week: ${report.weekStart}`);
        console.log(`  Correct Week: ${correctWeek}`);
    });
}

// 6. SAFETY ASSESSMENT
console.log('\n6. SAFETY ASSESSMENT');
console.log('-'.repeat(50));

// Check for potential conflicts if corrections are made
const safetyCheck = db.prepare(`
    SELECT 
        u.studentId,
        pr.subject,
        COUNT(*) as potentialConflicts
    FROM ProgressReport pr
    JOIN User u ON pr.userId = u.id
    WHERE 
        pr.weekStart IN ('2025-08-04T00:00:00.000Z', '2025-08-11T00:00:00.000Z')
        AND u.studentId IN (${correctionNeeded.map(r => `'${r.studentId}'`).join(',') || "''"})
    GROUP BY u.studentId, pr.subject
    HAVING COUNT(*) > 1
`).all();

if (safetyCheck.length === 0) {
    console.log('✅ SAFETY VERIFIED: No duplicate conflicts would be created by corrections.');
} else {
    console.log('⚠️  SAFETY WARNING: These corrections might create duplicates:');
    safetyCheck.forEach(conflict => {
        console.log(`  ${conflict.studentId} - ${conflict.subject}: ${conflict.potentialConflicts} reports`);
    });
}

// 7. SUMMARY AND RECOMMENDATIONS
console.log('\n7. SUMMARY AND RECOMMENDATIONS');
console.log('-'.repeat(50));

console.log(`\n📊 SUMMARY STATISTICS:`);
console.log(`• Total submissions on Sunday boundary: ${sundaySubmissions.length}`);
console.log(`• August 10 submissions: ${aug10Submissions.length}`);
console.log(`• August 11 submissions: ${aug11Submissions.length}`);
console.log(`• Misclassified reports: ${correctionNeeded.length}`);
console.log(`• Students with duplicate reports: ${duplicateReports.length}`);
console.log(`• Critical timing submissions: ${criticalTimings.length}`);

console.log(`\n🎯 RECOMMENDATIONS:`);
if (correctionNeeded.length === 0) {
    console.log('✅ No corrections needed - system is working correctly!');
} else {
    console.log('⚠️  Manual correction required for misclassified reports');
    console.log('📝 Review duplicate reports to ensure they are legitimate');
    console.log('🔍 Consider implementing timezone-aware week boundary logic');
}

console.log('\n='.repeat(80));
console.log('ANALYSIS COMPLETE');
console.log('='.repeat(80));

// Close database connection
db.close();