import pkg from "pg"
const { Pool } = pkg
import dotenv from "dotenv"

// Load environment variables from .env file
dotenv.config()

class Database {
  constructor() {
    this.pool = null

    this.config = {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    }
  }

  async connect() {
    try {
      console.log("🔧 Mencoba koneksi ke PostgreSQL Neon...")

      this.pool = new Pool(this.config)

      // Test connection
      const client = await this.pool.connect()

      try {
        const result = await client.query("SELECT version() as version, NOW() as now")
        console.log("✅ BERHASIL terhubung ke PostgreSQL Neon!")
        console.log("🐘 PostgreSQL Version:", result.rows[0].version.split(",")[0])
        console.log("⏰ Server time:", result.rows[0].now)
        console.log("🚀 Server siap menerima koneksi API")

        return this.pool
      } finally {
        client.release()
      }
    } catch (error) {
      console.error("❌ Database connection failed:", error.message)
      console.log("\n🔧 SOLUSI:")
      console.log("1. Periksa koneksi internet Anda")
      console.log("2. Verifikasi connection details di dashboard.neon.tech")
      console.log('3. Pastikan database "neondb" sudah dibuat di Neon')
      console.log("4. Jalankan: npm run setup-db untuk membuat tabel")
      console.log("5. Periksa apakah IP Anda diizinkan oleh Neon")
      throw error
    }
  }

  async disconnect() {
    if (this.pool) {
      await this.pool.end()
      console.log("✅ Database connection closed")
    }
  }

  async query(sql, params = []) {
    try {
      if (!this.pool) {
        await this.connect()
      }

      const client = await this.pool.connect()
      try {
        const result = await client.query(sql, params)
        return result.rows
      } finally {
        client.release()
      }
    } catch (error) {
      console.error("❌ Database query error:", error.message)
      console.error("Query:", sql)
      throw error
    }
  }

  // User operations
  async createUser(userData) {
    const { name, email, password, avatar = "U" } = userData
    const sql = `
      INSERT INTO users (name, email, password, avatar) 
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `

    const result = await this.query(sql, [name, email, password, avatar])

    // Create default settings for user
    await this.query("INSERT INTO user_settings (user_id) VALUES ($1)", [result[0].id])

    return result[0].id
  }

  async getUserByEmail(email) {
    const sql = `
      SELECT u.*, us.push_enabled, us.daily_reminders, us.session_reminders, us.achievement_alerts
      FROM users u 
      LEFT JOIN user_settings us ON u.id = us.user_id 
      WHERE u.email = $1 AND u.status = 'active'
    `
    const users = await this.query(sql, [email])
    return users[0] || null
  }

  async getUserById(id) {
    const sql = `
      SELECT u.*, us.push_enabled, us.daily_reminders, us.session_reminders, us.achievement_alerts
      FROM users u 
      LEFT JOIN user_settings us ON u.id = us.user_id 
      WHERE u.id = $1 AND u.status = 'active'
    `
    const users = await this.query(sql, [id])
    return users[0] || null
  }

  // Study Sessions operations
  async getSessionsByUserId(userId) {
    const sql = `
      SELECT * FROM study_sessions 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `
    return await this.query(sql, [userId])
  }

  async createSession(sessionData) {
    const { user_id, title, description, subject, duration, status = "planned" } = sessionData
    const sql = `
      INSERT INTO study_sessions (user_id, title, description, subject, duration, status) 
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `
    const result = await this.query(sql, [user_id, title, description, subject, duration, status])
    return result[0].id
  }

  async updateSession(id, sessionData, userId = null) {
    const { title, description, subject, duration, status } = sessionData
    let sql = `
      UPDATE study_sessions 
      SET title = $1, description = $2, subject = $3, duration = $4, status = $5 
      WHERE id = $6
    `
    const params = [title, description, subject, duration, status, id]

    if (userId) {
      sql += " AND user_id = $7"
      params.push(userId)
    }

    await this.query(sql, params)
  }

  async deleteSession(id, userId = null) {
    let sql = "DELETE FROM study_sessions WHERE id = $1"
    const params = [id]

    if (userId) {
      sql += " AND user_id = $2"
      params.push(userId)
    }

    await this.query(sql, params)
  }

