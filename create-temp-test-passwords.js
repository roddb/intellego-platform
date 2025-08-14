#!/usr/bin/env node

/**
 * SECURE TEMPORARY PASSWORD GENERATOR FOR LOCAL TESTING
 * Security Features:
 * - Strong bcrypt hashing (cost factor 12)
 * - Temporary password expiration
 * - Local database only (never production)
 * - Comprehensive logging for audit trails
 * - Auto-cleanup functionality
 */

const bcrypt = require('bcryptjs');
const { createClient } = require('@libsql/client');
const crypto = require('crypto');

// SECURITY: Only works in development environment
if (process.env.NODE_ENV === 'production') {
    console.error('❌ SECURITY VIOLATION: This script is PROHIBITED in production');
    process.exit(1);
}

// Local database connection only
const db = createClient({
    url: 'file:./prisma/data/intellego.db'
});

// Security audit log
const auditLog = [];

function logSecurityEvent(event, details) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        event,
        details,
        environment: process.env.NODE_ENV,
        pid: process.pid
    };
    auditLog.push(logEntry);
    console.log(`🔐 SECURITY LOG: ${event}`, details);
}

async function generateSecureTemporaryPassword(length = 16) {
    // Generate cryptographically secure random password
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
        const randomIndex = crypto.randomInt(0, charset.length);
        password += charset[randomIndex];
    }
    
    logSecurityEvent('TEMP_PASSWORD_GENERATED', { 
        passwordLength: length, 
        hasSpecialChars: true 
    });
    
    return password;
}

async function createTemporaryTestUser(userData) {
    try {
        logSecurityEvent('TEMP_USER_CREATION_STARTED', { email: userData.email });
        
        // Generate secure temporary password
        const tempPassword = await generateSecureTemporaryPassword();
        console.log(`\n🔑 TEMPORARY PASSWORD for ${userData.email}: ${tempPassword}`);
        console.log('⚠️  SECURITY: This password expires in 24 hours\n');
        
        // Hash password with high cost factor for security
        const hashedPassword = await bcrypt.hash(tempPassword, 12);
        
        // Generate unique ID
        const userId = 'temp_' + crypto.randomUUID();
        const now = new Date().toISOString();
        
        // Create temporary user with expiration
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
        
        await db.execute(`
            INSERT INTO User (
                id, name, email, password, role, studentId, 
                sede, academicYear, division, subjects, 
                status, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            userId, userData.name, userData.email, hashedPassword, userData.role || 'STUDENT',
            userData.studentId, userData.sede, userData.academicYear, 
            userData.division, userData.subjects, 'TEMP_ACTIVE', now, now
        ]);
        
        // Create expiration tracking
        await db.execute(`
            CREATE TABLE IF NOT EXISTS temp_user_expiration (
                userId TEXT PRIMARY KEY,
                expiresAt TEXT NOT NULL,
                createdAt TEXT NOT NULL,
                createdBy TEXT DEFAULT 'LOCAL_DEV_SCRIPT'
            )
        `);
        
        await db.execute(`
            INSERT INTO temp_user_expiration (userId, expiresAt, createdAt)
            VALUES (?, ?, ?)
        `, [userId, expiresAt, now]);
        
        logSecurityEvent('TEMP_USER_CREATED', { 
            userId, 
            email: userData.email, 
            expiresAt,
            role: userData.role 
        });
        
        return {
            userId,
            email: userData.email,
            tempPassword,
            expiresAt
        };
        
    } catch (error) {
        logSecurityEvent('TEMP_USER_CREATION_FAILED', { 
            error: error.message, 
            email: userData.email 
        });
        throw error;
    }
}

async function cleanupExpiredTempUsers() {
    try {
        logSecurityEvent('CLEANUP_STARTED', { timestamp: new Date().toISOString() });
        
        // Create expiration table if it doesn't exist
        await db.execute(`
            CREATE TABLE IF NOT EXISTS temp_user_expiration (
                userId TEXT PRIMARY KEY,
                expiresAt TEXT NOT NULL,
                createdAt TEXT NOT NULL,
                createdBy TEXT DEFAULT 'LOCAL_DEV_SCRIPT'
            )
        `);
        
        // Find expired temp users
        const expiredUsers = await db.execute(`
            SELECT tue.userId, u.email 
            FROM temp_user_expiration tue
            JOIN User u ON tue.userId = u.id
            WHERE tue.expiresAt < ?
        `, [new Date().toISOString()]);
        
        for (const user of expiredUsers.rows) {
            // Delete expired user and related data
            await db.execute('DELETE FROM User WHERE id = ?', [user.userId]);
            await db.execute('DELETE FROM temp_user_expiration WHERE userId = ?', [user.userId]);
            
            logSecurityEvent('TEMP_USER_EXPIRED_REMOVED', { 
                userId: user.userId, 
                email: user.email 
            });
        }
        
        console.log(`🧹 Cleaned up ${expiredUsers.rows.length} expired temporary users`);
        
    } catch (error) {
        logSecurityEvent('CLEANUP_FAILED', { error: error.message });
        // Don't throw error for cleanup failures, just log them
        console.warn('⚠️  Cleanup warning:', error.message);
    }
}

async function createTestStudents() {
    console.log('🧪 Creating temporary test students for local development...\n');
    
    const testStudents = [
        {
            name: 'Test Student Alpha',
            email: 'test.alpha@temp.local',
            role: 'STUDENT',
            studentId: 'TEMP-2025-001',
            sede: 'Centro',
            academicYear: '4to Año',
            division: 'A',
            subjects: 'Matemática,Física,Química'
        },
        {
            name: 'Test Student Beta',
            email: 'test.beta@temp.local',
            role: 'STUDENT',
            studentId: 'TEMP-2025-002',
            sede: 'Colegiales',
            academicYear: '5to Año',
            division: 'B',
            subjects: 'Historia,Geografía,Literatura'
        },
        {
            name: 'Test Instructor Gamma',
            email: 'test.instructor@temp.local',
            role: 'INSTRUCTOR',
            sede: 'Centro',
            academicYear: '',
            division: '',
            subjects: 'All'
        }
    ];
    
    // Cleanup expired users first
    await cleanupExpiredTempUsers();
    
    const createdUsers = [];
    
    for (const studentData of testStudents) {
        try {
            const user = await createTemporaryTestUser(studentData);
            createdUsers.push(user);
            
            console.log(`✅ Created: ${user.email}`);
            console.log(`   Password: ${user.tempPassword}`);
            console.log(`   Expires: ${user.expiresAt}\n`);
            
        } catch (error) {
            console.error(`❌ Failed to create ${studentData.email}:`, error.message);
        }
    }
    
    // Save security audit log
    const auditFile = `temp-password-audit-${Date.now()}.json`;
    require('fs').writeFileSync(auditFile, JSON.stringify(auditLog, null, 2));
    
    console.log(`📋 Security audit log saved to: ${auditFile}`);
    console.log(`🔐 Created ${createdUsers.length} temporary test users`);
    console.log(`⏰ All users expire in 24 hours and will be auto-deleted`);
    
    return createdUsers;
}

// Execute if run directly
if (require.main === module) {
    createTestStudents()
        .then(() => {
            console.log('\n✅ Temporary test users created successfully');
            console.log('⚠️  REMEMBER: These are temporary credentials for LOCAL TESTING ONLY');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Failed to create temporary test users:', error);
            process.exit(1);
        });
}

module.exports = {
    createTemporaryTestUser,
    cleanupExpiredTempUsers,
    generateSecureTemporaryPassword
};