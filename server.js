const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const db = require('./src/db');

const SECRET = process.env.JWT_SECRET || 'troque-este-segredo';
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Autenticação / autorização ----------
const auth = (req, res, next) => {
  try {
    req.user = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), SECRET);
    next();
  } catch { res.status(401).json({ error: 'Não autenticado' }); }
};
const token = u => jwt.sign({ id: u.id, role: u.role, name: u.name }, SECRET, { expiresIn: '4h' });

app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 6)
    return res.status(400).json({ error: 'Nome, e-mail e senha (mín. 6) são obrigatórios' });
  try {
    const r = db.prepare('INSERT INTO users (name,email,password) VALUES (?,?,?)')
      .run(name, email.toLowerCase(), bcrypt.hashSync(password, 8));
    const u = { id: r.lastInsertRowid, role: 'user', name };
    res.status(201).json({ token: token(u), name, role: 'user' });
  } catch { res.status(409).json({ error: 'E-mail já cadastrado' }); }
});

app.post('/api/login', (req, res) => {
  const u = db.prepare('SELECT * FROM users WHERE email=?').get((req.body.email || '').toLowerCase());
  if (!u || !bcrypt.compareSync(req.body.password || '', u.password))
    return res.status(401).json({ error: 'Credenciais inválidas' });
  res.json({ token: token(u), name: u.name, role: u.role });
});

// ---------- Filmes (CRUD) ----------
const validate = m => {
  if (!m.title || !m.genre) return 'Título e gênero são obrigatórios';
  if (!Number.isInteger(+m.year) || m.year < 1888 || m.year > 2100) return 'Ano inválido';
  if (m.rating !== '' && m.rating != null && (m.rating < 0 || m.rating > 10)) return 'Nota deve ser de 0 a 10';
  return null;
};
const fields = m => [m.title, +m.year, m.genre, m.director || null, m.rating === '' ? null : m.rating ?? null, m.synopsis || null];

app.get('/api/movies', (req, res) => {
  const { q = '', genre = '' } = req.query;
  res.json(db.prepare(`SELECT m.*, u.name AS owner FROM movies m JOIN users u ON u.id=m.user_id
    WHERE (m.title LIKE ? OR m.director LIKE ?) AND (?='' OR m.genre=?) ORDER BY m.title`)
    .all(`%${q}%`, `%${q}%`, genre, genre));
});

app.get('/api/movies/:id', (req, res) => {
  const m = db.prepare('SELECT * FROM movies WHERE id=?').get(req.params.id);
  m ? res.json(m) : res.status(404).json({ error: 'Filme não encontrado' });
});

app.post('/api/movies', auth, (req, res) => {
  const err = validate(req.body);
  if (err) return res.status(400).json({ error: err });
  const r = db.prepare('INSERT INTO movies (title,year,genre,director,rating,synopsis,user_id) VALUES (?,?,?,?,?,?,?)')
    .run(...fields(req.body), req.user.id);
  res.status(201).json({ id: r.lastInsertRowid });
});

const canEdit = (req, res, next) => {
  const m = db.prepare('SELECT user_id FROM movies WHERE id=?').get(req.params.id);
  if (!m) return res.status(404).json({ error: 'Filme não encontrado' });
  if (m.user_id !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Sem permissão' });
  next();
};

app.put('/api/movies/:id', auth, canEdit, (req, res) => {
  const err = validate(req.body);
  if (err) return res.status(400).json({ error: err });
  db.prepare('UPDATE movies SET title=?,year=?,genre=?,director=?,rating=?,synopsis=? WHERE id=?')
    .run(...fields(req.body), req.params.id);
  res.json({ ok: true });
});

app.delete('/api/movies/:id', auth, canEdit, (req, res) => {
  db.prepare('DELETE FROM movies WHERE id=?').run(req.params.id);
  res.status(204).end();
});

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

module.exports = app;
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Catálogo rodando em http://localhost:${port}`));
}
