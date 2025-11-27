-- Migration: Add Rubric System
-- Date: 2025-01-19
-- Description: Creates Rubric table and adds rubricId column to Evaluation table

-- Create Rubric table
CREATE TABLE IF NOT EXISTS Rubric (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  rubricText TEXT NOT NULL,
  subject TEXT,
  examType TEXT,
  isActive INTEGER NOT NULL DEFAULT 1,
  createdBy TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (createdBy) REFERENCES User(id)
);

-- Add rubricId column to Evaluation table
ALTER TABLE Evaluation ADD COLUMN rubricId TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_rubric_active ON Rubric(isActive);
CREATE INDEX IF NOT EXISTS idx_evaluation_rubricId ON Evaluation(rubricId);
