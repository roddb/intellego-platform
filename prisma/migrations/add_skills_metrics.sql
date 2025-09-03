-- Add skills metrics column to Feedback table
-- This column will store JSON data with the 5 skill metrics for radar chart

ALTER TABLE Feedback ADD COLUMN skillsMetrics TEXT;

-- The skillsMetrics column will store JSON in this format:
-- {
--   "comprehension": 85,        // Comprensión Conceptual (0-100)
--   "criticalThinking": 75,     // Pensamiento Crítico (0-100)
--   "selfRegulation": 90,       // Autorregulación (0-100)
--   "practicalApplication": 70, // Aplicación Práctica (0-100)
--   "metacognition": 80         // Reflexión Metacognitiva (0-100)
-- }

-- Create SkillsProgress table to track student progress over time
CREATE TABLE IF NOT EXISTS SkillsProgress (
  id TEXT PRIMARY KEY,
  studentId TEXT NOT NULL,
  subject TEXT NOT NULL,
  comprehension REAL DEFAULT 0,       -- Running average
  criticalThinking REAL DEFAULT 0,    -- Running average  
  selfRegulation REAL DEFAULT 0,      -- Running average
  practicalApplication REAL DEFAULT 0, -- Running average
  metacognition REAL DEFAULT 0,        -- Running average
  totalFeedbacks INTEGER DEFAULT 0,    -- Count of feedbacks included
  lastCalculated TEXT NOT NULL,        -- Last calculation timestamp
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (studentId) REFERENCES User(id) ON DELETE CASCADE
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_skills_progress_student ON SkillsProgress(studentId);
CREATE INDEX IF NOT EXISTS idx_skills_progress_student_subject ON SkillsProgress(studentId, subject);