require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL || '';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change_me_now';
const sessions = new Map();
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

if (process.env.NODE_ENV === 'production' && (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD)) {
  throw new Error('ADMIN_USERNAME y ADMIN_PASSWORD son obligatorios en producción.');
}

function isOwnerUsername(username) {
  return String(username || '').trim() === ADMIN_USERNAME;
}

if (!SUPABASE_DB_URL) {
  throw new Error('SUPABASE_DB_URL es obligatoria para conectar con Supabase.');
}

const db = new Pool({
  connectionString: SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

function postgresQuery(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

async function runQuery(sql, params = []) {
  const result = await db.query(postgresQuery(sql), params);
  return { changes: result.rowCount };
}

async function getQuery(sql, params = []) {
  const result = await db.query(postgresQuery(sql), params);
  return result.rows[0] || null;
}

async function allQuery(sql, params = []) {
  const result = await db.query(postgresQuery(sql), params);
  return result.rows;
}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

function validateUsername(username) {
  return typeof username === 'string' && username.trim().length >= 3 && /^[a-zA-Z0-9_]+$/.test(username.trim());
}

function createSession(username) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { username, createdAt: Date.now() });
  return token;
}

function getSessionUsername(req) {
  const token = String(req.headers['x-session-token'] || '').trim();
  const session = token ? sessions.get(token) : null;
  if (!session) return '';
  if (Date.now() - session.createdAt > SESSION_TTL_MS) {
    sessions.delete(token);
    return '';
  }
  return session.username;
}

async function getGroqApiKey() {
  if (GROQ_API_KEY) return GROQ_API_KEY;
  const admin = await getQuery('SELECT api_key FROM users WHERE username = ?', [ADMIN_USERNAME]);
  return String(admin?.api_key || '').trim();
}


async function ensureColumn(tableName, columnName, definition) {
  const columns = await allQuery(
    'SELECT column_name AS name FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2',
    ['public', tableName]
  );
  if (!columns.some((column) => column.name === columnName)) {
    await runQuery(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

async function initDatabase() {
  await runQuery(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  await ensureColumn('users', 'role', `TEXT NOT NULL DEFAULT 'user'`);
  await ensureColumn('users', 'status', `TEXT NOT NULL DEFAULT 'active'`);
  await ensureColumn('users', 'api_key', `TEXT DEFAULT ''`);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS quiz_history (
      id BIGSERIAL PRIMARY KEY,
      username TEXT NOT NULL,
      subject TEXT NOT NULL,
      topic TEXT,
      difficulty TEXT NOT NULL,
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  const adminExists = await getQuery('SELECT id FROM users WHERE username = ?', [ADMIN_USERNAME]);
  if (!adminExists) {
    const adminSalt = crypto.randomBytes(16).toString('hex');
    const adminHash = hashPassword(ADMIN_PASSWORD, adminSalt);
    await runQuery(
      'INSERT INTO users (username, password_hash, salt, role, status, api_key, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [ADMIN_USERNAME, adminHash, adminSalt, 'admin', 'active', GROQ_API_KEY || '', new Date().toISOString()]
    );
    console.log('Usuario administrador creado:', ADMIN_USERNAME);
  } else {
    const adminSalt = crypto.randomBytes(16).toString('hex');
    const adminHash = hashPassword(ADMIN_PASSWORD, adminSalt);
    await runQuery(
      'UPDATE users SET password_hash = ?, salt = ?, role = ?, status = ?, api_key = COALESCE(?, api_key) WHERE username = ?',
      [adminHash, adminSalt, 'admin', 'active', GROQ_API_KEY || null, ADMIN_USERNAME]
    );
    console.log('Usuario administrador validado:', ADMIN_USERNAME);
  }

  console.log('Tablas listas.');
}

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Mathware API funcionando correctamente' });
});

app.post('/api/register', async (req, res) => {
  try {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');

    if (!validateUsername(username)) {
      return res.status(400).json({ success: false, message: 'El usuario debe tener al menos 3 caracteres y solo letras, números o guion bajo.' });
    }

    if (password.length < 4) {
      return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 4 caracteres.' });
    }

    const existingUser = await getQuery('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Ese usuario ya existe.' });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);

    await runQuery(
      'INSERT INTO users (username, password_hash, salt, created_at) VALUES (?, ?, ?, ?)',
      [username, passwordHash, salt, new Date().toISOString()]
    );

    return res.status(201).json({ success: true, message: 'Usuario registrado', user: username });
  } catch (error) {
    console.error('Error en registro:', error);
    return res.status(500).json({ success: false, message: 'Error al registrar el usuario.' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');

    const user = await getQuery('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos.' });
    }

    if (user.status === 'banned' || user.status === 'blocked') {
      return res.status(403).json({ success: false, message: 'Tu cuenta está bloqueada o suspendida.' });
    }

    const expectedHash = hashPassword(password, user.salt);
    if (expectedHash !== user.password_hash) {
      return res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos.' });
    }

    return res.json({
      success: true,
      user: username,
      sessionToken: createSession(user.username),
      role: user.role || 'user',
      status: user.status || 'active',
      message: 'Inicio de sesión correcto'
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ success: false, message: 'Error al iniciar sesión.' });
  }
});

app.get('/api/history', async (req, res) => {
  try {
    const username = String(req.query.username || '').trim();
    const sessionUsername = getSessionUsername(req);
    if (username && sessionUsername !== username) {
      return res.status(403).json({ success: false, message: 'No puedes consultar el historial de otro usuario.' });
    }
    const rows = username
      ? await allQuery('SELECT * FROM quiz_history WHERE username = ? ORDER BY created_at DESC', [username])
      : await allQuery('SELECT * FROM quiz_history ORDER BY created_at DESC LIMIT 20');

    return res.json({ success: true, history: rows });
  } catch (error) {
    console.error('Error al leer historial:', error);
    return res.status(500).json({ success: false, message: 'Error al consultar historial.' });
  }
});

app.delete('/api/history', async (req, res) => {
  try {
    const sessionUsername = getSessionUsername(req);
    if (!sessionUsername) {
      return res.status(401).json({ success: false, message: 'Debes iniciar sesión para borrar el historial.' });
    }

    const targetUsername = String(req.query.username || sessionUsername).trim();
    if (targetUsername !== sessionUsername && !isOwnerUsername(sessionUsername)) {
      return res.status(403).json({ success: false, message: 'No puedes borrar el historial de otro usuario.' });
    }

    await runQuery('DELETE FROM quiz_history WHERE username = ?', [targetUsername]);
    return res.json({ success: true, message: 'Historial eliminado correctamente.' });
  } catch (error) {
    console.error('Error al limpiar historial:', error);
    return res.status(500).json({ success: false, message: 'No se pudo limpiar el historial.' });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const username = String(req.query.username || '').trim();
    if (username && getSessionUsername(req) !== username) {
      return res.status(403).json({ success: false, message: 'No puedes consultar las estadísticas de otro usuario.' });
    }
    const rows = username
      ? await allQuery('SELECT * FROM quiz_history WHERE username = ? ORDER BY created_at DESC', [username])
      : await allQuery('SELECT * FROM quiz_history ORDER BY created_at DESC');

    const total = rows.length;
    const average = total
      ? (rows.reduce((sum, row) => sum + Number(row.score || 0), 0) / total).toFixed(1)
      : '0.0';

    const top = rows
      .slice()
      .sort((a, b) => Number(b.score) - Number(a.score))
      .slice(0, 5);

    return res.json({ success: true, total, average, top });
  } catch (error) {
    console.error('Error al consultar estadísticas:', error);
    return res.status(500).json({ success: false, message: 'Error al consultar estadísticas.' });
  }
});

app.post('/api/history', async (req, res) => {
  try {
    const username = String(req.body.username || '').trim();
    const sessionUsername = getSessionUsername(req);
    const subject = String(req.body.subject || '').trim();
    const topic = String(req.body.topic || 'general').trim();
    const difficulty = String(req.body.difficulty || 'Normal').trim();
    const score = Number(req.body.score || 0);
    const totalQuestions = Number(req.body.total || 0);

    if (!sessionUsername || sessionUsername !== username || !subject) {
      return res.status(403).json({ success: false, message: 'La sesión no permite guardar este resultado.' });
    }

    if (!username || !subject) {
      return res.status(400).json({ success: false, message: 'Faltan datos para guardar la partida.' });
    }

    if (!Number.isFinite(score) || !Number.isFinite(totalQuestions) || score < 0 || totalQuestions <= 0 || score > totalQuestions) {
      return res.status(400).json({ success: false, message: 'La puntuación no es válida.' });
    }

    await runQuery(
      'INSERT INTO quiz_history (username, subject, topic, difficulty, score, total_questions, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [username, subject, topic, difficulty, score, totalQuestions, new Date().toISOString()]
    );

    return res.status(201).json({ success: true, message: 'Resultado guardado correctamente.' });
  } catch (error) {
    console.error('Error al guardar partida:', error);
    return res.status(500).json({ success: false, message: 'Error al guardar el resultado.' });
  }
});

function ensureAdmin(req, res, next) {
  const username = getSessionUsername(req);
  if (!username) {
    return res.status(401).json({ success: false, message: 'Se requiere usuario administrador.' });
  }

  getQuery('SELECT role, status FROM users WHERE username = ?', [username]).then((user) => {
    if (!user || user.status !== 'active' || (user.role !== 'admin' && !isOwnerUsername(username))) {
      return res.status(403).json({ success: false, message: 'No tienes permisos de administrador.' });
    }
    next();
  }).catch((error) => {
    console.error('Error validando admin:', error);
    return res.status(500).json({ success: false, message: 'Error de permisos.' });
  });
}

function ensureOwner(req, res, next) {
  const username = getSessionUsername(req);
  if (!isOwnerUsername(username)) {
    return res.status(403).json({ success: false, message: 'Esta acción solo puede ser ejecutada por el propietario.' });
  }
  getQuery('SELECT status FROM users WHERE username = ?', [username]).then((user) => {
    if (!user || user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'La cuenta del propietario no está activa.' });
    }
    next();
  }).catch((error) => {
    console.error('Error validando propietario:', error);
    return res.status(500).json({ success: false, message: 'Error de permisos.' });
  });
}

