# 🗄️ Turso Database Migration Scripts

## Overview
These scripts handle the migration of the Intellego Platform production database hosted on Turso. They perform two critical operations:

1. **Create Feedback Table** - Adds the new feedback system table
2. **Normalize Timestamps** - Fixes timezone issues (T00:00:00.000Z → T03:00:00.000Z)

## Prerequisites

### Environment Variables
You need to set the following environment variables before running any scripts:

```bash
export TURSO_DATABASE_URL="libsql://your-database-name.turso.io"
export TURSO_AUTH_TOKEN="your-auth-token"
```

⚠️ **IMPORTANT**: Never commit these credentials to the repository!

### Dependencies
Install required packages:
```bash
npm install @libsql/client
```

## Scripts

### 1. 🚀 Main Migration Tool
```bash
node run-migration.js
```
Interactive tool that guides you through the migration process.

### 2. 📦 Backup Production
```bash
node backup-production.js
```
Downloads complete database backup to `backups/` directory.

### 3. 📊 Create Feedback Table
```bash
# Dry run (no changes)
node migrate-feedback.js --dry-run

# Execute migration
node migrate-feedback.js
```
Creates the Feedback table with proper indexes.

### 4. 🔧 Normalize Timestamps
```bash
# Dry run (shows what would change)
node normalize-production-timestamps.js

# Execute normalization
node normalize-production-timestamps.js --execute
```
Fixes all timestamps from T00:00:00.000Z to T03:00:00.000Z.

### 5. 🔍 Validate Migration
```bash
node validate-migration.js
```
Comprehensive validation of the migration results.

## Migration Process

### Option A: Step-by-Step (Recommended)
1. **Backup first**
   ```bash
   node backup-production.js
   ```

2. **Create Feedback table**
   ```bash
   node migrate-feedback.js --dry-run  # Check first
   node migrate-feedback.js             # Then execute
   ```

3. **Normalize timestamps**
   ```bash
   node normalize-production-timestamps.js           # Check first
   node normalize-production-timestamps.js --execute # Then execute
   ```

4. **Validate**
   ```bash
   node validate-migration.js
   ```

### Option B: Full Auto Migration
```bash
node run-migration.js
# Select option 5 for full migration
```

## Safety Features

- **Dry Run Mode**: All modification scripts have dry-run mode by default
- **Automatic Backups**: Creates timestamped backups before changes
- **Batch Processing**: Updates in batches of 50 for safety
- **Validation**: Comprehensive checks after migration
- **Detailed Logging**: All operations create JSON reports

## Expected Results

### Before Migration
- ❌ No Feedback table
- ❌ Timestamps with T00:00:00.000Z (bug)
- ❌ Students can't submit on Sundays

### After Migration
- ✅ Feedback table created with indexes
- ✅ All timestamps normalized to T03:00:00.000Z
- ✅ Students can submit any day until 23:59:59 Argentina time

## Reports

All scripts generate JSON reports in `migration-scripts/`:
- `backup-*.json` - Database backups
- `normalize-dryrun-*.json` - Dry run results
- `normalize-executed-*.json` - Execution results
- `validation-*.json` - Validation reports

## Rollback

If something goes wrong:

1. **For Feedback table**:
   ```sql
   DROP TABLE IF EXISTS Feedback;
   ```

2. **For Timestamps**: 
   - Restore from backup JSON
   - Contact support with the backup file

## Troubleshooting

### "Missing Turso credentials"
Set environment variables:
```bash
export TURSO_DATABASE_URL="..."
export TURSO_AUTH_TOKEN="..."
```

### "Connection failed"
- Check credentials are correct
- Verify network connection
- Check Turso service status

### "Table already exists"
The Feedback table was already created. This is safe to ignore.

### "Normalization failed"
Check the error report and ensure you have a backup before retrying.

## Support

For issues, check:
- Error reports in `migration-scripts/`
- Vercel deployment logs
- Turso dashboard at https://turso.tech

---

⚠️ **CRITICAL**: Always backup before making changes to production!