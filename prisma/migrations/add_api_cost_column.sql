-- Add apiCost column to Feedback table for tracking Claude API costs
-- This column stores the actual cost charged by Anthropic for each feedback generation
-- REAL type allows decimal precision (e.g., 0.008, 0.016)
ALTER TABLE Feedback ADD COLUMN apiCost REAL;

-- Add index for cost queries (useful for aggregating costs by date/period)
CREATE INDEX IF NOT EXISTS idx_feedback_created_cost ON Feedback(createdAt, apiCost);
