/**
 * ROLLBACK SCRIPT FOR WEEK ASSIGNMENT CORRECTION
 * Generated: 2025-08-13T23:18:16.552Z
 * 
 * This script will restore the original week assignments if needed.
 * CAUTION: Only use if the correction was incorrect.
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'prisma', 'data', 'intellego.db');
const backupFile = 'week-correction-backup-2025-08-13T23-18-16-531Z.json';

function rollbackWeekCorrection() {
    console.log('🔄 Starting rollback process...');
    
    if (!fs.existsSync(backupFile)) {
        throw new Error(`Backup file not found: ${backupFile}`);
    }
    
    const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    const db = new Database(dbPath);
    
    try {
        const transaction = db.transaction(() => {
            let restoredCount = 0;
            
            backup.reports.forEach(report => {
                const result = db.prepare(`
                    UPDATE ProgressReport 
                    SET weekStart = ?, weekEnd = ?
                    WHERE id = ?
                `).run(report.weekStart, report.weekEnd, report.id);
                
                if (result.changes === 1) {
                    restoredCount++;
                }
            });
            
            console.log(`✅ Restored ${restoredCount} reports to original week assignments`);
            return restoredCount;
        });
        
        const restored = transaction();
        console.log(`🔄 Rollback completed: ${restored} reports restored`);
        
    } catch (error) {
        console.error('❌ Rollback failed:', error);
        throw error;
    } finally {
        db.close();
    }
}

// Uncomment to execute rollback
// rollbackWeekCorrection();

module.exports = { rollbackWeekCorrection };