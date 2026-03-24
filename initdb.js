'use strict';
/**
 * initdb.js — Criação e atualização dinâmica do banco de dados SQLite.
 *
 * Execute antes de iniciar o servidor pela primeira vez, ou sempre que
 * quiser resetar/atualizar os dados padrão sem apagar dados personalizados:
 *
 *   node initdb.js               → seed gentil (não sobrescreve dados existentes)
 *   node initdb.js --reset       → apaga e recria TUDO (inclusive usuário admin)
 *   node initdb.js --reset-plans → recria apenas os planos/preços
 *   node initdb.js --reset-user  → recria apenas o usuário admin
 */

const Database = require('better-sqlite3');
const bcrypt   = require('bcryptjs');
const path     = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data.db');

// ── Argumentos da linha de comando ─────────────────────────────────────────
const args         = process.argv.slice(2);
const RESET_ALL    = args.includes('--reset');
const RESET_PLANS  = args.includes('--reset-plans')  || RESET_ALL;
const RESET_USER   = args.includes('--reset-user')   || RESET_ALL;
const RESET_PHONE  = args.includes('--reset-phone')  || RESET_ALL;
const RESET_LOGO   = args.includes('--reset-logo')   || RESET_ALL;

console.log(`\n🗄️  AutoEscola Estrela — InitDB`);
console.log(`📁 Banco: ${DB_PATH}\n`);

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// ═══════════════════════════════════════════════════════════════════════════
// 1. CRIAÇÃO DAS TABELAS (idempotente)
// ═══════════════════════════════════════════════════════════════════════════
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at    TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now'))
  );
`);
console.log('✅ Tabelas verificadas/criadas.');

// ═══════════════════════════════════════════════════════════════════════════
// 2. DADOS PADRÃO — PLANOS / PREÇOS
// ═══════════════════════════════════════════════════════════════════════════
const DEFAULT_PLANS = [
  {
    navLabel:    '1 Categoria (A ou B)',
    yellowBox:   'TABELA DE PREÇOS\n1 CATEGORIA — CARRO OU MOTO (A OU B)',
    leftHeader:  'PACOTES SÓ AUTOESCOLA\nNÃO INCLUSO DUDA E CLÍNICA',
    rightHeader: 'PACOTES COM DUDA E CLÍNICA INCLUSOS',
    packages: [
      {
        label:      'Pacote 2 AULAS',
        priceLeft:  '500,00',
        noteLeft:   'carnê: 1+1 de 300,00 ou cartão: até 12x50,00',
        priceRight: '1.100,00',
        noteRight:  'carnê: 1+1 de 600,00 ou cartão: até 12x110,00'
      },
      {
        label:      'Pacote 6 AULAS',
        priceLeft:  '700,00',
        noteLeft:   'carnê: 1+1 de 400,00 ou cartão: até 12x70,00',
        priceRight: '1.300,00',
        noteRight:  'carnê: 1+1 de 700,00 ou cartão: até 12x110,00'
      },
      {
        label:      'Pacote 10 AULAS',
        priceLeft:  '800,00',
        noteLeft:   'carnê: 1+1 de 500,00 ou cartão: até 12x50,00',
        priceRight: '1.500,00',
        noteRight:  'carnê: 1+1 de 800,00 ou cartão: até 12x150,00'
      },
      {
        label:      'Pacote 20 AULAS',
        priceLeft:  '1.600,00',
        noteLeft:   'carnê: 1+1 de 850,00 ou cartão: até 12x160,00',
        priceRight: '2.200,00',
        noteRight:  'carnê: 1+1 de 1.150,00 ou cartão: até 12x220,00'
      }
    ],
    leftIncluded:    ['Matrícula', '1 Aluguel do veículo', 'Agendamento da prova prática'],
    leftNotIncluded: ['DUDA 420,00', 'Clínica 180,00 (Medida Provisória)'],
    rightIncluded:   [
      'Matrícula',
      '1 Aluguel do veículo',
      'Agendamento da prova prática',
      'DUDA 420,00',
      'Clínica 180,00 (Medida Provisória)'
    ]
  },
  {
    navLabel:    '2 Categorias (AB)',
    yellowBox:   'TABELA DE PREÇOS\n2 CATEGORIAS — CARRO E MOTO (AB)',
    leftHeader:  'PACOTES SÓ AUTOESCOLA\nNÃO INCLUSO DUDA E CLÍNICA',
    rightHeader: 'PACOTES COM DUDA E CLÍNICA INCLUSOS',
    packages: [
      {
        label:      'Pacote 2 AULAS',
        priceLeft:  '800,00',
        noteLeft:   'carnê: 1+1 de 450,00 ou cartão: até 12x80,00',
        priceRight: '1.400,00',
        noteRight:  'carnê: 1+1 de 750,00 ou cartão: até 12x140,00'
      },
      {
        label:      'Pacote 6 AULAS',
        priceLeft:  '1.000,00',
        noteLeft:   'carnê: 1+1 de 550,00 ou cartão: até 12x100,00',
        priceRight: '1.600,00',
        noteRight:  'carnê: 1+1 de 850,00 ou cartão: até 12x160,00'
      },
      {
        label:      'Pacote 10 AULAS',
        priceLeft:  '1.300,00',
        noteLeft:   'carnê: 1+1 de 700,00 ou cartão: até 12x130,00',
        priceRight: '1.900,00',
        noteRight:  'carnê: 1+1 de 1.000,00 ou cartão: até 12x190,00'
      },
      {
        label:      'Pacote 20 AULAS',
        priceLeft:  '2.000,00',
        noteLeft:   'carnê: 1+1 de 1.050,00 ou cartão: até 12x200,00',
        priceRight: '2.600,00',
        noteRight:  'carnê: 1+1 de 1.350,00 ou cartão: até 12x260,00'
      }
    ],
    leftIncluded:    ['Matrícula', '1 Aluguel do veículo', 'Agendamento da prova prática'],
    leftNotIncluded: ['DUDA 420,00', 'Clínica 180,00 (Medida Provisória)'],
    rightIncluded:   [
      'Matrícula',
      '1 Aluguel do veículo',
      'Agendamento da prova prática',
      'DUDA 420,00',
      'Clínica 180,00 (Medida Provisória)'
    ]
  },
  {
    navLabel:    'Inclusão',
    yellowBox:   'TABELA DE PREÇOS + INCLUSÃO\nCARRO OU MOTO (A OU B)',
    leftHeader:  'PACOTES SÓ AUTOESCOLA\nNÃO INCLUSO DUDA E CLÍNICA',
    rightHeader: 'PACOTES COM DUDA E CLÍNICA INCLUSOS',
    packages: [
      {
        label:      'Pacote 2 AULAS',
        priceLeft:  '500,00',
        noteLeft:   'carnê: 1+1 de 300,00 ou cartão: até 12x50,00',
        priceRight: '890,00',
        noteRight:  'carnê: 1+1 de 495,00 ou cartão: até 12x89,00'
      },
      {
        label:      'Pacote 6 AULAS',
        priceLeft:  '700,00',
        noteLeft:   'carnê: 1+1 de 400,00 ou cartão: até 12x70,00',
        priceRight: '1.090,00',
        noteRight:  'carnê: 1+1 de 545,00 ou cartão: até 12x109,00'
      },
      {
        label:      'Pacote 10 AULAS',
        priceLeft:  '900,00',
        noteLeft:   'carnê: 1+1 de 500,00 ou cartão: até 12x90,00',
        priceRight: '1.290,00',
        noteRight:  'carnê: 1+1 de 595,00 ou cartão: até 12x129,00'
      },
      {
        label:      'Pacote 20 AULAS',
        priceLeft:  '1.600,00',
        noteLeft:   'carnê: 1+1 de 850,00 ou cartão: até 12x160,00',
        priceRight: '1.990,00',
        noteRight:  'carnê: 1+1 de 1.045,00 ou cartão: até 12x129,00'
      }
    ],
    leftIncluded:    ['Matrícula', '1 Aluguel do veículo', 'Agendamento da prova prática'],
    leftNotIncluded: ['DUDA 210,00', 'Clínica 130,00 (Medida Provisória)'],
    rightIncluded:   [
      'Matrícula',
      '1 Aluguel do veículo',
      'Agendamento da prova prática',
      'DUDA 220,00',
      'Clínica 160,00 (Medida Provisória)'
    ]
  }
];

// ── Dados padrão de contato ─────────────────────────────────────────────────
const DEFAULT_PHONE = '(21) 3741-0509';
const DEFAULT_LOGO  = '';  // base64 vazio — definir no painel admin

// ═══════════════════════════════════════════════════════════════════════════
// 3. SEED / RESET — CONFIGURAÇÕES
// ═══════════════════════════════════════════════════════════════════════════
if (RESET_PLANS) {
  db.prepare(`INSERT OR REPLACE INTO settings (key, value, updated_at)
              VALUES ('plans', ?, datetime('now'))`).run(JSON.stringify(DEFAULT_PLANS));
  console.log('🔄 Planos/preços RESETADOS para o padrão.');
} else {
  db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES ('plans', ?)`).run(JSON.stringify(DEFAULT_PLANS));
  console.log('✅ Planos/preços: dados padrão inseridos (sem sobrescrever existentes).');
}

