// start-app.js - Script start aplikasi FocusMode
import Database from './database.js';

async function startApplication() {
  console.log('🚀 Starting FocusMode Application...');
  console.log('📍 Target: PostgreSQL Neon');
  console.log('🔗 Connection String:', 'postgresql://neondb_owner:****@ep-patient-mountain-a145nmbc-pooler.ap-southeast-1.aws.neon.tech/neondb');
  console.log('──────────────────────────────────────');
  
  try {
    // Test database connection
    console.log('🔧 Testing database connection...');
    const db = new Database();
    await db.connect();
    
    console.log('✅ Database connected successfully!');
    
    // Start API server
    console.log('📊 Starting API server...');
    console.log('🔄 Importing API server module...');
    
    const { default: apiServer } = await import('./api-server.js');
    
    console.log('🎯 API server imported successfully!');
    console.log('📡 Server should be running on port 3001');
    console.log('──────────────────────────────────────');
    console.log('✨ Application started successfully!');
    
  } catch (error) {
    console.error('\n❌ Failed to start application');
    console.error('Error:', error.message);
    
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Check internet connection');
    console.log('2. Verify connection string in database.js');
    console.log('3. Ensure database exists in Neon dashboard');
    console.log('4. Run: npm run setup-db (to create tables)');
    console.log('5. Restart server: npm run api');
    
    if (process.env.NODE_ENV === 'development') {
      console.log('\n🔍 Debug info:');
      console.error('Stack:', error.stack);
    }
    
    process.exit(1);
  }
}

// Error handler for unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('\n⚠️  Unhandled Promise Rejection:');
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
});

// Error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('\n⚠️  Uncaught Exception:');
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
});

startApplication();
