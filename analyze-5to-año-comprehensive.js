/**
 * COMPREHENSIVE 5to AÑO ANALYSIS SCRIPT
 * Following proven methodology from 4to courses analysis
 * 
 * Analysis Scope: academicYear = '5to Año' AND division IN ('A', 'B', 'D')
 * Database: Local SQLite (prisma/data/intellego.db)
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'prisma', 'data', 'intellego.db');

console.log('🔍 COMPREHENSIVE 5to AÑO ANALYSIS');
console.log('=====================================');
console.log(`Database: ${dbPath}`);
console.log(`Analysis Date: ${new Date().toISOString()}`);
console.log('Courses: 5to A, 5to B, 5to D');
console.log('=====================================\n');

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to local SQLite database\n');
});

// Analysis results storage
const analysisResults = {
  timestamp: new Date().toISOString(),
  courses: {},
  summary: {},
  criticalIssues: [],
  actionPlan: []
};

// Week definitions (matching our established pattern)
const WEEKS = [
  { id: 'week1', start: '2025-08-04', end: '2025-08-10', label: 'Week 1 (Aug 4-10)' },
  { id: 'week2', start: '2025-08-11', end: '2025-08-17', label: 'Week 2 (Aug 11-17)' }
];

const COURSES = ['A', 'B', 'D'];
const ACADEMIC_YEAR = '5to Año';

// Expected subjects for 5to Año (to be verified)
const EXPECTED_SUBJECTS = [
  'Matemática',
  'Lengua y Literatura', 
  'Historia',
  'Geografía',
  'Física',
  'Química',
  'Biología',
  'Inglés',
  'Educación Física',
  'Arte'
];

/**
 * 1. STUDENT COUNT & REGISTRATION ANALYSIS
 */
