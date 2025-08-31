const { createClient } = require('@libsql/client');

// Configuration with safety checks
const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
  console.error('❌ ERROR: Missing Turso credentials');
  console.error('Please set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables');
  process.exit(1);
}

// Create Turso client
const client = createClient({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN,
});

// Test connection function
async function testConnection() {
  try {
    const result = await client.execute('SELECT 1');
    console.log('✅ Connected to Turso database successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to Turso:', error.message);
    return false;
  }
}

// Export client and helper functions
module.exports = {
  client,
  testConnection,
  TURSO_DATABASE_URL: TURSO_DATABASE_URL ? TURSO_DATABASE_URL.split('@')[1]?.split('.')[0] : 'unknown'
};