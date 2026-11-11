const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'mindflow-hub-dev-secret-change-in-production';

// --- Load users ---
const users = JSON.parse(fs.readFileSync(path.join(__dirname, 'users.json'), 'utf-8'));

// --- Middleware ---
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000, // 8h
  },
}));

// --- Auth check middleware ---
function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  if (req.path === '/' || req.path === '/api/login' || req.path === '/api/check' || req.path === '/api/logout') {
    return next();
  }
  if (req.path.match(/\.(html|js|css|svg|png|ico)$/)) {
    return res.redirect('/');
  }
  res.status(401).json({ error: 'Unauthorized' });
}

app.use(requireAuth);

// --- Serve login page at root ---
app.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect('/hub');
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Serve hub page ---
app.get('/hub', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'hub.html'));
});

// --- API: Login ---
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
  }

  const user = users.find(u => u.username === username.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
  }

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
  }

  req.session.user = { username: user.username, name: user.name };
  return res.json({ ok: true, name: user.name });
});

// --- API: Check session ---
app.get('/api/check', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json({ name: req.session.user.name });
});

// --- API: Logout ---
app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

// --- API: Platforms list ---
app.get('/api/platforms', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json(PLATFORMS);
});

// --- Start ---
app.listen(PORT, '0.0.0.0', () => {
  console.log(`MindFlow Hub running on http://0.0.0.0:${PORT}`);
});

// ============================================================
// PLATFORM CONFIG — edit URLs here
// ============================================================
const PLATFORMS = [
  {
    id: 'supabase',
    name: 'Supabase',
    description: 'Banco de dados e autenticação',
    url: 'https://supabase.com/dashboard/org/sdkymfktruvsdlqmkqeh',
    icon: 'database',
  },
  {
    id: 'n8n',
    name: 'n8n',
    description: 'Automação de workflows',
    url: 'https://n8n-mcp-n8n.bkpxmb.easypanel.host/projects/Lf5I2sykx1cKIGxc/workflows',
    icon: 'account_tree',
  },
  {
    id: 'hostinger',
    name: 'Hostinger',
    description: 'Hospedagem e domínios',
    url: 'https://hpanel.hostinger.com/',
    icon: 'dns',
  },
  {
    id: 'easypanel',
    name: 'Easypanel',
    description: 'Deploy e gerenciamento de servidores',
    url: 'https://easypanel.io',
    icon: 'rocket_launch',
  },
  {
    id: 'mlflow',
    name: 'MLFlow',
    description: 'Track de experimentos ML',
    url: 'https://mlflow.mindflow-ia.com/#/',
    icon: 'experiment',
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Sparkozzy — repositórios de código',
    url: 'https://github.com/Sparkozzy',
    icon: 'code',
  },
  {
    id: 'zapi',
    name: 'Z-API',
    description: 'API de WhatsApp',
    url: 'https://app.z-api.io/app',
    icon: 'chat',
  },
  {
    id: 'trello-pi',
    name: 'Trello PI',
    description: 'Projetos Internos',
    url: 'https://trello.com/b/A7PITYlb/projetos-internos',
    icon: 'view_kanban',
  },
  {
    id: 'trello-pe',
    name: 'Trello PE',
    description: 'Projetos Externos',
    url: 'https://trello.com/b/uxzdcvl3/projetos-externos',
    icon: 'view_kanban',
  },
  {
    id: 'retell',
    name: 'Retell AI',
    description: 'Dashboard de voz e telefonia',
    url: 'https://dashboard.retellai.com/agents',
    icon: 'phone_in_talk',
  },
  {
    id: 'formulario',
    name: 'Disparo de Ligação',
    description: 'Formulário de chamadas MindFlow',
    url: 'https://mindflow-form.mindflow-ia.com',
    icon: 'smart_toy',
  },
  {
    id: 'planilha',
    name: 'Planilha de Acessos',
    description: 'Senhas e logins das plataformas',
    url: 'https://docs.google.com/spreadsheets/d/1ONK3dt-YjmPG-zEDoOluPuH-44uMrDt-m5lZEBZtbDg/edit?pli=1&gid=894756518#gid=894756518',
    icon: 'key',
  },
];