async function analyzeStudentRegistrations() {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        division,
        COUNT(*) as student_count,
        GROUP_CONCAT(name || ' (' || studentId || ')') as student_list
      FROM User 
      WHERE academicYear = ? 
        AND division IN ('A', 'B', 'D')
        AND role = 'STUDENT'
        AND status = 'ACTIVE'
      GROUP BY division
      ORDER BY division
    `;

    db.all(query, [ACADEMIC_YEAR], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      console.log('📊 1. STUDENT REGISTRATION ANALYSIS');
      console.log('=====================================');
      
      rows.forEach(row => {
        const students = row.student_list ? row.student_list.split(',') : [];
        console.log(`\n🎓 5to ${row.division}:`);
        console.log(`   Total Students: ${row.student_count}`);
        console.log(`   Students List:`);
        students.forEach((student, index) => {
          console.log(`   ${index + 1}. ${student.trim()}`);
        });
        
        analysisResults.courses[`5to${row.division}`] = {
          division: row.division,
          totalStudents: row.student_count,
          students: students.map(s => s.trim())
        };
      });

      resolve(rows);
    });
  });
}

/**
 * 2. DETAILED STUDENT INFORMATION WITH SUBJECTS
 */
async function analyzeStudentDetails() {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        division,
        name,
        email,
        studentId,
        subjects,
        createdAt
      FROM User 
      WHERE academicYear = ? 
        AND division IN ('A', 'B', 'D')
        AND role = 'STUDENT'
        AND status = 'ACTIVE'
      ORDER BY division, name
    `;

    db.all(query, [ACADEMIC_YEAR], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      console.log('\n📋 2. DETAILED STUDENT INFORMATION');
      console.log('=====================================');

      const courseDetails = {};
      const subjectIssues = [];
      const duplicateIssues = [];
      const formatIssues = [];

      rows.forEach(student => {
        const course = `5to${student.division}`;
        if (!courseDetails[course]) {
          courseDetails[course] = [];
        }

        // Parse subjects
        let subjects = [];
        try {
          subjects = student.subjects ? JSON.parse(student.subjects) : [];
        } catch (e) {
          subjectIssues.push(`${student.name} (${student.studentId}): Invalid subjects JSON`);
        }

        // Check for formatting issues
        if (student.name.trim() !== student.name) {
          formatIssues.push(`${student.name}: Name has leading/trailing spaces`);
        }

        // Check for duplicate patterns
        const duplicateCheck = rows.filter(r => 
          r.name.toLowerCase().trim() === student.name.toLowerCase().trim() && 
          r.division === student.division
        );
        if (duplicateCheck.length > 1) {
          duplicateIssues.push(`${student.name} appears ${duplicateCheck.length} times in 5to ${student.division}`);
        }

        courseDetails[course].push({
          name: student.name,
          email: student.email,
          studentId: student.studentId,
          subjects: subjects,
          subjectCount: subjects.length,
          createdAt: student.createdAt
        });
      });

      // Display detailed information
      COURSES.forEach(division => {
        const course = `5to${division}`;
        const students = courseDetails[course] || [];
        
        console.log(`\n🎓 DETAILED ANALYSIS - 5to ${division}`);
        console.log(`   Total Students: ${students.length}`);
        
        if (students.length > 0) {
          console.log(`   Subject Registration Summary:`);
          const subjectCounts = {};
          students.forEach(student => {
            const count = student.subjectCount;
            subjectCounts[count] = (subjectCounts[count] || 0) + 1;
          });
          
          Object.keys(subjectCounts).sort().forEach(count => {
            console.log(`     ${count} subjects: ${subjectCounts[count]} students`);
          });

          // Show first few students as sample
          console.log(`   Sample Students (first 3):`);
          students.slice(0, 3).forEach((student, index) => {
            console.log(`     ${index + 1}. ${student.name} (${student.studentId})`);
            console.log(`        Email: ${student.email}`);
            console.log(`        Subjects (${student.subjectCount}): ${student.subjects.join(', ')}`);
            console.log(`        Registered: ${student.createdAt}`);
          });
        }

        analysisResults.courses[course].details = students;
      });

      // Report issues
      if (subjectIssues.length > 0) {
        console.log(`\n⚠️  SUBJECT PARSING ISSUES (${subjectIssues.length}):`);
        subjectIssues.forEach(issue => console.log(`   - ${issue}`));
        analysisResults.criticalIssues.push(...subjectIssues);
      }

      if (duplicateIssues.length > 0) {
        console.log(`\n⚠️  DUPLICATE STUDENT ISSUES (${duplicateIssues.length}):`);
        duplicateIssues.forEach(issue => console.log(`   - ${issue}`));
        analysisResults.criticalIssues.push(...duplicateIssues);
      }

      if (formatIssues.length > 0) {
        console.log(`\n⚠️  FORMATTING ISSUES (${formatIssues.length}):`);
        formatIssues.forEach(issue => console.log(`   - ${issue}`));
        analysisResults.criticalIssues.push(...formatIssues);
      }

      resolve(courseDetails);
    });
  });
}

/**
 * 3. PROGRESS REPORT ANALYSIS BY WEEK AND SUBJECT
 */
