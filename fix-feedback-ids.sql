-- SQL Script to fix feedback records studentId field
-- Problem: Feedback records are using user IDs instead of student IDs
-- Solution: Update all feedback records to use the correct student IDs

-- First, let's see what needs to be fixed
SELECT 
  f.id as feedback_id,
  f.studentId as current_student_id,
  u.studentId as correct_student_id,
  u.name as user_name,
  u.email as user_email
FROM Feedback f
JOIN User u ON f.studentId = u.id
WHERE f.studentId NOT LIKE 'EST-%'
ORDER BY u.name;

-- Update RDB test user feedback records
UPDATE Feedback 
SET studentId = 'EST-2025-002' 
WHERE studentId = 'u_5inzfd9ncmdyhzank';

-- Update Emma Bono feedback records
UPDATE Feedback 
SET studentId = 'EST-2025-008' 
WHERE studentId = 'u_13sv4a69ome06gv2t';

-- Verify the changes
SELECT 
  id, 
  studentId, 
  subject, 
  weekStart,
  score
FROM Feedback 
WHERE studentId LIKE 'EST-%'
ORDER BY studentId, weekStart;

-- Check that we can now query skills progress correctly
SELECT 
  subject,
  AVG(JSON_EXTRACT(skillsMetrics, '$.comprehension')) as comprehension,
  AVG(JSON_EXTRACT(skillsMetrics, '$.criticalThinking')) as criticalThinking,
  AVG(JSON_EXTRACT(skillsMetrics, '$.selfRegulation')) as selfRegulation,
  AVG(JSON_EXTRACT(skillsMetrics, '$.practicalApplication')) as practicalApplication,
  AVG(JSON_EXTRACT(skillsMetrics, '$.metacognition')) as metacognition,
  COUNT(*) as totalFeedbacks
FROM Feedback
WHERE studentId = 'EST-2025-002' 
  AND skillsMetrics IS NOT NULL
GROUP BY subject 
ORDER BY subject;