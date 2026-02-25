const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Define a pasta do banco de dados
const dbFolder = process.env.NODE_ENV === 'production' ? '/app/data' : __dirname;
const DB_FILE = path.join(dbFolder, 'demo.db');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Inicia o Banco
const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');

// Tabelas
db.prepare(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT, roles TEXT, last_logout_at INTEGER)`).run();
db.prepare(`CREATE TABLE IF NOT EXISTS revoked_tokens (token TEXT PRIMARY KEY, revoked_at INTEGER)`).run();

// Seed inicial
const exists = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
if (exists === 0) {
  const insert = db.prepare('INSERT INTO users (username,password,roles) VALUES (?,?,?)');
  const salt = bcrypt.genSaltSync(10);
  insert.run('admin', bcrypt.hashSync('password123', salt), JSON.stringify(['admin','beta','enterprise']));
  insert.run('betatester', bcrypt.hashSync('bt123', salt), JSON.stringify(['beta']));
  insert.run('enterpriseuser', bcrypt.hashSync('ent123', salt), JSON.stringify(['enterprise']));
}

// --- Helpers de Auth ---
function signToken(user) {
  const payload = { username: user.username, roles: JSON.parse(user.roles || '[]') };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

function verifyToken(token) {
  try {
    if (db.prepare('SELECT token FROM revoked_tokens WHERE token = ?').get(token)) return null;
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload && payload.username) {
      const user = db.prepare('SELECT last_logout_at FROM users WHERE username = ?').get(payload.username);
      if (user && user.last_logout_at && ((payload.iat || 0) * 1000) < user.last_logout_at) return null;
    }
    return payload;
  } catch (e) { return null; }
}

function getCookie(req, name) {
  const match = req.headers.cookie?.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// ==========================================
// 1. ROTAS DE API (JSON)
// ==========================================
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!row || !bcrypt.compareSync(password, row.password)) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ token: signToken(row) });
});

app.get('/api/verify', (req, res) => {
  const token = (req.headers['authorization'] || '').slice(7) || getCookie(req, 'demo_jwt');
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });
  res.json({ user: payload });
});

app.post('/api/logout', (req, res) => {
  const token = (req.headers['authorization'] || '').slice(7) || req.body?.token || getCookie(req, 'demo_jwt');
  if (token) db.prepare('INSERT OR REPLACE INTO revoked_tokens (token, revoked_at) VALUES (?, ?)').run(token, Date.now());
  res.json({ ok: true });
});

// Middleware p/ rotas de Admin da API
function requireAdmin(req, res, next) {
  const token = (req.headers['authorization'] || '').slice(7) || getCookie(req, 'demo_jwt');
  const payload = verifyToken(token);
  if (!payload || !payload.roles.includes('admin')) return res.status(403).json({ error: 'Forbidden' });
  req.user = payload;
  next();
}

app.get('/api/users', requireAdmin, (req, res) => {
  res.json(db.prepare('SELECT id, username, roles FROM users').all().map(r => ({ ...r, roles: JSON.parse(r.roles) })));
});

// Endpoint de Criar Usuário (Faltava no server anterior)
app.post('/api/users', requireAdmin, (req, res) => {
  const { username, password, roles } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username/Password required' });
  try {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    const info = db.prepare('INSERT INTO users (username, password, roles) VALUES (?, ?, ?)').run(username, hash, JSON.stringify(roles || []));
    res.json({ id: info.lastInsertRowid, username, roles });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/users/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { username, password, roles } = req.body;
  const updates = []; const values = [];
  if (username) { updates.push('username=?'); values.push(username); }
  if (password) { updates.push('password=?'); values.push(bcrypt.hashSync(password, bcrypt.genSaltSync(10))); }
  if (roles) { updates.push('roles=?'); values.push(JSON.stringify(roles)); }
  if (updates.length) {
    values.push(id);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  }
  res.json({ ok: true });
});

app.delete('/api/users/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ==========================================
// 2. MIDDLEWARE DE BLOQUEIO DE PÁGINAS
// ==========================================
app.use((req, res, next) => {
  const path = req.path;
  // Ignora assets estáticos
  if (path.match(/\.(js|css|png|jpg|jpeg|svg|json|ico|woff2?|map)$/i) || path.startsWith('/assets/')) return next();

  const ROLE_MAP = [
    { prefix: '/docs/beta', role: 'beta' },
    { prefix: '/docs/enterprise', role: 'enterprise' },
    { prefix: '/admin', role: 'admin' },
  ];

  const required = ROLE_MAP.find(r => path.startsWith(r.prefix));
  if (!required) return next();

  const token = getCookie(req, 'demo_jwt');
  const payload = verifyToken(token);
  
  if (!payload) return res.redirect(`/login?next=${encodeURIComponent(req.originalUrl)}`);

  const roles = payload.roles || [];
  if (!roles.includes(required.role) && !roles.includes('admin')) return res.redirect('/forbidden');

  next();
});

// ==========================================
// 3. SERVIR O FRONTEND
// ==========================================
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));

const buildPath = path.join(__dirname, '../build');
app.use(express.static(buildPath));

// --- CORREÇÃO AQUI (Para Express 5) ---
// Em vez de '*', usamos uma Regex /(.*)/ para pegar tudo
app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});
// --------------------------------------

app.listen(PORT, () => console.log(`Production Server running on port ${PORT}`));