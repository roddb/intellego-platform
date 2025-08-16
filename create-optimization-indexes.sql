-- PERFORMANCE OPTIMIZATION INDEXES FOR INTELLEGO PLATFORM
-- Purpose: Optimize query performance for UTC timestamp queries
-- Target: getReportsByWeekRange and related functions
-- Date: August 16, 2025

-- ============================================================================
-- PRIMARY WEEK RANGE INDEX (HIGHEST PRIORITY)
-- ============================================================================
-- Optimizes the main date overlap query: WHERE pr.weekStart <= ? AND pr.weekEnd >= ?
-- Expected impact: 2-10x performance improvement for date range queries

CREATE INDEX IF NOT EXISTS idx_reports_week_range 
ON ProgressReport(weekStart, weekEnd);

-- ============================================================================
-- SUBJECT-FILTERED QUERIES INDEX
-- ============================================================================
-- Optimizes queries with subject filters applied
-- Use case: Subject-specific report downloads and filtered views

CREATE INDEX IF NOT EXISTS idx_reports_subject_week 
ON ProgressReport(subject, weekStart, weekEnd);

-- ============================================================================
-- USER-SPECIFIC QUERIES INDEX
-- ============================================================================
-- Optimizes queries for individual user reports
-- Use case: Student dashboard, individual progress tracking

CREATE INDEX IF NOT EXISTS idx_reports_user_week 
ON ProgressReport(userId, weekStart, weekEnd);

-- ============================================================================
-- COMPREHENSIVE FILTER INDEX
-- ============================================================================
-- Covers all common filter combinations in hierarchical instructor dashboard
-- Use case: Complex filtered queries with multiple parameters

CREATE INDEX IF NOT EXISTS idx_reports_full 
ON ProgressReport(weekStart, weekEnd, subject, userId);

-- ============================================================================
-- ANALYTICS AND SORTING INDEX
-- ============================================================================
-- Optimizes ORDER BY clauses and submission date queries
-- Use case: Recent reports, analytics, chronological sorting

CREATE INDEX IF NOT EXISTS idx_reports_submitted 
ON ProgressReport(submittedAt DESC);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these queries to verify indexes were created successfully

-- Check all indexes on ProgressReport table
-- SELECT name, sql FROM sqlite_master WHERE type = 'index' AND tbl_name = 'ProgressReport' AND sql IS NOT NULL;

-- Analyze query plan for main overlap query
-- EXPLAIN QUERY PLAN SELECT pr.id, pr.weekStart, pr.weekEnd FROM ProgressReport pr WHERE pr.weekStart <= '2025-08-10T23:59:59.999Z' AND pr.weekEnd >= '2025-08-04T00:00:00.000Z';

-- ============================================================================
-- PERFORMANCE MONITORING
-- ============================================================================
-- Use these queries to monitor index effectiveness

-- Check index usage statistics (if available)
-- PRAGMA index_info(idx_reports_week_range);

-- Count records for performance testing
-- SELECT COUNT(*) as total_reports FROM ProgressReport;

-- Test query performance with EXPLAIN
-- EXPLAIN QUERY PLAN SELECT COUNT(*) FROM ProgressReport pr JOIN User u ON pr.userId = u.id WHERE pr.weekStart <= ? AND pr.weekEnd >= ?;

-- ============================================================================
-- TURSO-SPECIFIC NOTES
-- ============================================================================
-- 1. These indexes are automatically replicated across Turso instances
-- 2. Index creation is a one-time operation, no ongoing maintenance needed
-- 3. Indexes consume minimal storage (~1-5MB for current data scale)
-- 4. libSQL handles index optimization automatically
-- 5. No impact on write performance at current scale (171 reports)

-- ============================================================================
-- ROLLBACK PLAN (if needed)
-- ============================================================================
-- If indexes cause issues, they can be dropped:
-- DROP INDEX IF EXISTS idx_reports_week_range;
-- DROP INDEX IF EXISTS idx_reports_subject_week;
-- DROP INDEX IF EXISTS idx_reports_user_week;
-- DROP INDEX IF EXISTS idx_reports_full;
-- DROP INDEX IF EXISTS idx_reports_submitted;

-- ============================================================================
-- EXECUTION INSTRUCTIONS
-- ============================================================================
-- To execute these indexes:
-- 1. Connect to Turso database via CLI or code
-- 2. Run this SQL script
-- 3. Verify creation with verification queries
-- 4. Monitor performance improvements
-- 5. No application code changes required