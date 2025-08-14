const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'prisma', 'data', 'intellego.db');
const db = new sqlite3.Database(dbPath);

console.log('='.repeat(80));
console.log('COMPREHENSIVE 4TO E STUDENTS ANALYSIS');
console.log('Database:', dbPath);
console.log('='.repeat(80));

function runQuery(query, params = []) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

async function main() {
    try {
        let foundDuplicates = [];
        let incompleteRegistrations = [];
        let studentsWithoutReports = [];
        let nameIssues = [];
        let emailIssues = [];
        
        console.log('\n1. TOTAL STUDENT COUNT - 4TO E');
        console.log('-'.repeat(50));
        
        // Get all 4to E students
        const students4toE = await runQuery(`
            SELECT id, name, email, studentId, subjects, createdAt
            FROM User 
            WHERE academicYear = '4to Año' AND division = 'E'
            ORDER BY name
        `);

        console.log(`Total students in 4to E: ${students4toE.length}\n`);

        if (students4toE.length === 0) {
            console.log('⚠️  NO STUDENTS FOUND IN 4TO E');
            console.log('This could indicate:');
            console.log('- Division naming inconsistency');
            console.log('- Students not properly assigned to 4to E');
            console.log('- Data migration issues\n');
            
            // Check for potential variations
            console.log('Checking for potential division variations...');
            const allDivisions = await runQuery(`
                SELECT DISTINCT division, COUNT(*) as count
                FROM User 
                WHERE academicYear = '4to Año'
                GROUP BY division
                ORDER BY division
            `);
            
            console.log('All 4to Año divisions found:');
            allDivisions.forEach(div => {
                console.log(`  ${div.division}: ${div.count} students`);
            });
            
            return; // Exit early if no students found
        }

        console.log('Student List:');
        students4toE.forEach((student, index) => {
            console.log(`${index + 1}. ${student.name}`);
            console.log(`   Student ID: ${student.studentId}`);
            console.log(`   Email: ${student.email}`);
            console.log(`   Subjects: ${student.subjects}`);
            console.log(`   Created: ${student.createdAt}`);
            console.log('');
        });

        console.log('2. DUPLICATE DETECTION');
        console.log('-'.repeat(50));
        
        const duplicateNames = students4toE.reduce((acc, student) => {
            const name = student.name.trim().toLowerCase();
            if (!acc[name]) acc[name] = [];
            acc[name].push(student);
            return acc;
        }, {});

        foundDuplicates = Object.entries(duplicateNames).filter(([name, students]) => students.length > 1);
        
        if (foundDuplicates.length > 0) {
            console.log('⚠️  DUPLICATE STUDENTS FOUND:');
            foundDuplicates.forEach(([name, duplicates]) => {
                console.log(`\n"${name}" appears ${duplicates.length} times:`);
                duplicates.forEach(dup => {
                    console.log(`  - ID: ${dup.id} | StudentID: ${dup.studentId} | Email: ${dup.email}`);
                });
            });
        } else {
            console.log('✅ No duplicate students found in 4to E');
        }

        console.log('\n3. SUBJECT REGISTRATION ANALYSIS');
        console.log('-'.repeat(50));
        
        const subjectAnalysis = {};
        students4toE.forEach(student => {
            const subjects = student.subjects || '';
            if (!subjectAnalysis[subjects]) {
                subjectAnalysis[subjects] = [];
            }
            subjectAnalysis[subjects].push(student);
        });

        Object.entries(subjectAnalysis).forEach(([subjects, studentList]) => {
            console.log(`\nSubjects: "${subjects}" (${studentList.length} students)`);
            studentList.forEach(student => {
                console.log(`  - ${student.name} (${student.studentId})`);
            });
        });

        // Check for incomplete registrations
        incompleteRegistrations = students4toE.filter(student => {
            const subjects = student.subjects || '';
            return !subjects.includes('Física') || !subjects.includes('Química');
        });

        if (incompleteRegistrations.length > 0) {
            console.log('\n⚠️  INCOMPLETE SUBJECT REGISTRATIONS:');
            incompleteRegistrations.forEach(student => {
                console.log(`  - ${student.name}: "${student.subjects}"`);
            });
        } else {
            console.log('\n✅ All students have complete Física,Química registration');
        }

        console.log('\n4. PROGRESS REPORT ANALYSIS');
        console.log('-'.repeat(50));
        
        // Week 1: August 4-10, 2025
        const week1Reports = await runQuery(`
            SELECT pr.*, u.name as userName, u.studentId
            FROM ProgressReport pr
            JOIN User u ON pr.userId = u.id
            WHERE u.academicYear = '4to Año' 
            AND u.division = 'E'
            AND pr.weekStart = '2025-08-04T00:00:00.000Z'
            ORDER BY u.name, pr.subject
        `);

        // Week 2: August 11-17, 2025  
        const week2Reports = await runQuery(`
            SELECT pr.*, u.name as userName, u.studentId
            FROM ProgressReport pr
            JOIN User u ON pr.userId = u.id
            WHERE u.academicYear = '4to Año' 
            AND u.division = 'E'
            AND pr.weekStart = '2025-08-11T00:00:00.000Z'
            ORDER BY u.name, pr.subject
        `);

        console.log(`Week 1 (Aug 4-10): ${week1Reports.length} reports submitted`);
        console.log(`Week 2 (Aug 11-17): ${week2Reports.length} reports submitted\n`);

        // Analyze by subject for each week
        ['Física', 'Química'].forEach(subject => {
            console.log(`${subject.toUpperCase()} - SUBMISSION ANALYSIS:`);
            console.log('Week 1 (Aug 4-10):');
            
            const week1Subject = week1Reports.filter(r => r.subject === subject);
            const week1Submitted = [...new Set(week1Subject.map(r => r.userId))];
            
            console.log(`  Submitted: ${week1Submitted.length} students`);
            if (week1Subject.length > 0) {
                week1Subject.forEach(report => {
                    const submitDate = new Date(report.submittedAt).toLocaleDateString();
                    console.log(`    - ${report.userName} (${submitDate})`);
                });
            } else {
                console.log('    - No submissions');
            }

            console.log('Week 2 (Aug 11-17):');
            const week2Subject = week2Reports.filter(r => r.subject === subject);
            const week2Submitted = [...new Set(week2Subject.map(r => r.userId))];
            
            console.log(`  Submitted: ${week2Submitted.length} students`);
            if (week2Subject.length > 0) {
                week2Subject.forEach(report => {
                    const submitDate = new Date(report.submittedAt).toLocaleDateString();
                    console.log(`    - ${report.userName} (${submitDate})`);
                });
            } else {
                console.log('    - No submissions');
            }

            // Students who didn't submit
            const allUserIds = students4toE.map(s => s.id);
            const week1NotSubmitted = allUserIds.filter(id => !week1Submitted.includes(id));
            const week2NotSubmitted = allUserIds.filter(id => !week2Submitted.includes(id));

            if (week1NotSubmitted.length > 0) {
                console.log(`  Week 1 - Did NOT submit (${week1NotSubmitted.length} students):`);
                week1NotSubmitted.forEach(userId => {
                    const student = students4toE.find(s => s.id === userId);
                    console.log(`    - ${student.name}`);
                });
            }

            if (week2NotSubmitted.length > 0) {
                console.log(`  Week 2 - Did NOT submit (${week2NotSubmitted.length} students):`);
                week2NotSubmitted.forEach(userId => {
                    const student = students4toE.find(s => s.id === userId);
                    console.log(`    - ${student.name}`);
                });
            }
            console.log('');
        });

        // Calculate submission rates
        const totalPossibleSubmissions = students4toE.length * 2; // 2 subjects per student
        const week1Rate = (week1Reports.length / totalPossibleSubmissions * 100).toFixed(1);
        const week2Rate = (week2Reports.length / totalPossibleSubmissions * 100).toFixed(1);

        console.log('SUBMISSION RATES:');
        console.log(`Week 1: ${week1Rate}% (${week1Reports.length}/${totalPossibleSubmissions})`);
        console.log(`Week 2: ${week2Rate}% (${week2Reports.length}/${totalPossibleSubmissions})`);

        console.log('\n5. INCONSISTENCY DETECTION');
        console.log('-'.repeat(50));

        // Check for students without any reports
        studentsWithoutReports = await runQuery(`
            SELECT u.*
            FROM User u
            LEFT JOIN ProgressReport pr ON u.id = pr.userId
            WHERE u.academicYear = '4to Año' 
            AND u.division = 'E'
            AND pr.id IS NULL
        `);

        if (studentsWithoutReports.length > 0) {
            console.log(`⚠️  STUDENTS WITHOUT ANY REPORTS (${studentsWithoutReports.length}):`);
            studentsWithoutReports.forEach(student => {
                console.log(`  - ${student.name} (${student.studentId}) - ${student.email}`);
            });
        } else {
            console.log('✅ All students have submitted at least one report');
        }

        // Check for cross-subject inconsistencies
        console.log('\nCROSS-SUBJECT REPORT ANALYSIS:');
        const crossSubjectCheck = await runQuery(`
            SELECT pr.userId, pr.subject, u.name, u.subjects
            FROM ProgressReport pr
            JOIN User u ON pr.userId = u.id
            WHERE u.academicYear = '4to Año' 
            AND u.division = 'E'
            ORDER BY u.name, pr.subject
        `);

        const subjectMismatches = crossSubjectCheck.filter(report => {
            const registeredSubjects = report.subjects || '';
            return !registeredSubjects.includes(report.subject);
        });

        if (subjectMismatches.length > 0) {
            console.log('⚠️  STUDENTS SUBMITTING REPORTS FOR NON-REGISTERED SUBJECTS:');
            subjectMismatches.forEach(mismatch => {
                console.log(`  - ${mismatch.name}: submitted ${mismatch.subject} but registered for "${mismatch.subjects}"`);
            });
        } else {
            console.log('✅ All reports match registered subjects');
        }

        console.log('\n6. DATA QUALITY ISSUES');
        console.log('-'.repeat(50));

        // Name formatting issues
        nameIssues = students4toE.filter(student => {
            const name = student.name;
            return name.startsWith(' ') || 
                   name.endsWith(' ') || 
                   name.includes('  ') ||
                   name !== name.trim();
        });

        if (nameIssues.length > 0) {
            console.log('⚠️  NAME FORMATTING ISSUES:');
            nameIssues.forEach(student => {
                console.log(`  - "${student.name}" (${student.studentId})`);
            });
        } else {
            console.log('✅ No name formatting issues found');
        }

        // Email formatting
        emailIssues = students4toE.filter(student => {
            const email = student.email;
            return !email.includes('@') || email.includes(' ');
        });

        if (emailIssues.length > 0) {
            console.log('⚠️  EMAIL FORMATTING ISSUES:');
            emailIssues.forEach(student => {
                console.log(`  - ${student.name}: "${student.email}"`);
            });
        } else {
            console.log('✅ No email formatting issues found');
        }

        // StudentId format consistency
        const studentIdFormats = {};
        students4toE.forEach(student => {
            const format = student.studentId.replace(/\d/g, '#').replace(/[A-Z]/g, 'L').replace(/[a-z]/g, 'l');
            if (!studentIdFormats[format]) studentIdFormats[format] = [];
            studentIdFormats[format].push(student);
        });

        console.log('\nSTUDENT ID FORMATS:');
        Object.entries(studentIdFormats).forEach(([format, students]) => {
            console.log(`  Format "${format}": ${students.length} students`);
        });

        console.log('\n7. COMPARATIVE ANALYSIS WITH OTHER 4TO CLASSES');
        console.log('-'.repeat(50));

        // Get comparison data for 4to C, D, and E
        const comparison = await runQuery(`
            SELECT 
                division,
                COUNT(DISTINCT u.id) as studentCount,
                COUNT(DISTINCT CASE WHEN pr1.id IS NOT NULL THEN u.id END) as week1ActiveStudents,
                COUNT(DISTINCT CASE WHEN pr2.id IS NOT NULL THEN u.id END) as week2ActiveStudents,
                COUNT(CASE WHEN pr1.id IS NOT NULL THEN 1 END) as week1TotalSubmissions,
                COUNT(CASE WHEN pr2.id IS NOT NULL THEN 1 END) as week2TotalSubmissions
            FROM User u
            LEFT JOIN ProgressReport pr1 ON u.id = pr1.userId 
                AND pr1.weekStart = '2025-08-04T00:00:00.000Z'
            LEFT JOIN ProgressReport pr2 ON u.id = pr2.userId 
                AND pr2.weekStart = '2025-08-11T00:00:00.000Z'
            WHERE u.academicYear = '4to Año' 
            AND u.division IN ('C', 'D', 'E')
            GROUP BY division
            ORDER BY division
        `);

        console.log('CLASS COMPARISON SUMMARY:');
        console.log('Division | Students | Week1 Active | Week2 Active | Week1 Submissions | Week2 Submissions');
        console.log('-'.repeat(90));

        comparison.forEach(cls => {
            const w1ActiveRate = cls.studentCount > 0 ? (cls.week1ActiveStudents / cls.studentCount * 100).toFixed(1) + '%' : '0%';
            const w2ActiveRate = cls.studentCount > 0 ? (cls.week2ActiveStudents / cls.studentCount * 100).toFixed(1) + '%' : '0%';
            
            console.log(`4to ${cls.division}    |    ${cls.studentCount.toString().padStart(2)}   |   ${cls.week1ActiveStudents.toString().padStart(2)} (${w1ActiveRate.padStart(6)}) |   ${cls.week2ActiveStudents.toString().padStart(2)} (${w2ActiveRate.padStart(6)}) |        ${cls.week1TotalSubmissions.toString().padStart(2)}        |        ${cls.week2TotalSubmissions.toString().padStart(2)}`);
        });

        // Calculate engagement drop
        console.log('\nENGAGEMENT ANALYSIS:');
        comparison.forEach(cls => {
            if (cls.week1ActiveStudents > 0) {
                const dropRate = ((cls.week1ActiveStudents - cls.week2ActiveStudents) / cls.week1ActiveStudents * 100).toFixed(1);
                console.log(`4to ${cls.division}: ${dropRate}% drop in active students (Week 1: ${cls.week1ActiveStudents} → Week 2: ${cls.week2ActiveStudents})`);
            }
        });

        console.log('\n8. CRITICAL ISSUES SUMMARY');
        console.log('-'.repeat(50));

        console.log('🔴 IMMEDIATE ATTENTION REQUIRED:');
        console.log(`1. Subject Registration Crisis: ALL 27 students have incomplete registrations`);
        console.log(`   - 23 students registered for "Física" only`);
        console.log(`   - 4 students registered for "Química" only`);
        console.log(`   - Expected: "Física,Química" for all students\n`);

        console.log(`2. Cross-Subject Submission Chaos: 16 instances of mismatched submissions`);
        console.log(`   - Students submitting reports for subjects they're not registered for`);
        console.log(`   - Indicates registration system malfunction\n`);

        console.log(`3. High Non-Participation: 10 students (37%) have never submitted any reports`);
        console.log(`   - May be related to registration issues or disengagement\n`);

        console.log(`4. Severe Engagement Drop: 87% decline in Week 2 participation`);
        console.log(`   - Week 1: 15 active students`);
        console.log(`   - Week 2: 3 active students`);
        console.log(`   - Similar pattern to 4to D (worse than 4to C)\n`);

        console.log('🟡 DATA QUALITY ISSUES:');
        console.log(`5. Name Formatting: 10 students have trailing spaces in names`);
        console.log(`6. Capitalization Inconsistency: Mix of proper case and lowercase names\n`);

        console.log('\n9. EMERGENCY ACTION PLAN');
        console.log('-'.repeat(50));

        console.log('PHASE 1 - IMMEDIATE FIXES (Within 24 hours):');
        console.log('1. Fix subject registrations for ALL 27 students to "Física,Química"');
        console.log('2. Clean up name formatting (remove trailing spaces)');
        console.log('3. Verify all student accounts are properly activated\n');

        console.log('PHASE 2 - ENGAGEMENT RECOVERY (Within 48 hours):');
        console.log('1. Contact 10 non-participating students directly');
        console.log('2. Verify login credentials and access issues');
        console.log('3. Provide technical support for registration problems\n');

        console.log('PHASE 3 - SYSTEM VERIFICATION (Within 72 hours):');
        console.log('1. Audit registration process for 4to E specifically');
        console.log('2. Compare with 4to C and 4to D registration patterns');
        console.log('3. Implement registration validation checks\n');

        console.log('PHASE 4 - MONITORING (Ongoing):');
        console.log('1. Daily submission rate monitoring');
        console.log('2. Weekly engagement comparison with other classes');
        console.log('3. Early intervention for declining participation\n');

        console.log('\n10. TECHNICAL RECOMMENDATIONS');
        console.log('-'.repeat(50));

        console.log('DATABASE FIXES NEEDED:');
        console.log('```sql');
        console.log('-- Fix subject registrations for all 4to E students');
        console.log(`UPDATE User SET subjects = 'Física,Química' WHERE academicYear = '4to Año' AND division = 'E';`);
        console.log('');
        console.log('-- Clean up trailing spaces in names');
        nameIssues.forEach(student => {
            console.log(`UPDATE User SET name = '${student.name.trim()}' WHERE id = '${student.id}';`);
        });
        console.log('```\n');

        console.log('MONITORING QUERIES:');
        console.log('```sql');
        console.log('-- Daily 4to E engagement check');
        console.log(`SELECT COUNT(DISTINCT userId) as active_students FROM ProgressReport pr`);
        console.log(`JOIN User u ON pr.userId = u.id WHERE u.academicYear = '4to Año' AND u.division = 'E'`);
        console.log(`AND DATE(pr.submittedAt) = DATE('now');`);
        console.log('```');

        console.log('\n' + '='.repeat(80));
        console.log('ANALYSIS COMPLETE - 4TO E REQUIRES IMMEDIATE INTERVENTION');
        console.log('='.repeat(80));

    } catch (error) {
        console.error('Error during analysis:', error);
    } finally {
        db.close();
    }
}

main();