async function analyzeProgressReports() {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        u.division,
        u.name as student_name,
        u.studentId,
        pr.subject,
        pr.weekStart,
        pr.weekEnd,
        pr.submittedAt,
        COUNT(a.id) as answer_count
      FROM User u
      LEFT JOIN ProgressReport pr ON u.id = pr.userId
      LEFT JOIN Answer a ON pr.id = a.progressReportId
      WHERE u.academicYear = ? 
        AND u.division IN ('A', 'B', 'D')
        AND u.role = 'STUDENT'
        AND u.status = 'ACTIVE'
      GROUP BY u.id, pr.id
      ORDER BY u.division, u.name, pr.weekStart, pr.subject
    `;

    db.all(query, [ACADEMIC_YEAR], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      console.log('\n📈 3. PROGRESS REPORT ANALYSIS');
      console.log('=====================================');

      const reportAnalysis = {};
      const subjectReports = {};
      const weeklyStats = {};

      // Initialize structures
      COURSES.forEach(division => {
        const course = `5to${division}`;
        reportAnalysis[course] = {
          totalStudents: 0,
          studentsWithReports: new Set(),
          studentsWithoutReports: [],
          weeklyBreakdown: {},
          subjectBreakdown: {}
        };
        
        WEEKS.forEach(week => {
          weeklyStats[`${course}-${week.id}`] = {
            course: course,
            week: week.label,
            totalReports: 0,
            subjects: {}
          };
        });
      });

      // Process all rows
      rows.forEach(row => {
        const course = `5to${row.division}`;
        const studentKey = `${row.student_name}-${row.studentId}`;
        
        // Count unique students
        if (!reportAnalysis[course].totalStudents) {
          reportAnalysis[course].totalStudents = 0;
        }
        
        if (row.subject && row.weekStart) {
          // Student has at least one report
          reportAnalysis[course].studentsWithReports.add(studentKey);
          
          // Determine which week this report belongs to
          const week = WEEKS.find(w => row.weekStart >= w.start && row.weekStart <= w.end);
          if (week) {
            const weekKey = `${course}-${week.id}`;
            weeklyStats[weekKey].totalReports++;
            
            if (!weeklyStats[weekKey].subjects[row.subject]) {
              weeklyStats[weekKey].subjects[row.subject] = 0;
            }
            weeklyStats[weekKey].subjects[row.subject]++;
          }

          // Subject breakdown
          if (!reportAnalysis[course].subjectBreakdown[row.subject]) {
            reportAnalysis[course].subjectBreakdown[row.subject] = 0;
          }
          reportAnalysis[course].subjectBreakdown[row.subject]++;
        }
      });

      // Calculate students without reports and total counts
      COURSES.forEach(division => {
        const course = `5to${division}`;
        const courseStudents = analysisResults.courses[course]?.details || [];
        
        reportAnalysis[course].totalStudents = courseStudents.length;
        
        courseStudents.forEach(student => {
          const studentKey = `${student.name}-${student.studentId}`;
          if (!reportAnalysis[course].studentsWithReports.has(studentKey)) {
            reportAnalysis[course].studentsWithoutReports.push(student.name);
          }
        });
      });

      // Display results
      COURSES.forEach(division => {
        const course = `5to${division}`;
        const stats = reportAnalysis[course];
        
        console.log(`\n🎓 PROGRESS REPORTS - 5to ${division}`);
        console.log(`   Total Students: ${stats.totalStudents}`);
        console.log(`   Students with Reports: ${stats.studentsWithReports.size}`);
        console.log(`   Students without Reports: ${stats.studentsWithoutReports.length}`);
        
        if (stats.studentsWithoutReports.length > 0) {
          console.log(`   Students with NO reports:`);
          stats.studentsWithoutReports.forEach(name => {
            console.log(`     - ${name}`);
          });
        }

        console.log(`   Subject Report Breakdown:`);
        Object.keys(stats.subjectBreakdown).forEach(subject => {
          console.log(`     ${subject}: ${stats.subjectBreakdown[subject]} reports`);
        });
      });

      // Weekly analysis
      console.log(`\n📅 WEEKLY SUBMISSION ANALYSIS`);
      WEEKS.forEach(week => {
        console.log(`\n   ${week.label}:`);
        COURSES.forEach(division => {
          const course = `5to${division}`;
          const weekKey = `${course}-${week.id}`;
          const weekStats = weeklyStats[weekKey];
          
          console.log(`     5to ${division}: ${weekStats.totalReports} total reports`);
          Object.keys(weekStats.subjects).forEach(subject => {
            console.log(`       - ${subject}: ${weekStats.subjects[subject]} reports`);
          });
        });
      });

      analysisResults.courses = { ...analysisResults.courses };
      COURSES.forEach(division => {
        const course = `5to${division}`;
        analysisResults.courses[course] = {
          ...analysisResults.courses[course],
          reportAnalysis: reportAnalysis[course]
        };
      });

      resolve(reportAnalysis);
    });
  });
}

/**
 * 4. SUBJECT REGISTRATION vs REPORT SUBMISSION ANALYSIS
 */
async function analyzeSubjectConsistency() {
  return new Promise((resolve, reject) => {
    console.log('\n🔍 4. SUBJECT CONSISTENCY ANALYSIS');
    console.log('=====================================');

    // Get all unique subjects from registrations and reports
    const registrationQuery = `
      SELECT DISTINCT division, subjects
      FROM User 
      WHERE academicYear = ? 
        AND division IN ('A', 'B', 'D')
        AND role = 'STUDENT'
        AND status = 'ACTIVE'
    `;

    const reportsQuery = `
      SELECT DISTINCT pr.subject, u.division
      FROM ProgressReport pr
      JOIN User u ON pr.userId = u.id
      WHERE u.academicYear = ? 
        AND u.division IN ('A', 'B', 'D')
        AND u.role = 'STUDENT'
        AND u.status = 'ACTIVE'
      ORDER BY u.division, pr.subject
    `;

    db.all(registrationQuery, [ACADEMIC_YEAR], (err, registrationRows) => {
      if (err) {
        reject(err);
        return;
      }

      db.all(reportsQuery, [ACADEMIC_YEAR], (err, reportRows) => {
        if (err) {
          reject(err);
          return;
        }

        const subjectsAnalysis = {};
        
        // Analyze registered subjects
        COURSES.forEach(division => {
          const course = `5to${division}`;
          subjectsAnalysis[course] = {
            registeredSubjects: new Set(),
            reportedSubjects: new Set(),
            inconsistencies: []
          };

          // Get all subjects students are registered for
          registrationRows
            .filter(row => row.division === division)
            .forEach(row => {
              try {
                const subjects = row.subjects ? JSON.parse(row.subjects) : [];
                subjects.forEach(subject => {
                  subjectsAnalysis[course].registeredSubjects.add(subject);
                });
              } catch (e) {
                console.log(`   ⚠️  Error parsing subjects for ${division}: ${row.subjects}`);
              }
            });

          // Get all subjects with reports
          reportRows
            .filter(row => row.division === division)
            .forEach(row => {
              if (row.subject) {
                subjectsAnalysis[course].reportedSubjects.add(row.subject);
              }
            });

          // Find inconsistencies
          const registered = Array.from(subjectsAnalysis[course].registeredSubjects);
          const reported = Array.from(subjectsAnalysis[course].reportedSubjects);

          const onlyRegistered = registered.filter(s => !reported.includes(s));
          const onlyReported = reported.filter(s => !registered.includes(s));

          if (onlyRegistered.length > 0) {
            subjectsAnalysis[course].inconsistencies.push({
              type: 'registered_not_reported',
              subjects: onlyRegistered
            });
          }

          if (onlyReported.length > 0) {
            subjectsAnalysis[course].inconsistencies.push({
              type: 'reported_not_registered',
              subjects: onlyReported
            });
          }
        });

        // Display analysis
        COURSES.forEach(division => {
          const course = `5to${division}`;
          const analysis = subjectsAnalysis[course];
          
          console.log(`\n🎓 SUBJECT CONSISTENCY - 5to ${division}`);
          console.log(`   Registered Subjects (${analysis.registeredSubjects.size}):`);
          Array.from(analysis.registeredSubjects).sort().forEach(subject => {
            console.log(`     - ${subject}`);
          });
          
          console.log(`   Subjects with Reports (${analysis.reportedSubjects.size}):`);
          Array.from(analysis.reportedSubjects).sort().forEach(subject => {
            console.log(`     - ${subject}`);
          });

          if (analysis.inconsistencies.length > 0) {
            console.log(`   ⚠️  INCONSISTENCIES FOUND:`);
            analysis.inconsistencies.forEach(issue => {
              if (issue.type === 'registered_not_reported') {
                console.log(`     Registered but no reports: ${issue.subjects.join(', ')}`);
              } else if (issue.type === 'reported_not_registered') {
                console.log(`     Reports submitted but not registered: ${issue.subjects.join(', ')}`);
              }
            });
            
            analysisResults.criticalIssues.push(
              `5to ${division}: Subject registration inconsistencies found`
            );
          }
        });

        analysisResults.subjectConsistency = subjectsAnalysis;
        resolve(subjectsAnalysis);
      });
    });
  });
}

/**
 * 5. COMPARATIVE ANALYSIS WITH 4to COURSES
 */
async function compareWith4toCourses() {
  return new Promise((resolve, reject) => {
    const query4to = `
      SELECT 
        division,
        COUNT(*) as student_count,
        COUNT(DISTINCT pr.id) as report_count
      FROM User u
      LEFT JOIN ProgressReport pr ON u.id = pr.userId
      WHERE u.academicYear = '4to Año' 
        AND u.division IN ('C', 'D', 'E')
        AND u.role = 'STUDENT'
        AND u.status = 'ACTIVE'
      GROUP BY u.division
      ORDER BY u.division
    `;

    db.all(query4to, [], (err, rows4to) => {
      if (err) {
        reject(err);
        return;
      }

      console.log('\n📊 5. COMPARATIVE ANALYSIS: 5to vs 4to');
      console.log('=====================================');

      // Calculate 5to totals
      let total5toStudents = 0;
      let total5toReports = 0;
      
      COURSES.forEach(division => {
        const course = `5to${division}`;
        const courseData = analysisResults.courses[course];
        if (courseData) {
          total5toStudents += courseData.totalStudents || 0;
          if (courseData.reportAnalysis) {
            Object.values(courseData.reportAnalysis.subjectBreakdown || {}).forEach(count => {
              total5toReports += count;
            });
          }
        }
      });

      // Calculate 4to totals
      let total4toStudents = 0;
      let total4toReports = 0;
      
      rows4to.forEach(row => {
        total4toStudents += row.student_count;
        total4toReports += row.report_count || 0;
      });

      console.log(`\n📈 SUMMARY COMPARISON:`);
      console.log(`   5to Año Total Students: ${total5toStudents}`);
      console.log(`   4to Año Total Students: ${total4toStudents}`);
      console.log(`   5to Año Total Reports: ${total5toReports}`);
      console.log(`   4to Año Total Reports: ${total4toReports}`);
      
      if (total5toStudents > 0) {
        console.log(`   5to Año Reports per Student: ${(total5toReports / total5toStudents).toFixed(2)}`);
      }
      if (total4toStudents > 0) {
        console.log(`   4to Año Reports per Student: ${(total4toReports / total4toStudents).toFixed(2)}`);
      }

      console.log(`\n📋 COURSE-BY-COURSE COMPARISON:`);
      console.log(`   5to Courses:`);
      COURSES.forEach(division => {
        const course = `5to${division}`;
        const courseData = analysisResults.courses[course];
        const reportCount = courseData?.reportAnalysis ? 
          Object.values(courseData.reportAnalysis.subjectBreakdown || {}).reduce((a, b) => a + b, 0) : 0;
        
        console.log(`     5to ${division}: ${courseData?.totalStudents || 0} students, ${reportCount} reports`);
      });

      console.log(`   4to Courses:`);
      rows4to.forEach(row => {
        console.log(`     4to ${row.division}: ${row.student_count} students, ${row.report_count || 0} reports`);
      });

      analysisResults.comparison = {
        'quintoAño': {
          totalStudents: total5toStudents,
          totalReports: total5toReports,
          reportsPerStudent: total5toStudents > 0 ? (total5toReports / total5toStudents) : 0
        },
        'cuartoAño': {
          totalStudents: total4toStudents,
          totalReports: total4toReports,
          reportsPerStudent: total4toStudents > 0 ? (total4toReports / total4toStudents) : 0
        }
      };

      resolve({
        quintoAño: { totalStudents: total5toStudents, totalReports: total5toReports },
        cuartoAño: { totalStudents: total4toStudents, totalReports: total4toReports }
      });
    });
  });
}

/**
 * 6. GENERATE SUMMARY AND ACTION PLAN
 */
function generateSummaryAndActionPlan() {
  console.log('\n🎯 6. SUMMARY & ACTION PLAN');
  console.log('=====================================');

  // Summary Dashboard
  let totalStudents = 0;
  let totalReports = 0;
  let studentsWithReports = 0;
  let studentsWithoutReports = 0;

  COURSES.forEach(division => {
    const course = `5to${division}`;
    const courseData = analysisResults.courses[course];
    if (courseData) {
      totalStudents += courseData.totalStudents || 0;
      if (courseData.reportAnalysis) {
        studentsWithReports += courseData.reportAnalysis.studentsWithReports?.size || 0;
        studentsWithoutReports += courseData.reportAnalysis.studentsWithoutReports?.length || 0;
        Object.values(courseData.reportAnalysis.subjectBreakdown || {}).forEach(count => {
          totalReports += count;
        });
      }
    }
  });

  console.log(`\n📊 SUMMARY DASHBOARD:`);
  console.log(`   Total Students Across All 5to Courses: ${totalStudents}`);
  console.log(`   Total Progress Reports Submitted: ${totalReports}`);
  console.log(`   Students with At Least One Report: ${studentsWithReports}`);
  console.log(`   Students with No Reports: ${studentsWithoutReports}`);
  console.log(`   Overall Engagement Rate: ${totalStudents > 0 ? ((studentsWithReports / totalStudents) * 100).toFixed(1) : 0}%`);
  console.log(`   Critical Issues Identified: ${analysisResults.criticalIssues.length}`);

  // Course-specific summary
  console.log(`\n📋 COURSE-SPECIFIC SUMMARY:`);
  COURSES.forEach(division => {
    const course = `5to${division}`;
    const courseData = analysisResults.courses[course];
    if (courseData && courseData.reportAnalysis) {
      const engagement = courseData.totalStudents > 0 ? 
        ((courseData.reportAnalysis.studentsWithReports.size / courseData.totalStudents) * 100).toFixed(1) : 0;
      
      console.log(`   5to ${division}: ${courseData.totalStudents} students, ${engagement}% engagement`);
    }
  });

  // Critical Issues Summary
  if (analysisResults.criticalIssues.length > 0) {
    console.log(`\n⚠️  CRITICAL ISSUES (${analysisResults.criticalIssues.length}):`);
    analysisResults.criticalIssues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
  }

  // Action Plan
  const actionPlan = [];
  
  // Critical fixes
  if (analysisResults.criticalIssues.length > 0) {
    actionPlan.push({
      priority: 'CRITICAL',
      action: 'Resolve data integrity issues',
      details: `Fix ${analysisResults.criticalIssues.length} critical issues including duplicates, formatting problems, and subject inconsistencies`
    });
  }

  // Engagement issues
  if (studentsWithoutReports > 0) {
    actionPlan.push({
      priority: 'HIGH',
      action: 'Student engagement intervention',
      details: `${studentsWithoutReports} students have submitted no reports. Requires immediate outreach and system verification`
    });
  }

  // Subject consistency
  if (analysisResults.subjectConsistency) {
    let hasInconsistencies = false;
    Object.values(analysisResults.subjectConsistency).forEach(course => {
      if (course.inconsistencies && course.inconsistencies.length > 0) {
        hasInconsistencies = true;
      }
    });
    
    if (hasInconsistencies) {
      actionPlan.push({
        priority: 'MEDIUM',
        action: 'Subject registration audit',
        details: 'Multiple courses show inconsistencies between registered subjects and report submissions'
      });
    }
  }

  // Standard cleanup
  actionPlan.push({
    priority: 'LOW',
    action: 'Data formatting standardization',
    details: 'Clean up name formatting, email validation, and studentId consistency across all 5to courses'
  });

  console.log(`\n🎯 PRIORITIZED ACTION PLAN:`);
  actionPlan.forEach((item, index) => {
    console.log(`   ${index + 1}. [${item.priority}] ${item.action}`);
    console.log(`      ${item.details}`);
  });

  analysisResults.summary = {
    totalStudents,
    totalReports,
    studentsWithReports,
    studentsWithoutReports,
    engagementRate: totalStudents > 0 ? ((studentsWithReports / totalStudents) * 100) : 0,
    criticalIssuesCount: analysisResults.criticalIssues.length
  };

  analysisResults.actionPlan = actionPlan;
}

/**
 * 7. EXPORT RESULTS
 */
function exportResults() {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `5to-año-comprehensive-analysis-${timestamp}.json`;
  
  fs.writeFileSync(filename, JSON.stringify(analysisResults, null, 2));
  console.log(`\n📄 Analysis results exported to: ${filename}`);
  
  // Also create a summary report
  const summaryFilename = `5to-año-summary-report-${timestamp}.md`;
  let summaryReport = `# 5to Año Comprehensive Analysis Report\n\n`;
  summaryReport += `**Analysis Date:** ${analysisResults.timestamp}\n`;
  summaryReport += `**Database:** Local SQLite (prisma/data/intellego.db)\n`;
  summaryReport += `**Courses Analyzed:** 5to A, 5to B, 5to D\n\n`;
  
  summaryReport += `## Summary Dashboard\n\n`;
  summaryReport += `- **Total Students:** ${analysisResults.summary.totalStudents}\n`;
  summaryReport += `- **Total Reports:** ${analysisResults.summary.totalReports}\n`;
  summaryReport += `- **Students with Reports:** ${analysisResults.summary.studentsWithReports}\n`;
  summaryReport += `- **Students without Reports:** ${analysisResults.summary.studentsWithoutReports}\n`;
  summaryReport += `- **Engagement Rate:** ${analysisResults.summary.engagementRate.toFixed(1)}%\n`;
  summaryReport += `- **Critical Issues:** ${analysisResults.summary.criticalIssuesCount}\n\n`;
  
  if (analysisResults.criticalIssues.length > 0) {
    summaryReport += `## Critical Issues\n\n`;
    analysisResults.criticalIssues.forEach((issue, index) => {
      summaryReport += `${index + 1}. ${issue}\n`;
    });
    summaryReport += `\n`;
  }
  
  summaryReport += `## Action Plan\n\n`;
  analysisResults.actionPlan.forEach((item, index) => {
    summaryReport += `### ${index + 1}. [${item.priority}] ${item.action}\n`;
    summaryReport += `${item.details}\n\n`;
  });
  
  fs.writeFileSync(summaryFilename, summaryReport);
  console.log(`📄 Summary report exported to: ${summaryFilename}`);
}

/**
 * MAIN EXECUTION FLOW
 */
async function runComprehensiveAnalysis() {
  try {
    console.log('🚀 Starting comprehensive 5to año analysis...\n');
    
    await analyzeStudentRegistrations();
    await analyzeStudentDetails();
    await analyzeProgressReports();
    await analyzeSubjectConsistency();
    await compareWith4toCourses();
    generateSummaryAndActionPlan();
    exportResults();
    
    console.log('\n✅ COMPREHENSIVE ANALYSIS COMPLETE');
    console.log('=====================================');
    console.log('All analysis phases completed successfully.');
    console.log('Results exported to JSON and Markdown files.');
    console.log('Ready for targeted intervention planning.');
    
  } catch (error) {
    console.error('\n❌ ANALYSIS ERROR:', error);
    analysisResults.error = error.message;
  } finally {
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err.message);
      } else {
        console.log('📚 Database connection closed.');
      }
    });
  }
}

// Execute the analysis
runComprehensiveAnalysis();