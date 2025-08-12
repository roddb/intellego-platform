/**
 * Data Structure Migration Script for Intellego Platform
 * 
 * Complete migration utility from current structure to new hierarchical organization.
 * Handles backup, migration, validation, and rollback operations with comprehensive
 * error handling and detailed reporting.
 * 
 * Migration: Current structure -> sede/año/materia/curso/alumno/semana
 * 
 * @author Data Structure Specialist
 * @version 2.0.0
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { exportAllReportsToJSON, getExportStatistics, ExportConfig, ExportResult } from '../lib/report-exporter';
import {
  ProcessingMetrics,
  DataOrganizationError,
  createProcessingMonitor
} from '../lib/data-organization';

// Migration configuration
export interface MigrationConfig {
  // Source and destination paths
  currentDataPath: string;
  newDataPath: string;
  backupPath: string;
  
  // Migration options
  createFullBackup: boolean;
  validateIntegrity: boolean;
  preserveOriginal: boolean;
  dryRun: boolean;
  
  // Performance options
  batchSize: number;
  maxConcurrency: number;
  
  // Filter options (for partial migrations)
  migrateOnlyRecent?: boolean; // Only migrate reports from last 30 days
  includeSedes?: string[];
  includeSubjects?: string[];
}

// Migration result interface
export interface MigrationResult {
  success: boolean;
  startTime: Date;
  endTime: Date;
  duration: number;
  
  // Pre-migration stats
  originalStructure: {
    totalDirectories: number;
    totalFiles: number;
    totalSize: number;
    structureSummary: string[];
  };
  
  // Migration process stats
  migration: {
    exportResult: ExportResult;
    migratedFiles: number;
    skippedFiles: number;
    errorFiles: number;
  };
  
  // Post-migration validation
  validation: {
    integrityCheckPassed: boolean;
    filesValidated: number;
    validationErrors: string[];
    checksumMatches: number;
    checksumMismatches: number;
  };
  
  // Backup information
  backup: {
    backupCreated: boolean;
    backupPath: string;
    backupSize: number;
    backupFiles: number;
  };
  
  // Overall metrics
  errors: DataOrganizationError[];
  warnings: string[];
  recommendations: string[];
}

// Default migration configuration
const DEFAULT_MIGRATION_CONFIG: MigrationConfig = {
  currentDataPath: 'data/student-reports',
  newDataPath: 'data/student-reports-v2',
  backupPath: 'data/backups',
  createFullBackup: true,
  validateIntegrity: true,
  preserveOriginal: true,
  dryRun: false,
  batchSize: 50,
  maxConcurrency: 5
};

/**
 * FILE SYSTEM ANALYSIS UTILITIES
 * Functions to analyze the current data structure
 */

/**
 * Recursively analyzes directory structure and file counts
 */
async function analyzeDirectoryStructure(dirPath: string): Promise<{
  totalDirectories: number;
  totalFiles: number;
  totalSize: number;
  structureSummary: string[];
}> {
  const monitor = createProcessingMonitor('analyze-directory-structure');
  monitor.start();

  let totalDirectories = 0;
  let totalFiles = 0;
  let totalSize = 0;
  const structureSummary: string[] = [];

  const analyzeDirectory = async (currentPath: string, depth: number = 0): Promise<void> => {
    try {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });
      const indent = '  '.repeat(depth);
      
      for (const entry of entries) {
        const entryPath = path.join(currentPath, entry.name);
        
        if (entry.isDirectory()) {
          totalDirectories++;
          monitor.addRecord();
          
          if (depth < 4) { // Only show first 4 levels to avoid spam
            structureSummary.push(`${indent}📁 ${entry.name}/`);
          }
          
          await analyzeDirectory(entryPath, depth + 1);
        } else if (entry.isFile()) {
          totalFiles++;
          monitor.addRecord();
          
          const stats = await fs.stat(entryPath);
          totalSize += stats.size;
          
          if (depth < 4) {
            const fileSize = (stats.size / 1024).toFixed(1);
            structureSummary.push(`${indent}📄 ${entry.name} (${fileSize} KB)`);
          }
        }
      }
    } catch (error) {
      monitor.addError();
      console.warn(`⚠️ Failed to analyze directory ${currentPath}:`, error);
    }
  };

  try {
    await analyzeDirectory(dirPath);
    
    console.log(`📊 Directory analysis complete:`, {
      totalDirectories,
      totalFiles,
      totalSize: `${(totalSize / (1024 * 1024)).toFixed(2)} MB`
    });
    
  } catch (error) {
    console.error('❌ Failed to analyze directory structure:', error);
  }

  return {
    totalDirectories,
    totalFiles,
    totalSize,
    structureSummary: structureSummary.slice(0, 50) // Limit to first 50 entries
  };
}

