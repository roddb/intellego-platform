/**
 * ProgressTracker - Tracks batch processing progress in memory
 *
 * Allows frontend to poll for progress updates during exam correction
 */

export interface BatchProgress {
  batchId: string;
  totalFiles: number;
  processedFiles: number;
  currentFile: string | null;
  currentPhase: string | null;
  status: "processing" | "completed" | "failed";
  results: Array<{
    fileName: string;
    status: "success" | "error";
    studentName?: string;
    score?: number;
    error?: string;
  }>;
  startTime: number;
  endTime: number | null;
  error?: string;
}

// In-memory storage for batch progress
// In production, this could be moved to Redis or similar
const progressMap = new Map<string, BatchProgress>();

// Auto-cleanup: Remove progress entries older than 1 hour
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
const MAX_PROGRESS_AGE = 60 * 60 * 1000; // 1 hour

setInterval(() => {
  const now = Date.now();
  const entries = Array.from(progressMap.entries());
  for (const [batchId, progress] of entries) {
    const age = now - progress.startTime;
    if (age > MAX_PROGRESS_AGE) {
      progressMap.delete(batchId);
      console.log(`🧹 Cleaned up old progress entry: ${batchId}`);
    }
  }
}, CLEANUP_INTERVAL);

/**
 * Initialize a new batch progress tracker
 */
export function initBatchProgress(batchId: string, totalFiles: number): void {
  progressMap.set(batchId, {
    batchId,
    totalFiles,
    processedFiles: 0,
    currentFile: null,
    currentPhase: null,
    status: "processing",
    results: [],
    startTime: Date.now(),
    endTime: null,
  });

  console.log(`📊 Initialized progress tracking for batch: ${batchId}`);
}

/**
 * Update the current file being processed
 */
export function updateCurrentFile(
  batchId: string,
  fileName: string,
  phase: string
): void {
  const progress = progressMap.get(batchId);
  if (!progress) return;

  progress.currentFile = fileName;
  progress.currentPhase = phase;
  progressMap.set(batchId, progress);
}

/**
 * Mark a file as processed
 */
export function markFileProcessed(
  batchId: string,
  fileName: string,
  result: {
    status: "success" | "error";
    studentName?: string;
    score?: number;
    error?: string;
  }
): void {
  const progress = progressMap.get(batchId);
  if (!progress) return;

  progress.processedFiles++;
  progress.results.push({
    fileName,
    ...result,
  });

  // Update status if all files are processed
  if (progress.processedFiles >= progress.totalFiles) {
    progress.status = "completed";
    progress.endTime = Date.now();
    progress.currentFile = null;
    progress.currentPhase = null;
  }

  progressMap.set(batchId, progress);

  console.log(
    `✅ File processed: ${fileName} (${progress.processedFiles}/${progress.totalFiles})`
  );
}

/**
 * Mark the entire batch as failed
 */
export function markBatchFailed(batchId: string, error: string): void {
  const progress = progressMap.get(batchId);
  if (!progress) return;

  progress.status = "failed";
  progress.error = error;
  progress.endTime = Date.now();
  progressMap.set(batchId, progress);

  console.error(`❌ Batch failed: ${batchId} - ${error}`);
}

/**
 * Get current progress for a batch
 */
export function getBatchProgress(batchId: string): BatchProgress | null {
  return progressMap.get(batchId) || null;
}

/**
 * Get all active batch progresses (for debugging)
 */
export function getAllActiveProgresses(): BatchProgress[] {
  return Array.from(progressMap.values()).filter(
    (p) => p.status === "processing"
  );
}

/**
 * Clean up a batch progress entry manually
 */
export function cleanupBatchProgress(batchId: string): void {
  progressMap.delete(batchId);
  console.log(`🧹 Cleaned up progress entry: ${batchId}`);
}
