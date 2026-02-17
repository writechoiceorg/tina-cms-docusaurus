// server/server.js
// Demo auth server: Express + better-sqlite3 + JWT + bcryptjs

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');

const PORT = process.env.AUTH_PORT || 4002;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const DB_FILE = path.join(__dirname, 'demo.db');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// init db
const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');

db.prepare(
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    roles TEXT
  )`
).run();

db.prepare(
  `CREATE TABLE IF NOT EXISTS revoked_tokens (
    token TEXT PRIMARY KEY,
    revoked_at INTEGER
  )`
).run();

function seed() {
  const exists = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (exists === 0) {
    const insert = db.prepare('INSERT INTO users (username,password,roles) VALUES (?,?,?)');
    const adminPass = bcrypt.hashSync('password123', 8);
    const betaPass = bcrypt.hashSync('bt123', 8);
    const entPass = bcrypt.hashSync('ent123', 8);
    insert.run('admin', adminPass, JSON.stringify(['admin','beta','enterprise']));
    insert.run('betatester', betaPass, JSON.stringify(['beta']));
    insert.run('enterpriseuser', entPass, JSON.stringify(['enterprise']));
    console.log('Seeded users.');
  }
}
seed();

// helpers
function signToken(user) {
  const payload = { username: user.username, roles: JSON.parse(user.roles || '[]') };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

function verifyToken(token) {
  try {
    // check revocation list
    const revoked = db.prepare('SELECT token FROM revoked_tokens WHERE token = ?').get(token);
    if (revoked) return null;
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

function revokeToken(token) {
  try {
    db.prepare('INSERT OR REPLACE INTO revoked_tokens (token, revoked_at) VALUES (?, ?)').run(token, Date.now());
    return true;
  } catch (e) {
    return false;
  }
}

// Routes
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username+password required' });
  const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!row) return res.status(401).json({ error: 'invalid credentials' });
  if (!bcrypt.compareSync(password, row.password)) return res.status(401).json({ error: 'invalid credentials' });
  const token = signToken(row);
  res.json({ token });
});

app.get('/api/verify', (req, res) => {
  const auth = req.headers['authorization'] || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'no token' });
  const token = auth.slice(7);
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'invalid token' });
  res.json({ user: payload });
});

// CRUD for users (admin only)
function requireAdmin(req, res, next) {
  const auth = req.headers['authorization'] || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'no token' });
  const token = auth.slice(7);
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'invalid token' });
  if (!payload.roles || !payload.roles.includes('admin')) return res.status(403).json({ error: 'forbidden' });
  req.user = payload;
  next();
}

app.get('/api/users', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT id, username, roles FROM users').all();
  res.json(rows.map(r => ({ id: r.id, username: r.username, roles: JSON.parse(r.roles) })));
});

app.post('/api/users', requireAdmin, (req, res) => {
  const { username, password, roles } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username+password required' });
  const hash = bcrypt.hashSync(password, 8);
  try {
    const info = db.prepare('INSERT INTO users (username,password,roles) VALUES (?,?,?)').run(username, hash, JSON.stringify(roles || []));
    res.json({ id: info.lastInsertRowid, username, roles: roles || [] });
  } catch (e) {
    res.status(400).json({ error: String(e) });
  }
});

app.put('/api/users/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { password, roles } = req.body || {};
  if (!password && !roles) return res.status(400).json({ error: 'nothing to update' });
  if (password) {
    const hash = bcrypt.hashSync(password, 8);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, id);
  }
  if (roles) {
    db.prepare('UPDATE users SET roles = ? WHERE id = ?').run(JSON.stringify(roles), id);
  }
  res.json({ ok: true });
});

app.delete('/api/users/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ ok: true });
});

// simple login page for demo
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// Revoke token (logout) - accepts token in Authorization header, cookie or body
app.post('/api/logout', (req, res) => {
  const auth = req.headers['authorization'] || '';
  let token = null;
  if (auth.startsWith('Bearer ')) token = auth.slice(7);
  if (!token && req.body && req.body.token) token = req.body.token;
  if (!token) {
    const cookie = req.headers.cookie || '';
    const m = cookie.match(/(?:^|; )demo_jwt=([^;]+)/);
    if (m) token = decodeURIComponent(m[1]);
  }
  if (!token) return res.status(400).json({ error: 'no token provided' });
  const ok = revokeToken(token);
  if (!ok) return res.status(500).json({ error: 'failed to revoke' });
  res.json({ ok: true });
});

app.get('/', (req, res) => res.send('Auth server running'));

app.listen(PORT, () => {
  console.log('Auth server listening on http://localhost:' + PORT);
});