  async startSession(id, userId = null) {
    let sql = `
      UPDATE study_sessions 
      SET status = 'inprogress', started_at = NOW() 
      WHERE id = $1
    `
    const params = [id]

    if (userId) {
      sql += " AND user_id = $2"
      params.push(userId)
    }

    await this.query(sql, params)
  }

  async completeSession(id, userId = null) {
    let sql = `
      UPDATE study_sessions 
      SET status = 'completed', completed_at = NOW() 
      WHERE id = $1
    `
    const params = [id]

    if (userId) {
      sql += " AND user_id = $2"
      params.push(userId)
    }

    await this.query(sql, params)
  }

  // Notes operations
  async getNotesByUserId(userId, category = "all") {
    let sql = "SELECT * FROM notes WHERE user_id = $1"
    const params = [userId]

    if (category !== "all") {
      sql += " AND category = $2"
      params.push(category)
    }

    sql += " ORDER BY created_at DESC"
    return await this.query(sql, params)
  }

  async createNote(noteData) {
    const { user_id, title, content, category = "study" } = noteData
    const sql = `
      INSERT INTO notes (user_id, title, content, category) 
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `
    const result = await this.query(sql, [user_id, title, content, category])
    return result[0].id
  }

  async updateNote(id, noteData, userId = null) {
    const { title, content, category } = noteData
    let sql = `
      UPDATE notes 
      SET title = $1, content = $2, category = $3 
      WHERE id = $4
    `
    const params = [title, content, category, id]

    if (userId) {
      sql += " AND user_id = $5"
      params.push(userId)
    }

    await this.query(sql, params)
  }

  async deleteNote(id, userId = null) {
    let sql = "DELETE FROM notes WHERE id = $1"
    const params = [id]

    if (userId) {
      sql += " AND user_id = $2"
      params.push(userId)
    }

    await this.query(sql, params)
  }

  // Books operations
  async getBooksByUserId(userId) {
    const sql = `
      SELECT * FROM books 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `
    return await this.query(sql, [userId])
  }

  async createBook(bookData) {
    const { user_id, title, author, description, category = "academic", is_complete = false } = bookData
    const sql = `
      INSERT INTO books (user_id, title, author, description, category, is_complete) 
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `
    const result = await this.query(sql, [user_id, title, author, description, category, is_complete])
    return result[0].id
  }

  async updateBook(id, bookData, userId = null) {
    const { title, author, description, category, is_complete } = bookData
    let sql = `
      UPDATE books 
      SET title = $1, author = $2, description = $3, category = $4, is_complete = $5 
      WHERE id = $6
    `
    const params = [title, author, description, category, is_complete, id]

    if (userId) {
      sql += " AND user_id = $7"
      params.push(userId)
    }

    await this.query(sql, params)
  }

  async deleteBook(id, userId = null) {
    let sql = "DELETE FROM books WHERE id = $1"
    const params = [id]

    if (userId) {
      sql += " AND user_id = $2"
      params.push(userId)
    }

    await this.query(sql, params)
  }

  async toggleBookStatus(id, userId = null) {
    let sql = `
      UPDATE books 
      SET is_complete = NOT is_complete, updated_at = NOW() 
      WHERE id = $1
    `
    const params = [id]

    if (userId) {
      sql += " AND user_id = $2"
      params.push(userId)
    }

    await this.query(sql, params)
  }

  // Statistics operations
  async getTodayStats(userId) {
    const sql = `
      SELECT 
        COALESCE(SUM(duration), 0) as total_minutes,
        COUNT(*) as total_sessions
      FROM study_sessions 
      WHERE user_id = $1 
        AND DATE(created_at) = CURRENT_DATE 
        AND status = 'completed'
    `
    const results = await this.query(sql, [userId])
    return results[0] || { total_minutes: 0, total_sessions: 0 }
  }

  async getWeeklyReport(userId) {
    const sql = `
      SELECT 
        DATE(created_at) as study_date,
        COUNT(*) as sessions_count,
        COALESCE(SUM(duration), 0) as total_minutes
      FROM study_sessions 
      WHERE user_id = $1 
        AND created_at >= CURRENT_DATE - INTERVAL '7 days'
        AND status = 'completed'
      GROUP BY DATE(created_at)
      ORDER BY study_date DESC
    `
    return await this.query(sql, [userId])
  }

