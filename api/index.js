// api/index.js - Vercel Serverless Function
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { Pool } = require('pg')

const JWT_SECRET = process.env.JWT_SECRET || "focusmode-secret-key-2024"

// Create PostgreSQL connection pool
let pool = null

function getPool() {
  if (!pool) {
    pool = new Pool({
      host: process.env.PGHOST,
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      port: process.env.PGPORT || 5432,
      ssl: {
        rejectUnauthorized: false
      }
    })
  }
  return pool
}

// Helper functions
const sanitizeInput = (input) => {
  if (typeof input !== "string") return input
  return input.trim().slice(0, 500)
}

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Authentication middleware
const authenticateToken = (req) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader?.split(" ")[1]

  if (!token) {
    return { error: "Access token required", status: 401 }
  }

  try {
    const user = jwt.verify(token, JWT_SECRET)
    return { user }
  } catch (err) {
    return { error: "Invalid token", status: 403 }
  }
}

// Main handler
module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  const pool = getPool()
  const { url, method } = req
  const path = url.replace('/api', '')

  try {
    // Health check
    if (path === '/health' && method === 'GET') {
      const result = await pool.query('SELECT NOW()')
      return res.json({
        status: "OK",
        service: "FocusMode API",
        database: "Connected",
        timestamp: new Date().toISOString(),
      })
    }

    // Register
    if (path === '/auth/register' && method === 'POST') {
      let { name, email, password } = req.body

      if (!name || !email || !password) {
        return res.status(400).json({ error: "Validation error", message: "All fields are required" })
      }

      name = sanitizeInput(name)
      email = sanitizeInput(email).toLowerCase()
      password = sanitizeInput(password)

      if (!validateEmail(email)) {
        return res.status(400).json({ error: "Validation error", message: "Invalid email format" })
      }

      if (password.length < 6) {
        return res.status(400).json({ error: "Validation error", message: "Password must be at least 6 characters" })
      }

      const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email])
      if (existingUser.rows.length > 0) {
        return res.status(409).json({ error: "User exists", message: "User with this email already exists" })
      }

      const hashedPassword = await bcrypt.hash(password, 10)
      const avatar = name.charAt(0).toUpperCase()

      const result = await pool.query(
        'INSERT INTO users (name, email, password, avatar) VALUES ($1, $2, $3, $4) RETURNING id',
        [name, email, hashedPassword, avatar]
      )

      const userId = result.rows[0].id

      const token = jwt.sign({ id: userId, email, name, avatar }, JWT_SECRET, { expiresIn: "7d" })

      return res.status(201).json({
        message: "User created successfully",
        user: { id: userId, name, email, avatar },
        token,
      })
    }

    // Login
    if (path === '/auth/login' && method === 'POST') {
      let { email, password } = req.body

      if (!email || !password) {
        return res.status(400).json({ error: "Validation error", message: "Email and password are required" })
      }

      email = sanitizeInput(email).toLowerCase()
      password = sanitizeInput(password)

      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])
      const user = result.rows[0]

      if (!user) {
        return res.status(401).json({ error: "Authentication failed", message: "Invalid email or password" })
      }

      const validPassword = await bcrypt.compare(password, user.password)
      if (!validPassword) {
        return res.status(401).json({ error: "Authentication failed", message: "Invalid email or password" })
      }

      await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id])

      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name, avatar: user.avatar },
        JWT_SECRET,
        { expiresIn: "7d" }
      )

      return res.json({
        message: "Login successful",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
        },
        token,
      })
    }

    // Protected routes - Sessions
    if (path === '/sessions' && method === 'GET') {
      const auth = authenticateToken(req)
      if (auth.error) return res.status(auth.status).json({ error: auth.error })

      const result = await pool.query(
        'SELECT * FROM study_sessions WHERE user_id = $1 ORDER BY created_at DESC',
        [auth.user.id]
      )
      return res.json(result.rows)
    }

    if (path === '/sessions' && method === 'POST') {
      const auth = authenticateToken(req)
      if (auth.error) return res.status(auth.status).json({ error: auth.error })

      let { title, description, subject, duration, status } = req.body

      if (!title) {
        return res.status(400).json({ error: "Validation error", message: "Title is required" })
      }

      title = sanitizeInput(title)
      description = description ? sanitizeInput(description) : ""
      subject = subject ? sanitizeInput(subject) : ""
      duration = parseInt(duration) || 25
      status = status ? sanitizeInput(status) : "planned"

      const result = await pool.query(
        'INSERT INTO study_sessions (user_id, title, description, subject, duration, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [auth.user.id, title, description, subject, duration, status]
      )

      return res.status(201).json({
        message: "Session created successfully",
        id: result.rows[0].id,
      })
    }

    // Notes endpoints
    if (path === '/notes' && method === 'GET') {
      const auth = authenticateToken(req)
      if (auth.error) return res.status(auth.status).json({ error: auth.error })

      const result = await pool.query(
        'SELECT * FROM notes WHERE user_id = $1 ORDER BY created_at DESC',
        [auth.user.id]
      )
      return res.json(result.rows)
    }

    if (path === '/notes' && method === 'POST') {
      const auth = authenticateToken(req)
      if (auth.error) return res.status(auth.status).json({ error: auth.error })

      let { title, content, category } = req.body

      if (!title || !content) {
        return res.status(400).json({ error: "Validation error", message: "Title and content are required" })
      }

      title = sanitizeInput(title)
      content = sanitizeInput(content)
      category = category ? sanitizeInput(category) : "study"

      const result = await pool.query(
        'INSERT INTO notes (user_id, title, content, category) VALUES ($1, $2, $3, $4) RETURNING id',
        [auth.user.id, title, content, category]
      )

      return res.status(201).json({
        message: "Note created successfully",
        id: result.rows[0].id,
      })
    }

    // Stats endpoints
    if (path === '/stats/today' && method === 'GET') {
      const auth = authenticateToken(req)
      if (auth.error) return res.status(auth.status).json({ error: auth.error })

      const result = await pool.query(
        `SELECT 
          COALESCE(SUM(duration), 0) as total_minutes,
          COUNT(*) as total_sessions
         FROM study_sessions 
         WHERE user_id = $1 
         AND DATE(created_at) = CURRENT_DATE 
         AND status = 'completed'`,
        [auth.user.id]
      )

      return res.json(result.rows[0])
    }

    // Default 404
    return res.status(404).json({
      error: "Not found",
      message: `Route ${path} not found`,
    })

  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    })
  }
}