-- Fix feedback student IDs
-- Change userId to proper studentId format

UPDATE Feedback 
SET studentId = 'EST-2025-002'
WHERE studentId = 'u_5inzfd9ncmdyhzank';

-- Verify the update
SELECT 
  id,
  studentId,
  progressReportId,
  weekStart,
  subject
FROM Feedback 
WHERE studentId = 'EST-2025-002'
ORDER BY weekStart;