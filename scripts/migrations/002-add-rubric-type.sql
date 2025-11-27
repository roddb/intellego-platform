-- Migration: Add rubricType column to Rubric table
-- Date: 2025-01-20
-- Description: Adds rubricType column to support hybrid rubric system (5-phases vs custom)

-- Add rubricType column with default value '5-phases' for backward compatibility
ALTER TABLE Rubric ADD COLUMN rubricType TEXT NOT NULL DEFAULT '5-phases';

-- Update existing rubrics to '5-phases' (explicit, even though default handles it)
UPDATE Rubric SET rubricType = '5-phases' WHERE rubricType IS NULL OR rubricType = '';

-- Create index for faster filtering by rubricType
CREATE INDEX IF NOT EXISTS idx_rubric_type ON Rubric(rubricType);
