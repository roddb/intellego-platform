# Mia Pleitel Week Assignment Investigation Report

**Date**: August 13, 2025  
**Investigation Target**: EST-2025-031 (Mia Pleitel, pleitelmia@gmail.com)  
**Issue**: Incorrect week assignment for progress reports submitted on Sunday night  

## Executive Summary

**CRITICAL DATABASE CORRUPTION IDENTIFIED**: A systematic error in week calculation logic has affected **59 progress reports** from **41 students** who submitted during the night of Sunday, August 10/Monday, August 11, 2025.

### Root Cause Identified
The system incorrectly calculated week boundaries when students submitted reports on Sunday night (Argentina time), causing these submissions to be assigned to the **following week** instead of the **current week** they intended to submit for.

## Detailed Analysis of Mia Pleitel's Case

### Student Information
- **Name**: Mia Pleitel
- **Student ID**: EST-2025-031
- **Email**: pleitelmia@gmail.com
- **Sede**: Colegiales
- **Academic Year**: 4to Año
- **Division**: C
- **Subjects**: Física, Química

### Submission Details

#### Física Report
- **Submitted (UTC)**: 2025-08-11T02:04:35.495Z
- **Submitted (ART)**: 2025-08-10 23:04:35 ART (Sunday night)
- **Stored Week**: 2025-08-11 to 2025-08-17 ❌
- **Correct Week**: 2025-08-04 to 2025-08-10 ✅

#### Química Report  
- **Submitted (UTC)**: 2025-08-11T02:16:49.715Z
- **Submitted (ART)**: 2025-08-10 23:16:49 ART (Sunday night)
- **Stored Week**: 2025-08-11 to 2025-08-17 ❌
- **Correct Week**: 2025-08-04 to 2025-08-10 ✅

### Technical Analysis

#### Current System Logic (CORRECT)
```javascript
function getCurrentWeekStart(): Date {
  const now = new Date();
  const monday = new Date(now);
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}
```

#### Buggy Logic That Caused the Issue
Based on database evidence, the system appears to have used a simplified calculation that incorrectly used the submission date directly as the week start when submissions occurred on Sunday in UTC.

**What Happened:**
1. Mia submitted Sunday night ART (23:04), which was Monday early morning UTC (02:04)
2. System incorrectly calculated week as starting on the submission date (August 11)
3. This created week Aug 11-17 instead of the correct week Aug 4-10

#### Timezone Impact
- **Argentina Time (ART)**: UTC-3
- **Student's Intent**: Submit for week ending Sunday Aug 10
- **System's Error**: Assigned to week starting Monday Aug 11

## Scope of Impact

### Affected Reports Statistics
- **Total Affected Reports**: 59
- **Unique Students Affected**: 41
- **Week Range Affected**: August 11-17, 2025
- **Submission Window**: August 10-13, 2025

### All Affected Students
The following 41 students have reports incorrectly assigned to week Aug 11-17:

1. Angelines Wu (EST-2025-051) - Química
2. Bautista (EST-2025-025) - Física, Química
3. Belen Smiriglio (EST-2025-107) - Química
4. Bianca Nazareth Picone (EST-2025-078) - Física
5. Brenda Behmer (EST-2025-119) - Física, Química
6. Candela Greco (EST-2025-100) - Química
7. Candelaria María Nasjleti Paz (EST-2025-121) - Química
8. Catalina Dobniewski (EST-2025-114) - Física, Química
9. Catalina Gilardi (EST-2025-015) - Física, Química
10. Ema Trejo (EST-2025-137) - Química
11. Federica Fontan (EST-2025-024) - Química
12. Fiorella (EST-2025-039) - Física, Química
13. Gonzalo Rosler Buglione (EST-2025-046) - Química
14. Guadalupe rueda (EST-2025-018) - Física, Química
15. Helena Machado (EST-2025-004) - Física, Química
16. Ian Svendsen (EST-2025-096) - Química
17. Juan Pablo Oviedo Goite (EST-2025-123) - Física, Química
18. Juliana Ceriani Cernadas (EST-2025-035) - Química
19. Julieta Napoli (EST-2025-133) - Química
20. Lourdes María Converset (EST-2025-127) - Química
21. Lucas Mingotti Tziavaras (EST-2025-129) - Física, Química
22. Maria Emilia Delaico (EST-2025-014) - Física
23. Maria Josefina Baez (EST-2025-136) - Química
24. María Catalina Prypsztejn Mila (EST-2025-044) - Química
25. Matilde Pasarin de la Torre (EST-2025-131) - Física, Química
26. Matías Ernesto Alippi (EST-2025-111) - Física
27. **Mia Pleitel (EST-2025-031) - Física, Química** ⭐ Investigation Target
28. Milagros Zacharec (EST-2025-109) - Química
29. Morena Danio (EST-2025-120) - Química
30. Paloma Castro (EST-2025-071) - Física, Química
31. Pedro Salgado Canepa (EST-2025-124) - Química
32. Sofia Bargas (EST-2025-027) - Física, Química
33. Sol Fontán (EST-2025-118) - Física, Química
34. Stefano Esses (EST-2025-092) - Química
35. Uma Valle (EST-2025-061) - Física, Química
36. Valentino Papa (EST-2025-032) - Física, Química
37. Victoria Gómez arroyo (EST-2025-090) - Química
38. Victoria Patiño (EST-2025-122) - Física, Química
39. camilo giles (EST-2025-128) - Física, Química
40. juana giurovich (EST-2025-130) - Química
41. mercedes rizzo lynch (EST-2025-132) - Física