app.get('/api/admin/users', ensureAdmin, async (req, res) => {
  try {
    const rows = await allQuery('SELECT id, username, role, status, created_at FROM users ORDER BY username ASC');
    return res.json({ success: true, users: rows });
  } catch (error) {
    console.error('Error listando usuarios:', error);
    return res.status(500).json({ success: false, message: 'No se pudieron listar los usuarios.' });
  }
});

app.get('/api/admin/history', ensureAdmin, async (req, res) => {
  try {
    const rows = await allQuery('SELECT * FROM quiz_history ORDER BY created_at DESC');
    return res.json({ success: true, history: rows });
  } catch (error) {
    console.error('Error listando historial del admin:', error);
    return res.status(500).json({ success: false, message: 'No se pudo consultar el historial.' });
  }
});

app.patch('/api/admin/users/:id', ensureOwner, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const action = String(req.body.action || '').trim();

    if (!userId || !action) {
      return res.status(400).json({ success: false, message: 'Faltan datos para esta acción.' });
    }

    const user = await getQuery('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
    }

    if (isOwnerUsername(user.username) && ['toggleBan', 'toggleBlock', 'toggleAdmin', 'delete', 'changeUsername'].includes(action)) {
      return res.status(403).json({ success: false, message: 'La cuenta propietaria no puede modificarse con esta acción.' });
    }

    if (action === 'toggleBan') {
      const nextStatus = user.status === 'banned' ? 'active' : 'banned';
      await runQuery('UPDATE users SET status = ? WHERE id = ?', [nextStatus, userId]);
      return res.json({ success: true, message: nextStatus === 'banned' ? 'Usuario baneado.' : 'Usuario desbaneado.', status: nextStatus });
    }

    if (action === 'toggleBlock') {
      const nextStatus = user.status === 'blocked' ? 'active' : 'blocked';
      await runQuery('UPDATE users SET status = ? WHERE id = ?', [nextStatus, userId]);
      return res.json({ success: true, message: nextStatus === 'blocked' ? 'Usuario bloqueado.' : 'Usuario desbloqueado.', status: nextStatus });
    }

    if (action === 'toggleAdmin') {
      const nextRole = user.role === 'admin' ? 'user' : 'admin';
      await runQuery('UPDATE users SET role = ? WHERE id = ?', [nextRole, userId]);
      return res.json({ success: true, message: nextRole === 'admin' ? 'Se otorgó administrador.' : 'Se quitó administrador.', role: nextRole });
    }

    if (action === 'delete') {
      await runQuery('DELETE FROM users WHERE id = ?', [userId]);
      await runQuery('DELETE FROM quiz_history WHERE username = ?', [user.username]);
      return res.json({ success: true, message: 'Cuenta eliminada.' });
    }

    if (action === 'changeUsername') {
      const newUsername = String(req.body.newUsername || '').trim();
      if (!newUsername || !validateUsername(newUsername)) {
        return res.status(400).json({ success: false, message: 'Nombre de usuario inválido.' });
      }
      const exists = await getQuery('SELECT id FROM users WHERE username = ? AND id != ?', [newUsername, userId]);
      if (exists) {
        return res.status(409).json({ success: false, message: 'Ese usuario ya existe.' });
      }
      await runQuery('UPDATE users SET username = ? WHERE id = ?', [newUsername, userId]);
      await runQuery('UPDATE quiz_history SET username = ? WHERE username = ?', [newUsername, user.username]);
      return res.json({ success: true, message: 'Usuario actualizado.', username: newUsername });
    }

    if (action === 'changePassword') {
      const newPassword = String(req.body.newPassword || '');
      if (newPassword.length < 4) {
        return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 4 caracteres.' });
      }
      const newSalt = crypto.randomBytes(16).toString('hex');
      const newHash = hashPassword(newPassword, newSalt);
      await runQuery('UPDATE users SET password_hash = ?, salt = ? WHERE id = ?', [newHash, newSalt, userId]);
      return res.json({ success: true, message: 'Contraseña actualizada.' });
    }

    return res.status(400).json({ success: false, message: 'Acción no soportada.' });
  } catch (error) {
    console.error('Error ejecutando acción admin:', error);
    return res.status(500).json({ success: false, message: 'Error al ejecutar la acción del administrador.' });
  }
});