  async getDashboardData(userId) {
    const sql = `
      SELECT 
        u.name,
        u.email,
        u.avatar,
        us.push_enabled,
        us.daily_reminders,
        (
          SELECT COUNT(*) 
          FROM study_sessions 
          WHERE user_id = u.id AND status = 'completed'
        ) as completed_sessions,
        (
          SELECT COUNT(*) 
          FROM notes 
          WHERE user_id = u.id
        ) as total_notes,
        (
          SELECT COUNT(*) 
          FROM books 
          WHERE user_id = u.id
        ) as total_books
      FROM users u
      LEFT JOIN user_settings us ON u.id = us.user_id
      WHERE u.id = $1
    `
    const results = await this.query(sql, [userId])
    return results[0] || null
  }

  // Focus timers operations
  async saveFocusTimer(timerData) {
    const { user_id, timer_type, duration, completed = false, task_description } = timerData
    const sql = `
      INSERT INTO focus_timers (user_id, timer_type, duration, completed, task_description) 
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `
    const result = await this.query(sql, [user_id, timer_type, duration, completed, task_description])
    return result[0].id
  }

  async completeFocusTimer(id) {
    const sql = `
      UPDATE focus_timers 
      SET completed = TRUE, completed_at = NOW() 
      WHERE id = $1
    `
    await this.query(sql, [id])
  }

  async getFocusTimersByUserId(userId) {
    const sql = `
      SELECT * FROM focus_timers 
      WHERE user_id = $1 
      ORDER BY started_at DESC 
      LIMIT 50
    `
    return await this.query(sql, [userId])
  }

  // Study Stats operations
  async updateStudyStats(userId, minutes, sessionCompleted = true) {
    const today = new Date().toISOString().split("T")[0]

    // Check if stats exist for today
    const checkSql = `
      SELECT * FROM study_stats 
      WHERE user_id = $1 AND date = $2
    `
    const existing = await this.query(checkSql, [userId, today])

    if (existing.length > 0) {
      // Update existing stats
      const updateSql = `
        UPDATE study_stats 
        SET total_minutes = total_minutes + $1, 
            total_sessions = total_sessions + 1,
            completed_sessions = completed_sessions + $2,
            updated_at = NOW()
        WHERE user_id = $3 AND date = $4
      `
      await this.query(updateSql, [minutes, sessionCompleted ? 1 : 0, userId, today])
    } else {
      // Create new stats entry
      const insertSql = `
        INSERT INTO study_stats (
          user_id, date, total_sessions, 
          total_minutes, completed_sessions, streak_days
        ) VALUES ($1, $2, 1, $3, $4, 1)
      `
      await this.query(insertSql, [userId, today, minutes, sessionCompleted ? 1 : 0])
    }

    // Update streak
    await this.updateStreak(userId)
  }

  async updateStreak(userId) {
    // Get yesterday's date
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split("T")[0]

    // Check if user studied yesterday
    const checkSql = `
      SELECT streak_days 
      FROM study_stats 
      WHERE user_id = $1 AND date = $2
    `
    const yesterdayStats = await this.query(checkSql, [userId, yesterdayStr])

    if (yesterdayStats.length > 0) {
      // Increment streak from yesterday
      const newStreak = (yesterdayStats[0].streak_days || 0) + 1
      const updateSql = `
        UPDATE study_stats 
        SET streak_days = $1, updated_at = NOW()
        WHERE user_id = $2 AND date = CURRENT_DATE
      `
      await this.query(updateSql, [newStreak, userId])
    }
  }

  async getStudyStats(userId, days = 30) {
    const sql = `
      SELECT * FROM study_stats 
      WHERE user_id = $1 
        AND date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY date DESC
    `
    return await this.query(sql, [userId])
  }

  async getCurrentStreak(userId) {
    const sql = `
      SELECT streak_days 
      FROM study_stats 
      WHERE user_id = $1 
      ORDER BY date DESC 
      LIMIT 1
    `
    const result = await this.query(sql, [userId])
    return result[0]?.streak_days || 0
  }

