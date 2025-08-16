# DEPLOYMENT ROLLBACK PROCEDURES
**ETAPA 7.3: CONFIGURACIÓN DE DEPLOYMENT SEGURO**
Generated: 2025-08-12

## EMERGENCY ROLLBACK COMMANDS

### IMMEDIATE ROLLBACK (Critical Issues)

```bash
# 1. REVERT TO LAST KNOWN GOOD STATE
git log --oneline -5  # Find last working commit
git revert HEAD --no-edit  # Revert latest commit
git push origin main  # Auto-trigger Vercel redeployment

# 2. FORCE ROLLBACK TO SPECIFIC COMMIT
BACKUP_COMMIT="1a0254e"  # Pre-deployment backup commit
git reset --hard $BACKUP_COMMIT
git push --force origin main

# 3. VERCEL INSTANT ROLLBACK
vercel --prod rollback  # Rollback to previous deployment
```

### DATABASE ROLLBACK (If Data Corruption)

```bash
# 1. BACKUP CURRENT DATABASE STATE
curl "https://intellego-platform.vercel.app/api/admin/backup-database" \
  -H "Authorization: Bearer [ADMIN_TOKEN]"

# 2. RESTORE FROM BACKUP
# Access Turso Dashboard: https://app.turso.tech/roddb/databases/intellego-production
# Use point-in-time recovery to restore to pre-deployment state

# 3. VERIFY DATA INTEGRITY
curl "https://intellego-platform.vercel.app/api/test-libsql"
```

### ENVIRONMENT VARIABLE ROLLBACK

```bash
# 1. REMOVE PROBLEMATIC VARIABLES
vercel env rm VARIABLE_NAME --yes

# 2. RESTORE PREVIOUS VALUES
vercel env add VARIABLE_NAME "previous_value" production

# 3. REDEPLOY
vercel --prod
```

## ROLLBACK DECISION MATRIX

| Issue Type | Rollback Method | Time Estimate |
|------------|-----------------|---------------|
| Build Failure | Git revert + push | 2 minutes |
| Runtime Error | Vercel rollback | 30 seconds |
| Database Issues | Database restore | 5-10 minutes |
| Environment Issues | Env var update | 1 minute |
| Critical Bug | Force reset + push | 3 minutes |

## ROLLBACK VERIFICATION CHECKLIST

### ✅ Post-Rollback Health Checks

```bash
# 1. Verify deployment is live
curl -I https://intellego-platform.vercel.app/

# 2. Test authentication
curl -X POST https://intellego-platform.vercel.app/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"estudiante@demo.com","password":"Estudiante123!!!"}'

# 3. Test database connectivity
curl https://intellego-platform.vercel.app/api/test-libsql

# 4. Test AI functionality
curl https://intellego-platform.vercel.app/api/feedback/generate \
  -H "Content-Type: application/json" \
  -d '{"test":"true"}'

# 5. Verify user data integrity
curl "https://intellego-platform.vercel.app/api/instructor/reports" \
  -H "Authorization: Bearer [TEST_TOKEN]"
```

### ✅ User Impact Assessment

1. **Check active user sessions** - Ensure no data loss
2. **Verify report submissions** - Confirm reports are accessible
3. **Test calendar functionality** - Check event persistence
4. **Validate AI features** - Ensure Sara is responsive

## COMMUNICATION PROTOCOL

### Internal Team Notification

```bash
# Send Slack notification (if configured)
curl -X POST $SLACK_WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "🚨 EMERGENCY ROLLBACK EXECUTED",
    "attachments": [{
      "color": "danger",
      "fields": [{
        "title": "Rollback Reason",
        "value": "[ISSUE_DESCRIPTION]",
        "short": false
      }, {
        "title": "Previous Commit",
        "value": "'$BACKUP_COMMIT'",
        "short": true
      }, {
        "title": "Status",
        "value": "System restored to stable state",
        "short": true
      }]
    }]
  }'
```

### User Communication Template

```
Subject: Intellego Platform - Service Restoration Complete

Dear Intellego Platform Users,

We've successfully restored the platform to full functionality after a brief technical issue. All your data remains safe and accessible.

What happened:
- Brief service interruption during routine update
- Platform automatically restored to previous stable version
- No user data was lost or affected

Current status:
✅ All core features operational
✅ User data integrity confirmed
✅ Performance metrics normal

If you experience any issues, please contact support.

Thank you for your patience.
- Intellego Platform Team
```

## AUTOMATED ROLLBACK TRIGGERS

### Environment Variables for Auto-Rollback

```bash
# Set in Vercel dashboard
ROLLBACK_ENABLED="true"
ROLLBACK_ERROR_THRESHOLD="5"  # 5 errors in 1 minute triggers rollback
ROLLBACK_RESPONSE_TIME_MAX="5000"  # 5 second response time threshold
ROLLBACK_SUCCESS_RATE_MIN="95"  # 95% success rate minimum
```

### Health Check Monitoring

```javascript
// Automatic rollback on health check failure
// Location: /api/health-check-monitor/route.ts
if (healthScore < 80) {
  await triggerAutomaticRollback({
    reason: 'Health check failure',
    score: healthScore,
    timestamp: new Date().toISOString()
  });
}
```

## ROLLBACK TESTING

### Pre-Deployment Rollback Test

```bash
# 1. Deploy to staging with intentional error
git checkout -b test-rollback
echo "export const ERROR = 'TEST ERROR';" >> src/lib/test-error.ts
git add . && git commit -m "Test rollback scenario"
git push origin test-rollback

# 2. Merge to main (this will fail)
git checkout main
git merge test-rollback
git push origin main

# 3. Execute rollback
git revert HEAD --no-edit
git push origin main

# 4. Verify rollback success
curl https://intellego-platform.vercel.app/api/test-libsql

# 5. Clean up
git branch -D test-rollback
git push origin --delete test-rollback
```

## ROLLBACK PREVENTION

### Pre-Deployment Checks

```bash
# 1. Run full test suite
npm run test
npm run type-check
npm run lint

# 2. Build verification
npm run build

# 3. Database migration test
node scripts/test-database-migration.js

# 4. Environment variable verification
node scripts/verify-env-vars.js
```

### Deployment Safeguards

1. **Gradual Rollout** - Deploy to 1% of traffic first
2. **Automated Testing** - Run integration tests post-deployment
3. **Real User Monitoring** - Monitor error rates and performance
4. **Circuit Breaker** - Auto-rollback on critical thresholds

## CONTACT INFORMATION

### Emergency Contacts

- **Primary Developer**: [DEVELOPER_EMAIL]
- **Database Admin**: [DBA_EMAIL]
- **DevOps Lead**: [DEVOPS_EMAIL]

### Support Channels

- **Slack**: #intellego-platform-alerts
- **Email**: support@intellego-platform.com
- **Phone**: [EMERGENCY_PHONE] (24/7)

---

**IMPORTANT**: This document should be reviewed and updated with each deployment. Keep rollback procedures tested and current.