app.patch('/api/admin/history/:id', ensureOwner, async (req, res) => {
  try {
    const historyId = Number(req.params.id);
    const score = Number(req.body.score ?? 0);
    const total = Number(req.body.total ?? 0);
    const subject = String(req.body.subject || '').trim();
    const topic = String(req.body.topic || '').trim();
    const difficulty = String(req.body.difficulty || '').trim();

    if (!historyId) {
      return res.status(400).json({ success: false, message: 'ID inválido.' });
    }

    await runQuery(
      'UPDATE quiz_history SET score = ?, total_questions = ?, subject = ?, topic = ?, difficulty = ? WHERE id = ?',
      [score, total, subject || 'general', topic || 'general', difficulty || 'Normal', historyId]
    );

    return res.json({ success: true, message: 'Resultado actualizado.' });
  } catch (error) {
    console.error('Error editando historial:', error);
    return res.status(500).json({ success: false, message: 'No se pudo actualizar el resultado.' });
  }
});

app.delete('/api/admin/history/:id', ensureOwner, async (req, res) => {
  try {
    const historyId = Number(req.params.id);
    if (!historyId) {
      return res.status(400).json({ success: false, message: 'ID inválido.' });
    }

    await runQuery('DELETE FROM quiz_history WHERE id = ?', [historyId]);
    return res.json({ success: true, message: 'Registro eliminado correctamente.' });
  } catch (error) {
    console.error('Error eliminando historial:', error);
    return res.status(500).json({ success: false, message: 'No se pudo eliminar el registro.' });
  }
});

