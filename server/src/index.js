import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { Pool } from 'pg'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

if (typeof globalThis.parseInt !== 'function') globalThis.parseInt = Number.parseInt

dotenv.config()

const app = express()
app.use(cors({ origin: '*'}))
app.use(express.json())
app.use(morgan('dev'))

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT ?? '5432', 10),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE
})

async function runSchema() {
  const schemaPath = path.join(process.cwd(), 'db', 'schema.sql')
  const sql = fs.readFileSync(schemaPath, 'utf8')
  await pool.query(sql)
}

async function query(sql, params) {
  const client = await pool.connect()
  try {
    const res = await client.query(sql, params)
    return res.rows
  } finally {
    client.release()
  }
}

async function ensureAdmin() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  const name = process.env.ADMIN_NAME || 'Admin'
  if (!email || !password) return
  const rows = await query('select id from users where email=$1', [email])
  if (rows.length === 0) {
    const id = crypto.randomUUID()
    const hash = await bcrypt.hash(password, 10)
    await query('insert into users(id,email,name,role,password_hash,status) values($1,$2,$3,$4,$5,$6)', [id, email, name, 'admin', hash, 'active'])
  }
}

function signToken(payload) {
  const secret = process.env.JWT_SECRET || 'change-me'
  return jwt.sign(payload, secret, { expiresIn: '7d' })
}

function authMiddleware(req, res, next) {
  const h = req.headers.authorization || ''
  const token = h.startsWith('Bearer ') ? h.slice(7) : ''
  if (!token) return res.status(401).json({ error: 'unauthorized' })
  try {
    const secret = process.env.JWT_SECRET || 'change-me'
    const decoded = jwt.verify(token, secret)
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ error: 'unauthorized' })
  }
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: 'forbidden' })
    next()
  }
}

let dbReady = false

async function connectWithRetry(maxRetries = 10, delayMs = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const client = await pool.connect()
      client.release()
      dbReady = true
      try { await runSchema() } catch (e) { /* schema opcional; não derruba servidor */ }
      return
    } catch (err) {
      dbReady = false
      await new Promise(r => setTimeout(r, delayMs))
      delayMs = Math.min(delayMs * 2, 10000)
    }
  }
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', db: dbReady ? 'up' : 'down' })
})

app.get('/settings', async (req, res) => {
  const rows = await query('select key, value from settings', [])
  const obj = {}
  for (const r of rows) obj[r.key] = r.value
  res.json(obj)
})

app.put('/settings', authMiddleware, requireRole(['admin','editor']), async (req, res) => {
  const entries = Object.entries(req.body || {})
  const client = await pool.connect()
  try {
    await client.query('begin')
    for (const [key, value] of entries) {
      await client.query(
        'insert into settings(key, value) values($1, $2::jsonb) on conflict(key) do update set value = excluded.value',
        [key, JSON.stringify(value)]
      )
    }
    await client.query('commit')
    res.json({ ok: true })
  } catch (e) {
    await client.query('rollback')
    res.status(500).json({ error: 'db_error' })
  } finally {
    client.release()
  }
})

app.get('/announcements', async (req, res) => {
  const rows = await query('select id, data from announcements order by created_at desc', [])
  res.json(rows.map(r => ({ id: r.id, ...r.data })))
})

app.post('/announcements', authMiddleware, requireRole(['admin','editor']), async (req, res) => {
  const id = crypto.randomUUID()
  const data = req.body || {}
  await query('insert into announcements(id, data) values($1, $2::jsonb)', [id, data])
  res.json({ id })
})

app.patch('/announcements/:id', authMiddleware, requireRole(['admin','editor']), async (req, res) => {
  const id = req.params.id
  const data = req.body || {}
  await query('update announcements set data = $2::jsonb where id = $1', [id, data])
  res.json({ ok: true })
})

app.delete('/announcements/:id', authMiddleware, requireRole(['admin','editor']), async (req, res) => {
  const id = req.params.id
  await query('delete from announcements where id = $1', [id])
  res.json({ ok: true })
})

app.get('/cultos', async (req, res) => {
  const rows = await query('select id, data from cultos order by created_at desc', [])
  res.json(rows.map(r => ({ id: r.id, ...r.data })))
})

app.post('/cultos', authMiddleware, requireRole(['admin','editor']), async (req, res) => {
  const id = crypto.randomUUID()
  const data = req.body || {}
  await query('insert into cultos(id, data) values($1, $2::jsonb)', [id, data])
  res.json({ id })
})

app.patch('/cultos/:id', authMiddleware, requireRole(['admin','editor']), async (req, res) => {
  const id = req.params.id
  const data = req.body || {}
  await query('update cultos set data = $2::jsonb where id = $1', [id, data])
  res.json({ ok: true })
})

app.delete('/cultos/:id', authMiddleware, requireRole(['admin','editor']), async (req, res) => {
  const id = req.params.id
  await query('delete from cultos where id = $1', [id])
  res.json({ ok: true })
})

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body || {}
  const rows = await query('select id,email,name,role,password_hash,status from users where email=$1', [String(email || '').toLowerCase()])
  if (rows.length === 0) return res.status(401).json({ error: 'invalid_credentials' })
  const u = rows[0]
  if (u.status !== 'active') return res.status(403).json({ error: 'inactive' })
  const ok = await bcrypt.compare(password || '', u.password_hash)
  if (!ok) return res.status(401).json({ error: 'invalid_credentials' })
  const token = signToken({ id: u.id, email: u.email, name: u.name, role: u.role })
  res.json({ token, user: { id: u.id, email: u.email, name: u.name, role: u.role } })
})

app.get('/me', authMiddleware, async (req, res) => {
  res.json({ user: { id: req.user.id, email: req.user.email, name: req.user.name, role: req.user.role } })
})

const port = parseInt(process.env.PORT ?? '3000', 10)

(async () => {
  await connectWithRetry()
  await ensureAdmin()
  app.listen(port, () => {})
})()