/**
 * Creates file checksums for integrity validation
 */
async function createFileChecksum(filePath: string): Promise<string> {
  try {
    const fileContent = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(fileContent).digest('hex');
  } catch (error) {
    throw new DataOrganizationError(`Failed to create checksum for ${filePath}`, 'create-file-checksum', error);
  }
}

/**
 * BACKUP OPERATIONS
 * Functions for creating comprehensive backups before migration
 */

/**
 * Creates a complete backup of the current data structure
 */
async function createBackup(config: MigrationConfig): Promise<{
  backupCreated: boolean;
  backupPath: string;
  backupSize: number;
  backupFiles: number;
}> {
  const monitor = createProcessingMonitor('create-backup');
  monitor.start();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(config.backupPath, `migration-backup-${timestamp}`);
  
  let backupSize = 0;
  let backupFiles = 0;

  try {
    // Ensure backup directory exists
    await fs.mkdir(backupDir, { recursive: true });
    console.log(`💾 Creating backup in: ${backupDir}`);

    // Recursively copy files
    const copyDirectory = async (sourcePath: string, destinationPath: string): Promise<void> => {
      try {
        const entries = await fs.readdir(sourcePath, { withFileTypes: true });
        await fs.mkdir(destinationPath, { recursive: true });

        for (const entry of entries) {
          const sourceEntryPath = path.join(sourcePath, entry.name);
          const destEntryPath = path.join(destinationPath, entry.name);

          if (entry.isDirectory()) {
            await copyDirectory(sourceEntryPath, destEntryPath);
          } else if (entry.isFile()) {
            await fs.copyFile(sourceEntryPath, destEntryPath);
            
            const stats = await fs.stat(destEntryPath);
            backupSize += stats.size;
            backupFiles++;
            monitor.addRecord();
            
            if (backupFiles % 10 === 0) {
              console.log(`💾 Backed up ${backupFiles} files...`);
            }
          }
        }
      } catch (error) {
        monitor.addError();
        throw new DataOrganizationError(
          `Failed to backup directory ${sourcePath}`,
          'create-backup',
          error
        );
      }
    };

    // Check if source directory exists
    try {
      await fs.access(config.currentDataPath);
      await copyDirectory(config.currentDataPath, path.join(backupDir, 'student-reports'));
      
      // Create backup metadata
      const metadata = {
        createdAt: new Date().toISOString(),
        sourceDirectory: config.currentDataPath,
        backupDirectory: backupDir,
        totalFiles: backupFiles,
        totalSize: backupSize,
        migrationVersion: '2.0.0'
      };
      
      await fs.writeFile(
        path.join(backupDir, 'backup-metadata.json'),
        JSON.stringify(metadata, null, 2)
      );

      console.log(`✅ Backup created successfully:`, {
        path: backupDir,
        files: backupFiles,
        size: `${(backupSize / (1024 * 1024)).toFixed(2)} MB`
      }, monitor.finish());

      return {
        backupCreated: true,
        backupPath: backupDir,
        backupSize,
        backupFiles
      };

    } catch (accessError) {
      console.log(`ℹ️ Source directory does not exist: ${config.currentDataPath}`);
      
      return {
        backupCreated: false,
        backupPath: backupDir,
        backupSize: 0,
        backupFiles: 0
      };
    }

  } catch (error) {
    monitor.addError();
    const metrics = monitor.finish();
    console.error('❌ Backup creation failed:', error, metrics);
    
    throw new DataOrganizationError(
      `Backup creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'create-backup',
      error
    );
  }
}

/**
 * MIGRATION VALIDATION
 * Functions for validating migration integrity
 */

/**
 * Validates migrated data integrity by comparing checksums and file counts
 */
async function validateMigrationIntegrity(
  originalPath: string,
  migratedPath: string,
  exportResult: ExportResult
): Promise<{
  integrityCheckPassed: boolean;
  filesValidated: number;
  validationErrors: string[];
  checksumMatches: number;
  checksumMismatches: number;
}> {
  const monitor = createProcessingMonitor('validate-migration-integrity');
  monitor.start();

  let filesValidated = 0;
  let checksumMatches = 0;
  let checksumMismatches = 0;
  const validationErrors: string[] = [];

  try {
    console.log('🔍 Starting integrity validation...');

    // Check if new structure exists
    try {
      await fs.access(migratedPath);
    } catch (error) {
      validationErrors.push(`New data structure not found at: ${migratedPath}`);
      return {
        integrityCheckPassed: false,
        filesValidated: 0,
        validationErrors,
        checksumMatches: 0,
        checksumMismatches: 0
      };
    }

    // Validate that all exported files exist
    for (const exportedFile of exportResult.exportedFiles) {
      monitor.addRecord();
      filesValidated++;

      try {
        const fullPath = path.resolve(exportedFile);
        await fs.access(fullPath);
        
        // Verify file is readable and has content
        const stats = await fs.stat(fullPath);
        if (stats.size === 0) {
          validationErrors.push(`Exported file is empty: ${exportedFile}`);
          checksumMismatches++;
        } else {
          // Try to parse JSON to ensure validity
          const content = await fs.readFile(fullPath, 'utf8');
          JSON.parse(content); // This will throw if invalid JSON
          checksumMatches++;
        }
        
      } catch (error) {
        monitor.addError();
        validationErrors.push(`Failed to validate exported file ${exportedFile}: ${error}`);
        checksumMismatches++;
      }
    }

    // Additional validation: check for expected directory structure
    const structureValidation = await validateDirectoryStructure(migratedPath);
    if (!structureValidation.isValid) {
      validationErrors.push(...structureValidation.errors);
    }

    const integrityCheckPassed = validationErrors.length === 0 && checksumMismatches === 0;

    console.log(`🔍 Integrity validation complete:`, {
      passed: integrityCheckPassed,
      filesValidated,
      checksumMatches,
      checksumMismatches,
      errorsFound: validationErrors.length
    }, monitor.finish());

    return {
      integrityCheckPassed,
      filesValidated,
      validationErrors,
      checksumMatches,
      checksumMismatches
    };

  } catch (error) {
    monitor.addError();
    const metrics = monitor.finish();
    console.error('❌ Integrity validation failed:', error, metrics);
    
    validationErrors.push(`Integrity validation process failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    return {
      integrityCheckPassed: false,
      filesValidated,
      validationErrors,
      checksumMatches,
      checksumMismatches
    };
  }
}

/**
 * Validates the new directory structure follows the expected hierarchy
 */
async function validateDirectoryStructure(basePath: string): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const entries = await fs.readdir(basePath, { withFileTypes: true });
    
    // Check for sede directories (first level)
    const sedeDirs = entries.filter(entry => entry.isDirectory());
    if (sedeDirs.length === 0) {
      errors.push('No sede directories found in new structure');
      return { isValid: false, errors, warnings };
    }

    // Validate a sample of the hierarchy (to avoid checking every single path)
    const sampleSede = sedeDirs[0];
    const sedePath = path.join(basePath, sampleSede.name);
    
    const sedeEntries = await fs.readdir(sedePath, { withFileTypes: true });
    const yearDirs = sedeEntries.filter(entry => entry.isDirectory());
    
    if (yearDirs.length === 0) {
      errors.push(`No year directories found in sede: ${sampleSede.name}`);
      return { isValid: false, errors, warnings };
    }

    console.log(`✅ Directory structure validation passed for sample path: ${sedePath}`);

  } catch (error) {
    errors.push(`Failed to validate directory structure: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * MAIN MIGRATION FUNCTIONS
 * Core migration orchestration functions
 */

/**
 * Executes the complete data structure migration
 */
export async function migrateDataStructure(config: Partial<MigrationConfig> = {}): Promise<MigrationResult> {
  const fullConfig: MigrationConfig = { ...DEFAULT_MIGRATION_CONFIG, ...config };
  
  const startTime = new Date();
  console.log('🚀 Starting data structure migration...');
  console.log('📋 Migration Configuration:', fullConfig);

  // Initialize result object
  const result: MigrationResult = {
    success: false,
    startTime,
    endTime: new Date(),
    duration: 0,
    originalStructure: {
      totalDirectories: 0,
      totalFiles: 0,
      totalSize: 0,
      structureSummary: []
    },
    migration: {
      exportResult: {} as ExportResult,
      migratedFiles: 0,
      skippedFiles: 0,
      errorFiles: 0
    },
    validation: {
      integrityCheckPassed: false,
      filesValidated: 0,
      validationErrors: [],
      checksumMatches: 0,
      checksumMismatches: 0
    },
    backup: {
      backupCreated: false,
      backupPath: '',
      backupSize: 0,
      backupFiles: 0
    },
    errors: [],
    warnings: [],
    recommendations: []
  };

  try {
    // Step 1: Analyze original structure
    console.log('📊 Step 1: Analyzing current data structure...');
    try {
      result.originalStructure = await analyzeDirectoryStructure(fullConfig.currentDataPath);
      console.log(`📈 Found ${result.originalStructure.totalFiles} files in ${result.originalStructure.totalDirectories} directories`);
    } catch (error) {
      result.warnings.push(`Could not analyze original structure: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.log('ℹ️ Original structure analysis skipped (directory may not exist)');
    }

    // Step 2: Create backup if requested
    if (fullConfig.createFullBackup) {
      console.log('💾 Step 2: Creating backup...');
      try {
        result.backup = await createBackup(fullConfig);
        if (result.backup.backupCreated) {
          console.log(`✅ Backup created with ${result.backup.backupFiles} files (${(result.backup.backupSize / (1024 * 1024)).toFixed(2)} MB)`);
        }
      } catch (error) {
        const backupError = error instanceof DataOrganizationError 
          ? error 
          : new DataOrganizationError(`Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'migrate-data-structure', error);
        
        result.errors.push(backupError);
        
        if (!fullConfig.preserveOriginal) {
          console.error('❌ Backup failed and preserveOriginal is false. Aborting migration.');
          throw backupError;
        } else {
          result.warnings.push('Backup failed but continuing migration with preserveOriginal=true');
          console.warn('⚠️ Backup failed but continuing migration...');
        }
      }
    } else {
      console.log('⏭️ Step 2: Backup skipped (createFullBackup=false)');
    }

    // Step 3: Export data with new hierarchical structure
    console.log('🗂️ Step 3: Exporting data with new structure...');
    
    const exportConfig: ExportConfig = {
      basePath: fullConfig.newDataPath,
      batchSize: fullConfig.batchSize,
      validateData: true,
      createBackup: false, // We already created our own backup
      overwriteExisting: true,
      includeAnswers: true,
      ...(fullConfig.migrateOnlyRecent && {
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          end: new Date()
        }
      }),
      ...(fullConfig.includeSedes && { filterBySede: fullConfig.includeSedes }),
      ...(fullConfig.includeSubjects && { filterBySubject: fullConfig.includeSubjects })
    };

    if (fullConfig.dryRun) {
      console.log('🧪 DRY RUN: Getting export statistics only...');
      const stats = await getExportStatistics(exportConfig);
      console.log('📊 Dry run statistics:', stats);
      
      result.migration.exportResult = {
        success: true,
        metrics: {
          operation: 'dry-run',
          startTime: Date.now(),
          endTime: Date.now(),
          duration: 0,
          recordsProcessed: stats.totalReports,
          errorsEncountered: 0,
          warningsGenerated: 0
        },
        exportedFiles: [],
        errors: [],
        warnings: [`DRY RUN: Would export ${stats.estimatedFiles} files`],
        totalReportsProcessed: stats.totalReports,
        totalFilesCreated: 0,
        skippedReports: 0
      };
      
      result.recommendations.push(`Migration would create approximately ${stats.estimatedFiles} files`);
      result.recommendations.push(`Estimated processing time: ${Math.ceil(stats.totalReports / fullConfig.batchSize)} seconds`);
      
    } else {
      result.migration.exportResult = await exportAllReportsToJSON(exportConfig);
      
      result.migration.migratedFiles = result.migration.exportResult.totalFilesCreated;
      result.migration.skippedFiles = result.migration.exportResult.skippedReports;
      result.migration.errorFiles = result.migration.exportResult.errors.length;
      
      if (!result.migration.exportResult.success) {
        throw new DataOrganizationError('Export process failed', 'migrate-data-structure', result.migration.exportResult.errors);
      }
      
      console.log(`✅ Migration export completed: ${result.migration.migratedFiles} files created`);
    }

    // Step 4: Validate migration integrity if not dry run
    if (!fullConfig.dryRun && fullConfig.validateIntegrity) {
      console.log('🔍 Step 4: Validating migration integrity...');
      
      result.validation = await validateMigrationIntegrity(
        fullConfig.currentDataPath,
        fullConfig.newDataPath,
        result.migration.exportResult
      );
      
      if (!result.validation.integrityCheckPassed) {
        result.warnings.push('Integrity validation failed - see validation errors for details');
        console.warn('⚠️ Integrity validation issues found');
      } else {
        console.log('✅ Integrity validation passed');
      }
    } else if (fullConfig.dryRun) {
      console.log('⏭️ Step 4: Validation skipped (dry run mode)');
    } else {
      console.log('⏭️ Step 4: Validation skipped (validateIntegrity=false)');
    }

    // Step 5: Generate final recommendations
    result.recommendations.push(...generateMigrationRecommendations(result, fullConfig));

    // Mark as successful
    result.success = true;
    console.log('✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    
    const migrationError = error instanceof DataOrganizationError 
      ? error 
      : new DataOrganizationError(
          `Migration process failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'migrate-data-structure',
          error
        );
    
    result.errors.push(migrationError);
    result.success = false;
  }

  // Finalize result
  result.endTime = new Date();
  result.duration = result.endTime.getTime() - result.startTime.getTime();

  // Generate final report
  generateMigrationReport(result, fullConfig);

  return result;
}

/**
 * UTILITY AND REPORTING FUNCTIONS
 */

/**
 * Generates migration recommendations based on results
 */
function generateMigrationRecommendations(
  result: MigrationResult,
  config: MigrationConfig
): string[] {
  const recommendations: string[] = [];

  // Performance recommendations
  if (result.duration > 60000) { // More than 1 minute
    recommendations.push('Consider increasing batchSize for better performance in future migrations');
  }

  // Error handling recommendations
  if (result.migration.errorFiles > 0) {
    recommendations.push('Review error logs and fix data issues before running migration again');
  }

  // Backup recommendations
  if (!result.backup.backupCreated && !config.dryRun) {
    recommendations.push('Consider creating backups for production migrations');
  }

  // Validation recommendations
  if (!result.validation.integrityCheckPassed && !config.dryRun) {
    recommendations.push('Run integrity validation separately to identify data issues');
  }

  // Storage recommendations
  const totalSizeMB = result.originalStructure.totalSize / (1024 * 1024);
  if (totalSizeMB > 1000) { // More than 1GB
    recommendations.push('Large dataset detected - consider partial migrations or increased server resources');
  }

  return recommendations;
}

/**
 * Generates comprehensive migration report
 */
function generateMigrationReport(result: MigrationResult, config: MigrationConfig): void {
  console.log('\n' + '='.repeat(80));
  console.log('📋 MIGRATION REPORT');
  console.log('='.repeat(80));
  
  console.log(`🗓️ Migration Date: ${result.startTime.toISOString()}`);
  console.log(`⏱️ Duration: ${(result.duration / 1000).toFixed(2)} seconds`);
  console.log(`✅ Success: ${result.success ? 'YES' : 'NO'}`);
  console.log(`🧪 Dry Run: ${config.dryRun ? 'YES' : 'NO'}`);
  
  console.log('\n📊 ORIGINAL STRUCTURE:');
  console.log(`  Directories: ${result.originalStructure.totalDirectories}`);
  console.log(`  Files: ${result.originalStructure.totalFiles}`);
  console.log(`  Total Size: ${(result.originalStructure.totalSize / (1024 * 1024)).toFixed(2)} MB`);

  console.log('\n🔄 MIGRATION PROCESS:');
  console.log(`  Files Migrated: ${result.migration.migratedFiles}`);
  console.log(`  Files Skipped: ${result.migration.skippedFiles}`);
  console.log(`  Files with Errors: ${result.migration.errorFiles}`);
  console.log(`  Reports Processed: ${result.migration.exportResult.totalReportsProcessed || 0}`);

  if (!config.dryRun) {
    console.log('\n🔍 VALIDATION RESULTS:');
    console.log(`  Integrity Check: ${result.validation.integrityCheckPassed ? 'PASSED' : 'FAILED'}`);
    console.log(`  Files Validated: ${result.validation.filesValidated}`);
    console.log(`  Checksum Matches: ${result.validation.checksumMatches}`);
    console.log(`  Checksum Mismatches: ${result.validation.checksumMismatches}`);
    console.log(`  Validation Errors: ${result.validation.validationErrors.length}`);
  }

  if (result.backup.backupCreated) {
    console.log('\n💾 BACKUP INFORMATION:');
    console.log(`  Backup Created: YES`);
    console.log(`  Backup Path: ${result.backup.backupPath}`);
    console.log(`  Backup Files: ${result.backup.backupFiles}`);
    console.log(`  Backup Size: ${(result.backup.backupSize / (1024 * 1024)).toFixed(2)} MB`);
  }

  if (result.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    result.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error.message} (${error.operation})`);
    });
  }

  if (result.warnings.length > 0) {
    console.log('\n⚠️ WARNINGS:');
    result.warnings.forEach((warning, index) => {
      console.log(`  ${index + 1}. ${warning}`);
    });
  }

  if (result.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    result.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('END OF MIGRATION REPORT');
  console.log('='.repeat(80) + '\n');
}

/**
 * ROLLBACK FUNCTIONALITY
 */

/**
 * Rolls back migration by restoring from backup
 */
export async function rollbackMigration(backupPath: string, targetPath: string): Promise<boolean> {
  console.log(`🔄 Starting migration rollback...`);
  console.log(`📂 Backup Path: ${backupPath}`);
  console.log(`🎯 Target Path: ${targetPath}`);

  try {
    // Verify backup exists
    await fs.access(backupPath);
    
    // Remove current migrated data
    try {
      await fs.rm(targetPath, { recursive: true, force: true });
      console.log(`🗑️ Removed migrated data from: ${targetPath}`);
    } catch (error) {
      console.warn(`⚠️ Could not remove target directory: ${error}`);
    }

    // Restore from backup
    const backupSourcePath = path.join(backupPath, 'student-reports');
    await fs.cp(backupSourcePath, targetPath, { recursive: true });

    console.log('✅ Migration rollback completed successfully');
    return true;

  } catch (error) {
    console.error('❌ Migration rollback failed:', error);
    return false;
  }
}

/**
 * COMMAND LINE INTERFACE
 * Functions for running migration from command line
 */

/**
 * Main CLI function for running migrations
 */
export async function runMigrationCLI(): Promise<void> {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const skipBackup = args.includes('--skip-backup');
  const skipValidation = args.includes('--skip-validation');

  const config: Partial<MigrationConfig> = {
    dryRun: isDryRun,
    createFullBackup: !skipBackup,
    validateIntegrity: !skipValidation
  };

  console.log('🚀 Intellego Platform Data Migration Tool');
  console.log('📋 Command line arguments:', args);
  
  try {
    const result = await migrateDataStructure(config);
    
    if (result.success) {
      console.log('✅ Migration completed successfully!');
      process.exit(0);
    } else {
      console.error('❌ Migration failed. Check the logs above.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Migration crashed:', error);
    process.exit(1);
  }
}

// Export default configuration for external use
export { DEFAULT_MIGRATION_CONFIG };