app.post('/api/admin/reset-history', ensureOwner, async (req, res) => {
  try {
    await runQuery('DELETE FROM quiz_history');
    return res.json({ success: true, message: 'Tablilla global reiniciada.' });
  } catch (error) {
    console.error('Error reiniciando historial:', error);
    return res.status(500).json({ success: false, message: 'No se pudo reiniciar la tablilla.' });
  }
});

app.put('/api/admin/settings/api-key', ensureOwner, async (req, res) => {
  try {
    const apiKey = String(req.body.apiKey || '').trim();
    const user = await getQuery('SELECT id FROM users WHERE username = ?', [getSessionUsername(req)]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario administrador no encontrado.' });
    }
    await runQuery('UPDATE users SET api_key = ? WHERE id = ?', [apiKey, user.id]);
    return res.json({ success: true, message: 'API key actualizada.' });
  } catch (error) {
    console.error('Error actualizando API key:', error);
    return res.status(500).json({ success: false, message: 'No se pudo actualizar la API key.' });
  }
});

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function fallbackQuestions(subject, topic, difficulty, count) {
  const safeSubject = String(subject || 'matematica').toLowerCase();
  const safeTopic = String(topic || 'tema general').trim() || 'tema general';
  const difficultyLevel = String(difficulty || 'normal').toLowerCase();

  const templates = {
    matematica: [
      () => {
        const a = randomInt(2, 9);
        const b = randomInt(3, 15);
        const c = a * randomInt(2, 8) + b;
        return {
          question: `En ${safeTopic}, resuelve la ecuación ${a}x + ${b} = ${c}. ¿Cuál es el valor de x?`,
          options: [Math.round((c - b) / a), Math.round((c + b) / a), Math.round(c / a), Math.round((c - b) / (a + 1))],
          correctIndex: 0
        };
      },
      () => {
        const base = randomInt(12, 90);
        const percent = randomInt(5, 35);
        const correct = Math.round((base * percent) / 100);
        return {
          question: `En ${safeTopic}, ¿cuánto es ${percent}% de ${base}?`,
          options: [correct, correct + 4, correct - 3, correct + 12],
          correctIndex: 0
        };
      },
      () => {
        const lado = randomInt(3, 14);
        const area = lado * lado;
        return {
          question: `En ${safeTopic}, ¿cuál es el área de un cuadrado de lado ${lado} cm?`,
          options: [area, area + 6, area + 18, area - 8],
          correctIndex: 0
        };
      },
      () => {
        const a = randomInt(3, 12);
        const b = randomInt(2, 9);
        const correct = a * b;
        return {
          question: `En ${safeTopic}, ¿cuál es el producto de ${a} y ${b}?`,
          options: [correct, correct + 2, correct + 10, correct - 5],
          correctIndex: 0
        };
      }
    ],
    fisica: [
      () => {
        const v = randomInt(8, 55);
        const t = randomInt(2, 12);
        const correct = v * t;
        return {
          question: `En ${safeTopic}, un móvil recorre ${v} m/s durante ${t} s. ¿Cuál es la distancia recorrida?`,
          options: [correct, correct + 9, correct + 18, correct - 7],
          correctIndex: 0
        };
      },
      () => {
        const m = randomInt(4, 25);
        const a = randomInt(2, 10);
        const correct = m * a;
        return {
          question: `En ${safeTopic}, calcula la fuerza con masa ${m} kg y aceleración ${a} m/s².`,
          options: [correct, correct + 6, correct + 15, correct - 10],
          correctIndex: 0
        };
      },
      () => {
        const f = randomInt(10, 60);
        const d = randomInt(1, 6);
        const correct = f * d;
        return {
          question: `En ${safeTopic}, según la fórmula del trabajo W = F × d, si F = ${f} N y d = ${d} m, ¿cuál es el trabajo?`,
          options: [correct, correct + 8, correct + 20, correct - 5],
          correctIndex: 0
        };
      }
    ],
    biologia: [
      () => {
        const correct = 'Mitocondria';
        return {
          question: `En ${safeTopic}, ¿qué orgánulo es conocido como la central energética de la célula?`,
          options: ['Mitocondria', 'Núcleo', 'Ribosoma', 'Membrana'],
          correctIndex: 0
        };
      },
      () => {
        const correct = 'Fotosíntesis';
        return {
          question: `En ${safeTopic}, ¿qué proceso permite a las plantas producir su alimento?`,
          options: ['Fotosíntesis', 'Respiración', 'Digestión', 'Fermentación'],
          correctIndex: 0
        };
      },
      () => {
        const correct = 'Célula';
        return {
          question: `En ${safeTopic}, ¿cuál es la unidad básica de la vida?`,
          options: ['Célula', 'Tejido', 'Órgano', 'Sustancia'],
          correctIndex: 0
        };
      }
    ],
    quimica: [
      () => {
        const correct = 'Oxígeno';
        return {
          question: `En ${safeTopic}, ¿cuál es el nombre del elemento con símbolo O?`,
          options: ['Oxígeno', 'Nitrógeno', 'Hidrógeno', 'Carbono'],
          correctIndex: 0
        };
      },
      () => {
        const correct = 'pH';
        return {
          question: `En ${safeTopic}, ¿qué medida indica la acidez o basicidad de una solución?`,
          options: ['pH', 'Voltaje', 'Masa', 'Longitud'],
          correctIndex: 0
        };
      }
    ],
    informatica: [
      () => {
        return {
          question: `En ${safeTopic}, ¿qué lenguaje se usa principalmente para estructurar una página web?`,
          options: ['HTML', 'CSS', 'SQL', 'Python'],
          correctIndex: 0
        };
      },
      () => {
        return {
          question: `En ${safeTopic}, ¿qué componente procesa la información dentro de una computadora?`,
          options: ['CPU', 'Monitor', 'Teclado', 'Mouse'],
          correctIndex: 0
        };
      }
    ]
  };

  const selectedTemplates = templates[safeSubject] || [
    () => ({
      question: `En ${safeTopic}, ¿qué concepto es fundamental para comprender ${safeSubject}?`,
      options: ['Definición', 'Aplicación', 'Contexto', 'Todas las anteriores'],
      correctIndex: 3
    })
  ];

  const result = [];
  const seen = new Set();
  let attempts = 0;

  while (result.length < count && attempts < count * 50) {
    const template = selectedTemplates[randomInt(0, selectedTemplates.length - 1)];
    const item = template();
    const key = item.question.trim().toLowerCase();

    if (!seen.has(key)) {
      seen.add(key);
      const answerIndex = Number.isInteger(item.correctIndex) ? item.correctIndex : 0;
      const answer = item.options[answerIndex] || item.options[0];
      const options = shuffleArray(item.options);
      result.push({
        question: item.question,
        options,
        correctIndex: options.indexOf(answer)
      });
    }

    attempts += 1;
  }

  if (result.length < count) {
    for (let i = result.length; i < count; i += 1) {
      const genericQuestion = {
        question: `En ${safeTopic}, ${i + 1}. ¿Cuál es un aspecto importante de ${safeSubject}?`,
        options: ['Concepto principal', 'Aplicación práctica', 'Relación con otras áreas', 'Todas las anteriores'],
        correctIndex: 3
      };
      result.push(genericQuestion);
    }
  }

  return result.slice(0, count);
}

