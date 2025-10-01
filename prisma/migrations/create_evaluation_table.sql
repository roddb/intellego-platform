-- Create Evaluation table for storing exam feedback and retroalimentaciones
-- Date: 2025-10-01
-- Purpose: Store detailed exam evaluations with markdown feedback

CREATE TABLE IF NOT EXISTS Evaluation (
  id TEXT PRIMARY KEY,
  studentId TEXT NOT NULL,
  subject TEXT NOT NULL,
  examDate TEXT NOT NULL,
  examTopic TEXT NOT NULL,
  score INTEGER NOT NULL,
  feedback TEXT NOT NULL,
  createdBy TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (studentId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (createdBy) REFERENCES User(id)
);

-- Create index for faster student queries
CREATE INDEX IF NOT EXISTS idx_evaluation_student ON Evaluation(studentId);

-- Create index for subject filtering
CREATE INDEX IF NOT EXISTS idx_evaluation_subject ON Evaluation(subject);

-- Create index for date sorting
CREATE INDEX IF NOT EXISTS idx_evaluation_date ON Evaluation(examDate DESC);
