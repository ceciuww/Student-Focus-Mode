// api-server.js - Express API Server untuk FocusMode
import bcrypt from "bcryptjs"
import cors from "cors"
import express from "express"
import jwt from "jsonwebtoken"
import Database from "./database.js"

const app = express()
const PORT = process.env.API_PORT || 3001
const JWT_SECRET = process.env.JWT_SECRET || "focusmode-secret-key-2024"

let db = null

// Global error handlers
process.on("uncaughtException", (error) => {
  console.error("🔥 Uncaught Exception:", error)
  console.error("Stack:", error.stack)
})

process.on("unhandledRejection", (reason, promise) => {
  console.error("🔥 Unhandled Rejection at:", promise)
  console.error("Reason:", reason)
})

// Middleware
app.use(cors())
app.use(express.json())

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path} - ${new Date().toISOString()}`)
  next()
})

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader?.split(" ")[1]

  if (!token) {
    return res.status(401).json({
      error: "Access token required",
      message: "Please provide a valid JWT token in Authorization header",
    })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        error: "Invalid token",
        message: "Token is expired or invalid",
      })
    }
    req.user = user
    next()
  })
}

// Input sanitization helper function
const sanitizeInput = (input) => {
  if (typeof input !== "string") return input
  return input.trim().slice(0, 500) // Limit to 500 chars to prevent overflow
}

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    await db.query("SELECT 1")

    res.json({
      status: "OK",
      service: "FocusMode API",
      database: "Connected",
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      port: PORT,
    })
  } catch (error) {
    console.error("Health check failed:", error.message)
    res.status(500).json({
      status: "ERROR",
      service: "FocusMode API",
      database: "Disconnected",
      error: error.message,
      timestamp: new Date().toISOString(),
    })
  }
})

// Authentication routes
app.post("/api/auth/register", async (req, res) => {
  try {
    let { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Validation error",
        message: "All fields are required",
      })
    }

    // Sanitize inputs
    name = sanitizeInput(name)
    email = sanitizeInput(email).toLowerCase()
    password = sanitizeInput(password)

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        error: "Validation error",
        message: "Invalid email format",
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Validation error",
        message: "Password must be at least 6 characters",
      })
    }

    if (name.length < 2) {
      return res.status(400).json({
        error: "Validation error",
        message: "Name must be at least 2 characters",
      })
    }

    // Check if user already exists
    const existingUser = await db.getUserByEmail(email)
    if (existingUser) {
      return res.status(409).json({
        error: "User exists",
        message: "User with this email already exists",
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    const avatar = name.charAt(0).toUpperCase()

    // Create user
    const userId = await db.createUser({
      name,
      email,
      password: hashedPassword,
      avatar,
    })

    // Generate JWT token
    const token = jwt.sign(
      {
        id: userId,
        email,
        name,
        avatar,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      },
    )

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: userId,
        name,
        email,
        avatar,
      },
      token,
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({
      error: "Server error",
      message: "Failed to create user",
    })
  }
})

app.post("/api/auth/login", async (req, res) => {
  try {
    let { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        error: "Validation error",
        message: "Email and password are required",
      })
    }

    email = sanitizeInput(email).toLowerCase()
    password = sanitizeInput(password)

    // Get user from database
    const user = await db.getUserByEmail(email)
    if (!user) {
      return res.status(401).json({
        error: "Authentication failed",
        message: "Invalid email or password",
      })
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(401).json({
        error: "Authentication failed",
        message: "Invalid email or password",
      })
    }

    // Update last login
    await db.query("UPDATE users SET last_login = NOW() WHERE id = $1", [user.id])

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      },
    )

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        settings: {
          push_enabled: user.push_enabled,
          daily_reminders: user.daily_reminders,
          session_reminders: user.session_reminders,
          achievement_alerts: user.achievement_alerts,
        },
      },
      token,
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({
      error: "Server error",
      message: "Failed to authenticate",
    })
  }
})

// Protected routes
app.get("/api/user/dashboard", authenticateToken, async (req, res) => {
  try {
    const dashboardData = await db.getDashboardData(req.user.id)
    const todayStats = await db.getTodayStats(req.user.id)

    res.json({
      user: req.user,
      dashboard: dashboardData,
      todayStats,
    })
  } catch (error) {
    console.error("Dashboard error:", error)
    res.status(500).json({
      error: "Server error",
      message: "Failed to load dashboard data",
    })
  }
})

// Study Sessions routes
app.get("/api/sessions", authenticateToken, async (req, res) => {
  try {
    const sessions = await db.getSessionsByUserId(req.user.id)
    res.json(sessions)
  } catch (error) {
    console.error("Get sessions error:", error)
    res.status(500).json({
      error: "Server error",
      message: "Failed to retrieve sessions",
    })
  }
})

app.post("/api/sessions", authenticateToken, async (req, res) => {
  try {
    let { title, description, subject, duration, status } = req.body

    if (!title) {
      return res.status(400).json({
        error: "Validation error",
        message: "Title is required",
      })
    }

    title = sanitizeInput(title)
    description = description ? sanitizeInput(description) : ""
    subject = subject ? sanitizeInput(subject) : ""
    duration = Number.parseInt(duration) || 25
    status = status ? sanitizeInput(status) : "planned"

    // Validate duration is positive
    if (duration <= 0) {
      return res.status(400).json({
        error: "Validation error",
        message: "Duration must be greater than 0",
      })
    }

    // Validate status
    const validStatuses = ["planned", "inprogress", "completed", "cancelled"]
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: "Validation error",
        message: "Invalid status value",
      })
    }

    const sessionId = await db.createSession({
      user_id: req.user.id,
      title,
      description,
      subject,
      duration,
      status,
    })

    const sessions = await db.getSessionsByUserId(req.user.id)
    const createdSession = sessions.find((s) => s.id === sessionId)

    res.status(201).json({
      message: "Session created successfully",
      id: sessionId,
      session: createdSession,
    })
  } catch (error) {
    console.error("Create session error:", error)
    res.status(500).json({
      error: "Server error",
      message: "Failed to create session",
    })
  }
})

app.put("/api/sessions/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    let { title, description, subject, duration, status } = req.body

    const sessionId = Number.parseInt(id)
    if (isNaN(sessionId)) {
      return res.status(400).json({
        error: "Validation error",
        message: "Invalid session ID",
      })
    }

    if (title) title = sanitizeInput(title)
    if (description) description = sanitizeInput(description)
    if (subject) subject = sanitizeInput(subject)
    if (duration) {
      duration = Number.parseInt(duration)
      if (duration <= 0) {
        return res.status(400).json({
          error: "Validation error",
          message: "Duration must be greater than 0",
        })
      }
    }
    if (status) {
      status = sanitizeInput(status)
      const validStatuses = ["planned", "inprogress", "completed", "cancelled"]
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: "Validation error",
          message: "Invalid status value",
        })
      }
    }

    // Verify session exists and belongs to user
    const sessions = await db.getSessionsByUserId(req.user.id)
    const session = sessions.find((s) => s.id === sessionId)

    if (!session) {
      return res.status(404).json({
        error: "Not found",
        message: "Session not found",
      })
    }

    await db.updateSession(
      sessionId,
      {
        title,
        description,
        subject,
        duration,
        status,
      },
      req.user.id,
    )

    res.json({
      message: "Session updated successfully",
    })
  } catch (error) {
    console.error("Update session error:", error)
    res.status(500).json({
      error: "Server error",
      message: "Failed to update session",
    })
  }
})

app.delete("/api/sessions/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    // Verify session exists and belongs to user
    const sessions = await db.getSessionsByUserId(req.user.id)
    const session = sessions.find((s) => s.id === Number.parseInt(id))

    if (!session) {
      return res.status(404).json({
        error: "Not found",
        message: "Session not found",
      })
    }

    await db.deleteSession(id, req.user.id)

    res.json({
      message: "Session deleted successfully",
    })
  } catch (error) {
    console.error("Delete session error:", error)
    res.status(500).json({
      error: "Server error",
      message: "Failed to delete session",
    })
  }
})

app.post("/api/sessions/:id/start", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    const sessions = await db.getSessionsByUserId(req.user.id)
    const session = sessions.find((s) => s.id === Number.parseInt(id))

    if (!session) {
      return res.status(404).json({
        error: "Not found",
        message: "Session not found",
      })
    }

    await db.startSession(id, req.user.id)

    res.json({
      message: "Session started successfully",
    })
  } catch (error) {
    console.error("Start session error:", error)
    res.status(500).json({
      error: "Server error",
      message: "Failed to start session",
    })
  }
})

app.post("/api/sessions/:id/complete", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { duration } = req.body

    const sessionId = Number.parseInt(id)
    if (isNaN(sessionId)) {
      return res.status(400).json({
        error: "Validation error",
        message: "Invalid session ID",
      })
    }

    const sessions = await db.getSessionsByUserId(req.user.id)
    const session = sessions.find((s) => s.id === sessionId)

    if (!session) {
      return res.status(404).json({
        error: "Not found",
        message: "Session not found",
      })
    }

    await db.completeSession(sessionId, req.user.id)

    let sessionDuration = session.duration || 0
    if (duration && !isNaN(duration)) {
      sessionDuration = Math.max(0, Number.parseInt(duration))
    }

    if (sessionDuration > 0) {
      await db.updateStudyStats(req.user.id, sessionDuration, true)
    }

    res.json({
      message: "Session completed successfully",
    })
  } catch (error) {
    console.error("Complete session error:", error)
    res.status(500).json({
      error: "Server error",
      message: "Failed to complete session",
    })
  }
})

// Notes routes
app.get("/api/notes", authenticateToken, async (req, res) => {
  try {
    const { category = "all" } = req.query
    const notes = await db.getNotesByUserId(req.user.id, category)
    res.json(notes)
  } catch (error) {
    console.error("Get notes error:", error)
    res.status(500).json({
      error: "Server error",
      message: "Failed to retrieve notes",
    })
  }
})

app.post("/api/notes", authenticateToken, async (req, res) => {
  try {
    let { title, content, category } = req.body

    if (!title || !content) {
      return res.status(400).json({
        error: "Validation error",
        message: "Title and content are required",
      })
    }

    title = sanitizeInput(title)
    content = sanitizeInput(content)
    category = category ? sanitizeInput(category) : "study"

    if (title.length < 1) {
      return res.status(400).json({
        error: "Validation error",
        message: "Title cannot be empty",
      })
    }

    if (content.length < 1) {
      return res.status(400).json({
        error: "Validation error",
        message: "Content cannot be empty",
      })
    }

    const noteId = await db.createNote({
      user_id: req.user.id,
      title,
      content,
      category,
    })

    res.status(201).json({
      message: "Note created successfully",
      id: noteId,
    })
  } catch (error) {
    console.error("Create note error:", error)
    res.status(500).json({
      error: "Server error",
      message: "Failed to create note",
    })
  }
})

app.put("/api/notes/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { title, content, category } = req.body

    const notes = await db.getNotesByUserId(req.user.id)
    const note = notes.find((n) => n.id === Number.parseInt(id))

    if (!note) {
      return res.status(404).json({
        error: "Not found",
        message: "Note not found",
      })
    }

    await db.updateNote(
      id,
      {
        title,
        content,
        category,
      },
      req.user.id,
    )

    res.json({
      message: "Note updated successfully",
    })
  } catch (error) {
    console.error("Update note error:", error)
    res.status(500).json({
      error: "Server error",
      message: "Failed to update note",
    })
  }
})

app.delete("/api/notes/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    const notes = await db.getNotesByUserId(req.user.id)
    const note = notes.find((n) => n.id === Number.parseInt(id))

    if (!note) {
      return res.status(404).json({
        error: "Not found",
        message: "Note not found",
      })
    }

    await db.deleteNote(id, req.user.id)

    res.json({
      message: "Note deleted successfully",
    })
  } catch (error) {
    console.error("Delete note error:", error)
    res.status(500).json({
      error: "Server error",
      message: "Failed to delete note",
    })
  }
})

// Books routes (similar pattern as notes)
app.get("/api/books", authenticateToken, async (req, res) => {
  try {
    const books = await db.getBooksByUserId(req.user.id)
    res.json(books)
  } catch (error) {
    console.error("Get books error:", error)
    res.status(500).json({
      error: "Server error",
      message: "Failed to retrieve books",
    })
  }
})

app.post("/api/books", authenticateToken, async (req, res) => {
  try {
    const { title, author, description, category, is_complete } = req.body

    if (!title) {
      return res.status(400).json({
        error: "Validation error",
        message: "Title is required",
      })
    }

    const bookId = await db.createBook({
      user_id: req.user.id,
      title,
      author,
      description,
      category: category || "academic",
      is_complete: is_complete || false,
    })

    res.status(201).json({
      message: "Book created successfully",
      id: bookId,
    })
  } catch (error) {
    console.error("Create book error:", error)
    res.status(500).json({
      error: "Server error",
      message: "Failed to create book",
    })
  }
})

// Focus timers routes
app.post("/api/timers", authenticateToken, async (req, res) => {
  try {
    let { timer_type, duration, task_description } = req.body

    if (!timer_type || !duration) {
      return res.status(400).json({
        error: "Validation error",
        message: "Timer type and duration are required",
      })
    }

    timer_type = sanitizeInput(timer_type)
    duration = Number.parseInt(duration)
    task_description = task_description ? sanitizeInput(task_description) : ""

    if (isNaN(duration) || duration <= 0) {
      return res.status(400).json({
        error: "Validation error",
        message: "Duration must be a positive number",
      })
    }

    const timerId = await db.saveFocusTimer({
      user_id: req.user.id,
      timer_type,
      duration,
      task_description,
    })

    res.status(201).json({
      message: "Timer saved successfully",
      id: timerId,
    })
  } catch (error) {
    console.error("Save timer error:", error)
    res.status(500).json({
      error: "Server error",
      message: "Failed to save timer",
    })
  }
})

app.post("/api/timers/:id/complete", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { duration } = req.body

    const timerId = Number.parseInt(id)
    if (isNaN(timerId)) {
      return res.status(400).json({
        error: "Validation error",
        message: "Invalid timer ID",
      })
    }

    await db.completeFocusTimer(timerId)

    if (duration && !isNaN(duration)) {
      const timerDuration = Math.max(0, Number.parseInt(duration))
      if (timerDuration > 0) {
        await db.updateStudyStats(req.user.id, timerDuration, true)
      }
    }

    res.json({
      message: "Timer completed successfully",
    })
  } catch (error) {
    console.error("Complete timer error:", error)
    res.status(500).json({
      error: "Server error",
      message: "Failed to complete timer",
    })
  }
})

// Statistics routes dengan PostgreSQL syntax
app.get("/api/stats/today", authenticateToken, async (req, res) => {
  try {
    const todayStats = await db.getTodayStats(req.user.id)
    res.json(todayStats)
  } catch (error) {
    console.error("Get today stats error:", error)
    res.status(500).json({
      error: "Server error",
      message: "Failed to retrieve today's stats",
    })
  }
})

app.get("/api/stats/weekly", authenticateToken, async (req, res) => {
  try {
    const weeklyReport = await db.getWeeklyReport(req.user.id)
    res.json(weeklyReport)
  } catch (error) {
    console.error("Get weekly stats error:", error)
    res.status(500).json({
      error: "Server error",
      message: "Failed to retrieve weekly stats",
    })
  }
})

app.get("/api/stats/summary", authenticateToken, async (req, res) => {
  try {
    const dashboardData = await db.getDashboardData(req.user.id)
    const todayStats = await db.getTodayStats(req.user.id)
    const weeklyReport = await db.getWeeklyReport(req.user.id)
    const currentStreak = await db.getCurrentStreak(req.user.id)

    const weeklyTotalMinutes = weeklyReport.reduce((sum, day) => sum + (Number.parseInt(day.total_minutes) || 0), 0)
    const weeklyTotalSessions = weeklyReport.reduce((sum, day) => sum + (Number.parseInt(day.sessions_count) || 0), 0)

    res.json({
      user: {
        name: dashboardData?.name,
        email: dashboardData?.email,
      },
      overview: {
        completed_sessions: Number.parseInt(dashboardData?.completed_sessions) || 0,
        total_notes: Number.parseInt(dashboardData?.total_notes) || 0,
        total_books: Number.parseInt(dashboardData?.total_books) || 0,
      },
      today: {
        total_minutes: Number.parseInt(todayStats?.total_minutes) || 0,
        total_sessions: Number.parseInt(todayStats?.total_sessions) || 0,
      },
      weekly: {
        total_minutes: weeklyTotalMinutes,
        total_sessions: weeklyTotalSessions,
        daily_breakdown: weeklyReport,
      },
      streak: currentStreak,
    })
  } catch (error) {
    console.error("Get stats summary error:", error)
    res.status(500).json({
      error: "Server error",
      message: "Failed to retrieve stats summary",
    })
  }
})

app.get("/api/stats/streak", authenticateToken, async (req, res) => {
  try {
    const streak = await db.getCurrentStreak(req.user.id)
    res.json({ streak_days: streak })
  } catch (error) {
    console.error("Get streak error:", error)
    res.status(500).json({
      error: "Server error",
      message: "Failed to retrieve streak data",
    })
  }
})

app.get("/api/stats/monthly", authenticateToken, async (req, res) => {
  try {
    const monthlyStats = await db.getMonthlyStats(req.user.id)
    res.json(monthlyStats)
  } catch (error) {
    console.error("Get monthly stats error:", error)
    res.status(500).json({
      error: "Server error",
      message: "Failed to retrieve monthly stats",
    })
  }
})

app.get("/api/stats/history", authenticateToken, async (req, res) => {
  try {
    const days = Number.parseInt(req.query.days) || 30
    const studyStats = await db.getStudyStats(req.user.id, days)
    res.json(studyStats)
  } catch (error) {
    console.error("Get study history error:", error)
    res.status(500).json({
      error: "Server error",
      message: "Failed to retrieve study history",
    })
  }
})

// Settings routes
app.put("/api/settings", authenticateToken, async (req, res) => {
  try {
    const { push_enabled, daily_reminders, session_reminders, achievement_alerts } = req.body

    const validateBool = (value) => (typeof value === "boolean" ? value : false)

    await db.query(
      `UPDATE user_settings 
       SET push_enabled = $1, daily_reminders = $2, 
           session_reminders = $3, achievement_alerts = $4,
           updated_at = NOW()
       WHERE user_id = $5`,
      [
        validateBool(push_enabled),
        validateBool(daily_reminders),
        validateBool(session_reminders),
        validateBool(achievement_alerts),
        req.user.id,
      ],
    )

    res.json({
      message: "Settings updated successfully",
    })
  } catch (error) {
    console.error("Update settings error:", error)
    res.status(500).json({
      error: "Server error",
      message: "Failed to update settings",
    })
  }
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not found",
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  })
})

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error)
  res.status(500).json({
    error: "Internal server error",
    message: "An unexpected error occurred",
    timestamp: new Date().toISOString(),
  })
})

// Start server
async function startServer() {
  try {
    db = new Database()
    await db.connect()

    app.listen(PORT, () => {
      console.log("\n🎯 FocusMode API Server")
      console.log("──────────────────────────────────────")
      console.log(`📍 Running on http://localhost:${PORT}`)
      console.log(`📊 Connected to PostgreSQL Neon`)
      console.log(`🔐 JWT Secret: ${JWT_SECRET.substring(0, 10)}...`)
      console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`)
      console.log("──────────────────────────────────────")
      console.log("✅ Server is ready to accept requests!")
    })
  } catch (error) {
    console.error("❌ Failed to start server:", error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down API server gracefully...")
  await db.disconnect()
  console.log("👋 Server shut down successfully")
  process.exit(0)
})

process.on("SIGTERM", async () => {
  console.log("\n🛑 Received SIGTERM, shutting down...")
  await db.disconnect()
  process.exit(0)
})

startServer()

export default app