function containsDemoDate(text) {
  const normalized = String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  return /(?:11\s+de\s+septiembre|septiembre\s+11|9\s*\/\s*11|9-11|2001)/.test(normalized);
}

function topicFallbackQuestions(topic, count) {
  const normalizedTopic = String(topic || '').toLowerCase();
  let templates = [];

  if (/roma|romano/.test(normalizedTopic)) {
    templates = [
      { question: '¿Qué ciudad fue el centro político de la República y el Imperio romano?', options: ['Roma', 'Atenas', 'Cartago', 'Alejandría'], correctIndex: 0 },
      { question: '¿Cómo se llamaba el sistema de gobierno romano anterior al Imperio?', options: ['República', 'Teocracia', 'Feudalismo', 'Oligarquía medieval'], correctIndex: 0 },
      { question: '¿Qué construcción romana transportaba agua a las ciudades?', options: ['Acueducto', 'Faro', 'Zigurat', 'Dolmen'], correctIndex: 0 },
      { question: '¿Qué lengua se extendió por gran parte del territorio romano?', options: ['Latín', 'Griego moderno', 'Árabe', 'Gótico'], correctIndex: 0 }
    ];
  } else if (/pitagoras|pitágoras/.test(normalizedTopic)) {
    templates = [
      { question: '¿Qué relación describe el teorema de Pitágoras en un triángulo rectángulo?', options: ['a² + b² = c²', 'a + b = c²', 'a² - b² = c²', '2a + 2b = c'], correctIndex: 0 },
      { question: 'En un triángulo rectángulo con catetos 3 y 4, ¿cuánto mide la hipotenusa?', options: ['5', '6', '7', '12'], correctIndex: 0 },
      { question: '¿Qué lado ocupa la posición c en el teorema de Pitágoras?', options: ['La hipotenusa', 'El cateto menor', 'La altura', 'La mediana'], correctIndex: 0 },
      { question: 'Si la hipotenusa mide 13 y un cateto mide 5, ¿cuánto mide el otro cateto?', options: ['12', '8', '18', '10'], correctIndex: 0 }
    ];
  }

  if (!templates.length) return [];
  return Array.from({ length: count }, (_, index) => {
    const item = templates[index % templates.length];
    const options = shuffleArray([...item.options]);
    return { ...item, options, correctIndex: options.indexOf(item.options[item.correctIndex]) };
  });
}

