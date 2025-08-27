-- Create Feedback table for storing instructor feedback on student reports
CREATE TABLE IF NOT EXISTS Feedback (
  id TEXT PRIMARY KEY,
  studentId TEXT NOT NULL,
  progressReportId TEXT,
  weekStart TEXT NOT NULL,
  subject TEXT NOT NULL,
  score INTEGER,
  generalComments TEXT,
  strengths TEXT, -- JSON array of strengths
  improvements TEXT, -- JSON array of improvements  
  aiAnalysis TEXT,
  createdBy TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (studentId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (progressReportId) REFERENCES ProgressReport(id) ON DELETE SET NULL,
  FOREIGN KEY (createdBy) REFERENCES User(id) ON DELETE CASCADE
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_feedback_student_week ON Feedback(studentId, weekStart, subject);
CREATE INDEX IF NOT EXISTS idx_feedback_student ON Feedback(studentId);
CREATE INDEX IF NOT EXISTS idx_feedback_week ON Feedback(weekStart);