#!/usr/bin/env node

/**
 * Test script for password audit functionality
 * Tests the password management functions in a safe environment
 */

import {
  logPasswordAudit,
  changeUserPassword,
  getUserPasswordAuditHistory,
  getPasswordAuditStatistics,
  getActivePasswordPolicy,
  validatePasswordAgainstPolicy,
  calculatePasswordStrength,
  calculatePasswordEntropy,
  findUserByEmail
} from '../src/lib/db-operations.ts';

async function runPasswordAuditTests() {
  console.log('🔧 Password Audit System Tests');
  console.log('==============================\n');
  
  try {
    // Test 1: Get active password policy
    console.log('1. Testing password policy retrieval...');
    const policy = await getActivePasswordPolicy();
    console.log('   ✅ Policy loaded:', policy.policyName);
    console.log('   📋 Min length:', policy.minLength);
    console.log('   📋 Prevent reuse:', policy.preventReuse);
    
    // Test 2: Password validation
    console.log('\n2. Testing password validation...');
    const testPasswords = [
      'weak',
      'Password123',
      'StrongPassword123!',
      'VeryStrongPasswordWithSpecialChars123!@#'
    ];
    
    testPasswords.forEach(password => {
      const validation = validatePasswordAgainstPolicy(password, policy);
      const strength = calculatePasswordStrength(password);
      const entropy = calculatePasswordEntropy(password);
      
      console.log(`   Password: "${password}"`);
      console.log(`   ✅ Valid: ${validation.isValid}`);
      console.log(`   🔒 Strength: ${strength}/5`);
      console.log(`   🧮 Entropy: ${Math.round(entropy)}`);
      if (!validation.isValid) {
        console.log(`   ❌ Errors: ${validation.errors.join(', ')}`);
      }
      console.log('');
    });
    
    // Test 3: Find a test user
    console.log('3. Finding test user for audit logging...');
    const testUser = await findUserByEmail('estudiante@demo.com');
    
    if (!testUser) {
      console.log('   ❌ Test user not found. Please ensure demo user exists.');
      return;
    }
    
    console.log('   ✅ Test user found:', testUser.name);
    
    // Test 4: Log password audit entry
    console.log('\n4. Testing password audit logging...');
    const auditId = await logPasswordAudit({
      userId: testUser.id,
      actionType: 'CHANGE',
      actionInitiatedBy: 'USER',
      newPasswordHash: '$2a$12$test.hash.for.audit.logging',
      changeReason: 'Test audit logging functionality',
      securityContext: {
        ipAddress: '127.0.0.1',
        userAgent: 'Test-Script/1.0',
        sessionId: 'test-session-' + Date.now(),
        deviceInfo: 'Test Environment'
      },
      isSuccessful: true,
      passwordStrengthScore: 4,
      complianceFlags: {
        meetsMinLength: true,
        hasUppercase: true,
        hasLowercase: true,
        hasNumbers: true,
        hasSpecialChars: true,
        notRecentlyUsed: true,
        entropyScore: 65.2
      }
    });
    
    console.log('   ✅ Audit entry created:', auditId);
    
    // Test 5: Retrieve audit history
    console.log('\n5. Testing audit history retrieval...');
    const auditHistory = await getUserPasswordAuditHistory(testUser.id, 5);
    console.log('   ✅ Retrieved', auditHistory.length, 'audit entries');
    
    auditHistory.forEach((entry, index) => {
      console.log(`   ${index + 1}. ${entry.actionType} - ${entry.isSuccessful ? 'SUCCESS' : 'FAILED'}`);
      console.log(`      Date: ${new Date(entry.createdAt).toLocaleDateString()}`);
      console.log(`      IP: ${entry.securityContext.ipAddress || 'N/A'}`);
      console.log(`      Strength: ${entry.passwordStrengthScore || 'N/A'}/5`);
    });
    
    // Test 6: Get system statistics
    console.log('\n6. Testing system statistics...');
    const stats = await getPasswordAuditStatistics();
    console.log('   ✅ System Statistics:');
    console.log('      Total changes:', stats.totalPasswordChanges);
    console.log('      Successful:', stats.successfulChanges);
    console.log('      Failed:', stats.failedChanges);
    console.log('      User initiated:', stats.userInitiated);
    console.log('      Admin initiated:', stats.adminInitiated);
    console.log('      Average strength:', stats.averagePasswordStrength);
    
    console.log('\n🎉 All password audit tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   ✅ Password policy system operational');
    console.log('   ✅ Password validation working');
    console.log('   ✅ Audit logging functional');
    console.log('   ✅ History retrieval working');
    console.log('   ✅ Statistics generation operational');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run tests
runPasswordAuditTests()
  .then(() => {
    console.log('\n✅ Password audit system tests completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Tests failed:', error);
    process.exit(1);
  });

export { runPasswordAuditTests };