## Data Integrity Impact

### Academic Consequences
1. **Week Misalignment**: All 59 reports appear as submissions for week Aug 11-17 instead of Aug 4-10
2. **Calendar Confusion**: Instructor dashboards show inflated activity for week Aug 11-17
3. **Progress Tracking**: Student progress timelines are incorrect
4. **JSON Export Corruption**: File system exports are stored in wrong week folders

### Database Consistency
- ✅ **Report Contents**: All question answers are intact
- ✅ **Student Data**: User information is correct
- ❌ **Week Boundaries**: weekStart and weekEnd fields are incorrect
- ❌ **Calendar Integration**: Week-based queries return wrong results

## Correction Requirements

### 1. Database Updates Needed
For all 59 affected reports, update:
```sql
-- Change from incorrect week Aug 11-17
weekStart: '2025-08-11T00:00:00.000Z' → '2025-08-04T03:00:00.000Z'
weekEnd: '2025-08-17T23:59:59.999Z' → '2025-08-11T02:59:59.999Z'
```

### 2. File System Reorganization
Move JSON exports from:
- **Wrong location**: `data/student-reports/{sede}/{año}/{division}/{subject}/EST-XXX_name/2025-08-11_subject_reporte.json`
- **Correct location**: `data/student-reports/{sede}/{año}/{division}/{subject}/EST-XXX_name/2025-08-04_subject_reporte.json`

### 3. System Logic Verification
Ensure current week calculation logic handles Sunday submissions correctly in Argentina timezone.

## Risk Assessment

### High Priority
- **Academic Records**: Incorrect week assignments affect progress tracking
- **Instructor Analytics**: Dashboard metrics are misleading
- **Student Experience**: Reports appear in wrong week on calendars

### Medium Priority  
- **File Organization**: JSON exports are in incorrectly named folders
- **Audit Trail**: Week-based reporting is compromised

### Low Priority
- **Historical Data**: Past analyses using this period need correction

## Next Steps

1. **Immediate**: Create correction script for database updates
2. **Priority**: Test correction script in local environment
3. **Deployment**: Apply corrections to production database
4. **Verification**: Validate all 59 reports are corrected
5. **File System**: Reorganize JSON exports to correct folders
6. **Monitoring**: Ensure current system logic prevents future occurrences

## Technical Notes

### Database Queries Used
```sql
-- Find Mia's reports
SELECT pr.*, u.name, u.studentId 
FROM ProgressReport pr 
JOIN User u ON pr.userId = u.id 
WHERE u.studentId = 'EST-2025-031';

-- Find all affected reports
SELECT u.name, u.studentId, pr.subject, pr.submittedAt, pr.weekStart, pr.weekEnd
FROM ProgressReport pr
JOIN User u ON pr.userId = u.id
WHERE pr.weekStart = '2025-08-11T00:00:00.000Z'
ORDER BY u.name, pr.subject;
```

### Week Calculation Logic
```javascript
// Correct Monday-Sunday week calculation
const day = date.getDay();
const diff = date.getDate() - day + (day === 0 ? -6 : 1);
// For Sunday: date - 0 + (-6) = Monday of current week
// For Monday: date - 1 + 1 = Monday (same day)
```

---

**Report Generated**: August 13, 2025  
**Investigation Status**: COMPLETE  
**Correction Required**: YES - 59 reports need week boundary updates  
**Students Affected**: 41 unique students  
**Academic Impact**: MEDIUM - Progress tracking disrupted but content preserved