'use strict';

const express   = require('express');
const Database  = require('better-sqlite3');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const path      = require('path');

const app        = express();
const DB_PATH    = path.join(__dirname, 'data.db');
const db         = new Database(DB_PATH);
const JWT_SECRET = process.env.JWT_SECRET || 'ae-estrela-s3cr3t-2024-change-in-prod';
const PORT       = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname, { index: 'index.html' }));

// ── Banco de dados ──────────────────────────────────────────────────────────
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// ── Dados padrão dos planos ─────────────────────────────────────────────────
const DEFAULT_PLANS = [
  {
    navLabel:    '1 Categoria (A ou B)',
    yellowBox:   'TABELA DE PREÇOS\n1 CATEGORIA — CARRO OU MOTO (A OU B)',
    leftHeader:  'PACOTES SÓ AUTOESCOLA\nNÃO INCLUSO DUDA E CLÍNICA',
    rightHeader: 'PACOTES COM DUDA E CLÍNICA INCLUSOS',
    packages: [
      { label: 'Pacote 2 AULAS',  priceLeft: '500,00',   noteLeft: 'carnê: 1+1 de 300,00 ou cartão: até 12x50,00',    priceRight: '1.100,00', noteRight: 'carnê: 1+1 de 600,00 ou cartão: até 12x110,00'  },
      { label: 'Pacote 6 AULAS',  priceLeft: '700,00',   noteLeft: 'carnê: 1+1 de 400,00 ou cartão: até 12x70,00',    priceRight: '1.300,00', noteRight: 'carnê: 1+1 de 700,00 ou cartão: até 12x110,00'  },
      { label: 'Pacote 10 AULAS', priceLeft: '800,00',   noteLeft: 'carnê: 1+1 de 500,00 ou cartão: até 12x50,00',    priceRight: '1.500,00', noteRight: 'carnê: 1+1 de 800,00 ou cartão: até 12x150,00'  },
      { label: 'Pacote 20 AULAS', priceLeft: '1.600,00', noteLeft: 'carnê: 1+1 de 850,00 ou cartão: até 12x160,00',   priceRight: '2.200,00', noteRight: 'carnê: 1+1 de 1.150,00 ou cartão: até 12x220,00' }
    ],
    leftIncluded:    ['Matrícula', '1 Aluguel do veículo', 'Agendamento da prova prática'],
    leftNotIncluded: ['DUDA 420,00', 'Clínica 180,00 (Medida Provisória)'],
    rightIncluded:   ['Matrícula', '1 Aluguel do veículo', 'Agendamento da prova prática', 'DUDA 420,00', 'Clínica 180,00 (Medida Provisória)']
  },
  {
    navLabel:    '2 Categorias (AB)',
    yellowBox:   'TABELA DE PREÇOS\n2 CATEGORIAS — CARRO E MOTO (AB)',
    leftHeader:  'PACOTES SÓ AUTOESCOLA\nNÃO INCLUSO DUDA E CLÍNICA',
    rightHeader: 'PACOTES COM DUDA E CLÍNICA INCLUSOS',
    packages: [
      { label: 'Pacote 2 AULAS',  priceLeft: '800,00',   noteLeft: 'carnê: 1+1 de 450,00 ou cartão: até 12x80,00',    priceRight: '1.400,00', noteRight: 'carnê: 1+1 de 750,00 ou cartão: até 12x140,00'  },
      { label: 'Pacote 6 AULAS',  priceLeft: '1.000,00', noteLeft: 'carnê: 1+1 de 550,00 ou cartão: até 12x100,00',   priceRight: '1.600,00', noteRight: 'carnê: 1+1 de 850,00 ou cartão: até 12x160,00'  },
      { label: 'Pacote 10 AULAS', priceLeft: '1.300,00', noteLeft: 'carnê: 1+1 de 700,00 ou cartão: até 12x130,00',   priceRight: '1.900,00', noteRight: 'carnê: 1+1 de 1.000,00 ou cartão: até 12x190,00' },
      { label: 'Pacote 20 AULAS', priceLeft: '2.000,00', noteLeft: 'carnê: 1+1 de 1.050,00 ou cartão: até 12x200,00', priceRight: '2.600,00', noteRight: 'carnê: 1+1 de 1.350,00 ou cartão: até 12x260,00' }
    ],
    leftIncluded:    ['Matrícula', '1 Aluguel do veículo', 'Agendamento da prova prática'],
    leftNotIncluded: ['DUDA 420,00', 'Clínica 180,00 (Medida Provisória)'],
    rightIncluded:   ['Matrícula', '1 Aluguel do veículo', 'Agendamento da prova prática', 'DUDA 420,00', 'Clínica 180,00 (Medida Provisória)']
  },
  {
    navLabel:    'Inclusão',
    yellowBox:   'TABELA DE PREÇOS + INCLUSÃO\nCARRO OU MOTO (A OU B)',
    leftHeader:  'PACOTES SÓ AUTOESCOLA\nNÃO INCLUSO DUDA E CLÍNICA',
    rightHeader: 'PACOTES COM DUDA E CLÍNICA INCLUSOS',
    packages: [
      { label: 'Pacote 2 AULAS',  priceLeft: '500,00',   noteLeft: 'carnê: 1+1 de 300,00 ou cartão: até 12x50,00',   priceRight: '890,00',   noteRight: 'carnê: 1+1 de 495,00 ou cartão: até 12x89,00'   },
      { label: 'Pacote 6 AULAS',  priceLeft: '700,00',   noteLeft: 'carnê: 1+1 de 400,00 ou cartão: até 12x70,00',   priceRight: '1.090,00', noteRight: 'carnê: 1+1 de 545,00 ou cartão: até 12x109,00'  },
      { label: 'Pacote 10 AULAS', priceLeft: '900,00',   noteLeft: 'carnê: 1+1 de 500,00 ou cartão: até 12x90,00',   priceRight: '1.290,00', noteRight: 'carnê: 1+1 de 595,00 ou cartão: até 12x129,00'  },
      { label: 'Pacote 20 AULAS', priceLeft: '1.600,00', noteLeft: 'carnê: 1+1 de 850,00 ou cartão: até 12x160,00',  priceRight: '1.990,00', noteRight: 'carnê: 1+1 de 1.045,00 ou cartão: até 12x129,00' }
    ],
    leftIncluded:    ['Matrícula', '1 Aluguel do veículo', 'Agendamento da prova prática'],
    leftNotIncluded: ['DUDA 210,00', 'Clínica 130,00 (Medida Provisória)'],
    rightIncluded:   ['Matrícula', '1 Aluguel do veículo', 'Agendamento da prova prática', 'DUDA 220,00', 'Clínica 160,00 (Medida Provisória)']
  }
];