function normalizeGeneratedQuestions(questions) {
  if (!Array.isArray(questions)) return [];

  return questions.map((question) => {
    const options = Array.isArray(question?.options)
      ? question.options.map((option) => String(option).trim())
      : [];
    const correctIndex = Number(question?.correctIndex);
    const uniqueOptions = new Set(options.map((option) => option.toLowerCase()));

    if (
      typeof question?.question !== 'string' ||
      !question.question.trim() ||
      options.length !== 4 ||
      uniqueOptions.size !== 4 ||
      !Number.isInteger(correctIndex) ||
      correctIndex < 0 ||
      correctIndex >= options.length
    ) {
      return null;
    }

    const correctOption = options[correctIndex];
    const shuffledOptions = shuffleArray(options);
    return {
      question: question.question.trim(),
      options: shuffledOptions,
      correctIndex: shuffledOptions.indexOf(correctOption)
    };
  }).filter(Boolean);
}

app.post('/api/questions', async (req, res) => {
  try {
    const subject = String(req.body.subject || 'matematica').trim();
    const topic = String(req.body.topic || '').trim();
    const difficulty = String(req.body.difficulty || 'normal').trim();
    const count = Math.min(100, Math.max(5, Number(req.body.count) || 10));

    const groqApiKey = await getGroqApiKey();
    if (!groqApiKey) {
      return res.status(503).json({ success: false, message: 'La IA no está configurada. Agrega GROQ_API_KEY en Render o guarda la clave desde el panel de administrador.' });
    }

    const prompt = `Genera exactamente ${count} preguntas de opción múltiple en español sobre la materia "${subject}" y el tema que escribió el usuario: "${topic || 'general'}". Usa el tema literalmente, aunque sea raro, absurdo, imaginario o combine ideas inesperadas; no lo reemplaces por un tema distinto ni lo ignores. Si el tema no tiene base real, crea preguntas coherentes dentro de ese contexto. Incluye exactamente cuatro opciones distintas y una sola respuesta correcta por pregunta. Dificultad: ${difficulty}. Devuélvelas solo en JSON puro, sin markdown ni explicaciones. Estructura exacta: [{"question":"...","options":["...","...","...","..."],"correctIndex":0}]`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqApiKey}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: 'Eres un generador de evaluaciones. Devuelve únicamente JSON válido, sin markdown ni explicaciones.'
          },
          { role: 'user', content: prompt }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error?.message || 'Error al consultar Groq');
    }

    const text = data?.choices?.[0]?.message?.content || '[]';
    const cleaned = text.replace(/```json|```/g, '').trim();
    const questions = JSON.parse(cleaned);

    if (!Array.isArray(questions) || !questions.length) {
      return res.status(502).json({ success: false, message: 'La IA no devolvió preguntas válidas.' });
    }

    const validQuestions = normalizeGeneratedQuestions(questions);
    if (validQuestions.length !== count) {
      return res.status(502).json({ success: false, message: 'La IA no generó la cantidad solicitada de preguntas.' });
    }

    return res.json({ success: true, questions: validQuestions });
  } catch (error) {
    console.error('Error generando preguntas:', error);
    return res.status(502).json({ success: false, message: `Groq no pudo generar las preguntas: ${error.message}` });
  }
});

app.use(express.static(__dirname));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  return res.sendFile(path.join(__dirname, 'index.html'));
});

async function startServer() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Fallo al iniciar servidor:', error);
  process.exit(1);
});
