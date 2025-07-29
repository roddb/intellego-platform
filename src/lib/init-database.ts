import { initializeDefaultData } from './database'

async function initDatabase() {
  try {
    console.log('🔄 Initializing database...')
    await initializeDefaultData()
    console.log('✅ Database initialized successfully')
  } catch (error) {
    console.error('❌ Error initializing database:', error)
    throw error
  }
}

// Run initialization if this file is executed directly
if (require.main === module) {
  initDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

export { initDatabase }