if (RESET_PHONE) {
  db.prepare(`INSERT OR REPLACE INTO settings (key, value, updated_at)
              VALUES ('phone', ?, datetime('now'))`).run(DEFAULT_PHONE);
  console.log('🔄 Telefone RESETADO para o padrão.');
} else {
  db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES ('phone', ?)`).run(DEFAULT_PHONE);
  console.log('✅ Telefone: dado padrão inserido (sem sobrescrever existente).');
}

if (RESET_LOGO) {
  db.prepare(`INSERT OR REPLACE INTO settings (key, value, updated_at)
              VALUES ('logo', ?, datetime('now'))`).run(DEFAULT_LOGO);
  console.log('🔄 Logo RESETADA para o padrão (vazio).');
} else {
  db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES ('logo', ?)`).run(DEFAULT_LOGO);
  console.log('✅ Logo: dado padrão inserido (sem sobrescrever existente).');
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. SEED / RESET — USUÁRIO ADMIN
// ═══════════════════════════════════════════════════════════════════════════
const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');

if (RESET_USER && adminExists) {
  const newHash = bcrypt.hashSync('admin123', 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE username = ?').run(newHash, 'admin');
  console.log('🔄 Senha do usuário admin RESETADA para: admin123');
  console.log('⚠️  Altere a senha imediatamente no painel: /admin.html');
} else if (!adminExists) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('admin', hash);
  console.log('✅ Usuário admin CRIADO. Login: admin / Senha: admin123');
  console.log('⚠️  Altere a senha imediatamente no painel: /admin.html');
} else {
  console.log('✅ Usuário admin: já existe (senha mantida).');
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. RESUMO FINAL
// ═══════════════════════════════════════════════════════════════════════════
const settingsCount = db.prepare('SELECT COUNT(*) as n FROM settings').get().n;
const usersCount    = db.prepare('SELECT COUNT(*) as n FROM users').get().n;

console.log(`\n📊 Estado atual do banco:`);
console.log(`   Usuários : ${usersCount}`);
console.log(`   Settings : ${settingsCount}`);
console.log(`\n🚀 Banco pronto! Inicie o servidor com: npm start\n`);

db.close();