  async getMonthlyStats(userId) {
    const sql = `
      SELECT 
        TO_CHAR(date, 'YYYY-MM') as month,
        SUM(total_sessions) as sessions,
        COALESCE(SUM(total_minutes), 0) as minutes,
        SUM(completed_sessions) as completed
      FROM study_stats 
      WHERE user_id = $1 
        AND date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY TO_CHAR(date, 'YYYY-MM')
      ORDER BY month DESC
    `
    return await this.query(sql, [userId])
  }

  async getById(table, id, userId = null) {
    let sql = `SELECT * FROM ${table} WHERE id = $1`
    const params = [id]

    if (userId) {
      sql += ` AND user_id = $2`
      params.push(userId)
    }

    const results = await this.query(sql, params)
    return results[0] || null
  }

  async getByUserId(table, userId, orderBy = "created_at DESC") {
    const sql = `SELECT * FROM ${table} WHERE user_id = $1 ORDER BY ${orderBy}`
    return await this.query(sql, [userId])
  }

  async updateById(table, id, updateData, userId = null) {
    const columns = Object.keys(updateData)
    const values = Object.values(updateData)

    if (columns.length === 0) {
      throw new Error("No data to update")
    }

    // Build dynamic SET clause
    const setClause = columns.map((col, index) => `${col} = $${index + 1}`).join(", ")

    let sql = `UPDATE ${table} SET ${setClause}, updated_at = NOW() WHERE id = $${columns.length + 1}`
    const params = [...values, id]

    if (userId) {
      sql += ` AND user_id = $${columns.length + 2}`
      params.push(userId)
    }

    await this.query(sql, params)
  }

  async deleteById(table, id, userId = null) {
    let sql = `DELETE FROM ${table} WHERE id = $1`
    const params = [id]

    if (userId) {
      sql += ` AND user_id = $2`
      params.push(userId)
    }

    await this.query(sql, params)
  }

  async create(table, data) {
    const columns = Object.keys(data)
    const values = Object.values(data)
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ")

    const sql = `
      INSERT INTO ${table} (${columns.join(", ")})
      VALUES (${placeholders})
      RETURNING id
    `

    const result = await this.query(sql, values)
    return result[0].id
  }

  async getWhere(table, whereConditions, orderBy = "created_at DESC") {
    const columns = Object.keys(whereConditions)
    const values = Object.values(whereConditions)

    if (columns.length === 0) {
      const sql = `SELECT * FROM ${table} ORDER BY ${orderBy}`
      return await this.query(sql)
    }

    const whereClause = columns.map((col, i) => `${col} = $${i + 1}`).join(" AND ")
    const sql = `SELECT * FROM ${table} WHERE ${whereClause} ORDER BY ${orderBy}`

    return await this.query(sql, values)
  }

  // Push subscription methods
  async subscribeUserToPush(userId, subscription) {
    const { endpoint, keys } = subscription
    const sql = `
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `
    const result = await this.query(sql, [userId, endpoint, keys.p256dh, keys.auth])
    return result[0].id
  }

  async getUserSubscriptions(userId) {
    const sql = `
      SELECT id, endpoint, p256dh, auth, created_at 
      FROM push_subscriptions 
      WHERE user_id = $1 
        AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY created_at DESC
    `
    return await this.query(sql, [userId])
  }

  async deleteSubscription(subscriptionId, userId) {
    const sql = `
      DELETE FROM push_subscriptions 
      WHERE id = $1 AND user_id = $2
    `
    await this.query(sql, [subscriptionId, userId])
  }

  async deleteSubscriptionByEndpoint(endpoint, userId) {
    const sql = `
      DELETE FROM push_subscriptions 
      WHERE endpoint = $1 AND user_id = $2
    `
    await this.query(sql, [endpoint, userId])
  }

  async getAllActiveSubscriptions() {
    const sql = `
      SELECT 
        ps.id,
        ps.user_id,
        ps.endpoint,
        ps.p256dh,
        ps.auth,
        u.name
      FROM push_subscriptions ps
      JOIN users u ON ps.user_id = u.id
      WHERE ps.expires_at IS NULL OR ps.expires_at > NOW()
      ORDER BY ps.created_at DESC
    `
    return await this.query(sql)
  }
}

export default Database