// ── Seed usuário admin ──────────────────────────────────────────────────────
if (!db.prepare('SELECT id FROM users WHERE username = ?').get('admin')) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('admin', hash);
  console.log('✅ Usuário admin criado. Login: admin / Senha: admin123');
  console.log('⚠️  Altere a senha no painel admin em: /admin.html');
}

// ── Seed configurações padrão ───────────────────────────────────────────────
const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
insertSetting.run('logo',  '');
insertSetting.run('phone', '(21) 3741-0509');
insertSetting.run('plans', JSON.stringify(DEFAULT_PLANS));

// ── Middleware de autenticação ──────────────────────────────────────────────
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado. Faça login novamente.' });
  }
}

// ── Rotas da API ────────────────────────────────────────────────────────────

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
  }
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Usuário ou senha incorretos' });
  }
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, username: user.username });
});

// Verificar token (usado pelo admin para checar sessão)
app.get('/api/me', requireAuth, (req, res) => {
  res.json({ username: req.user.username });
});

// Obter configurações (público — lido pelo index.html)
app.get('/api/settings', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const { key, value } of rows) {
    try { settings[key] = JSON.parse(value); }
    catch { settings[key] = value; }
  }
  res.json(settings);
});

// Atualizar configurações (protegido)
app.put('/api/settings', requireAuth, (req, res) => {
  const allowed = ['logo', 'phone', 'plans'];
  const setStmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  const tx = db.transaction(data => {
    for (const key of allowed) {
      if (key in data) {
        const val = typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]);
        setStmt.run(key, val);
      }
    }
  });
  tx(req.body);
  res.json({ ok: true });
});

// Alterar senha (protegido)
app.put('/api/password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    return res.status(400).json({ error: 'Dados inválidos. A nova senha deve ter pelo menos 6 caracteres.' });
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
    return res.status(401).json({ error: 'Senha atual incorreta' });
  }
  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, req.user.id);
  res.json({ ok: true });
});

// ── Iniciar servidor ────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📊 Painel Admin : http://localhost:${PORT}/admin.html`);
  console.log(`📋 Tabelas      : http://localhost:${PORT}/\n`);
});
