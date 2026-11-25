const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const db = new Database(process.env.DB_PATH || 'catalogo.db');
db.pragma('journal_mode = WAL');
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user'
);
CREATE TABLE IF NOT EXISTS movies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  year INTEGER NOT NULL,
  genre TEXT NOT NULL,
  director TEXT,
  rating REAL,
  synopsis TEXT,
  user_id INTEGER NOT NULL REFERENCES users(id)
);`);
if (!db.prepare('SELECT 1 FROM users LIMIT 1').get()) {
  const admin = db.prepare('INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)')
    .run('Admin', 'admin@filmes.com', bcrypt.hashSync('admin123', 8), 'admin');
  const ins = db.prepare('INSERT INTO movies (title,year,genre,director,rating,synopsis,user_id) VALUES (?,?,?,?,?,?,?)');
  [
    ['Cidade de Deus', 2002, 'Drama', 'Fernando Meirelles', 8.6, 'A vida na favela carioca nos anos 70 e 80.'],
    ['Interestelar', 2014, 'Ficção', 'Christopher Nolan', 8.7, 'Exploradores viajam por um buraco de minhoca.'],
    ['Central do Brasil', 1998, 'Drama', 'Walter Salles', 8.0, 'Uma ex-professora ajuda um menino a achar o pai.'],
    ['O Auto da Compadecida', 2000, 'Comédia', 'Guel Arraes', 8.5, 'As aventuras de João Grilo e Chicó no sertão.']
  ].forEach(m => ins.run(...m, admin.lastInsertRowid));
}
module.exports = db;
