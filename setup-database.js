import Database from './database.js';

async function setupDatabase() {
  try {
    console.log('🔧 Setting up PostgreSQL database for FocusMode...');
    
    const db = new Database();
    await db.connect();
    
    // Create tables dengan syntax PostgreSQL yang benar
    const createTables = `
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        avatar VARCHAR(10) DEFAULT 'U',
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      );

      -- User settings
      CREATE TABLE IF NOT EXISTS user_settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        push_enabled BOOLEAN DEFAULT FALSE,
        daily_reminders BOOLEAN DEFAULT TRUE,
        session_reminders BOOLEAN DEFAULT TRUE,
        achievement_alerts BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Study sessions
      CREATE TABLE IF NOT EXISTS study_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        subject VARCHAR(100),
        duration INTEGER DEFAULT 25,
        status VARCHAR(20) DEFAULT 'planned',
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Notes
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(50) DEFAULT 'study',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Books
      CREATE TABLE IF NOT EXISTS books (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        author VARCHAR(100),
        description TEXT,
        category VARCHAR(50) DEFAULT 'academic',
        is_complete BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Focus timers
      CREATE TABLE IF NOT EXISTS focus_timers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        timer_type VARCHAR(50),
        duration INTEGER,
        completed BOOLEAN DEFAULT FALSE,
        task_description TEXT,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Study stats
      CREATE TABLE IF NOT EXISTS study_stats (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        total_sessions INTEGER DEFAULT 0,
        total_minutes INTEGER DEFAULT 0,
        completed_sessions INTEGER DEFAULT 0,
        streak_days INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, date)
      );

      -- Push subscriptions
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        endpoint TEXT NOT NULL,
        keys JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    // Execute table creation
    const statements = createTables.split(';').filter(stmt => stmt.trim());
    
    console.log('📊 Creating tables...');
    for (const stmt of statements) {
      if (stmt.trim()) {
        try {
          await db.query(stmt + ';');
          const tableName = stmt.match(/CREATE TABLE IF NOT EXISTS (\w+)/i);
          console.log(`  ✓ ${tableName ? tableName[1] : 'Table'}`);
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`  ✓ ${error.message.match(/table "(\w+)"/i)?.[1] || 'Table'} (already exists)`);
          } else {
            console.warn(`  ⚠️ Error: ${error.message}`);
          }
        }
      }
    }
    
    // Create indexes for better performance
    console.log('\n🔧 Creating indexes...');
    const indexes = [
      { sql: 'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)', name: 'idx_users_email' },
      { sql: 'CREATE INDEX IF NOT EXISTS idx_sessions_user ON study_sessions(user_id)', name: 'idx_sessions_user' },
      { sql: 'CREATE INDEX IF NOT EXISTS idx_sessions_status ON study_sessions(status)', name: 'idx_sessions_status' },
      { sql: 'CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id)', name: 'idx_notes_user' },
      { sql: 'CREATE INDEX IF NOT EXISTS idx_books_user ON books(user_id)', name: 'idx_books_user' },
      { sql: 'CREATE INDEX IF NOT EXISTS idx_stats_user_date ON study_stats(user_id, date)', name: 'idx_stats_user_date' },
      { sql: 'CREATE INDEX IF NOT EXISTS idx_stats_date ON study_stats(date)', name: 'idx_stats_date' }
    ];
    
    for (const { sql, name } of indexes) {
      try {
        await db.query(sql);
        console.log(`  ✓ ${name}`);
      } catch (error) {
        console.warn(`  ⚠️ ${name}: ${error.message}`);
      }
    }
    
    // Create trigger for updated_at timestamp
    console.log('\n🔄 Creating update triggers...');
    const tablesWithUpdatedAt = ['users', 'user_settings', 'study_sessions', 'notes', 'books', 'study_stats'];
    
    for (const table of tablesWithUpdatedAt) {
      try {
        const triggerSql = `
          CREATE OR REPLACE FUNCTION update_updated_at_column()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
          END;
          $$ language 'plpgsql';
          
          DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table};
          CREATE TRIGGER update_${table}_updated_at
          BEFORE UPDATE ON ${table}
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
        `;
        
        await db.query(triggerSql);
        console.log(`  ✓ ${table} updated_at trigger`);
      } catch (error) {
        console.warn(`  ⚠️ ${table} trigger: ${error.message}`);
      }
    }
    
    await db.disconnect();
    
    console.log('\n✅ Database setup completed successfully!');
    console.log('🎉 You can now start the API with: npm run api');
    console.log('\n📋 Summary:');
    console.log('  • 7 tables created/verified');
    console.log('  • 7 indexes created');
    console.log('  • 6 update triggers configured');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database setup failed!');
    console.error('Error:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Check your Neon connection string');
    console.log('2. Ensure database exists in Neon dashboard');
    console.log('3. Verify network connectivity');
    console.log('4. Check if tables already exist');
    
    process.exit(1);
  }
}

setupDatabase();
