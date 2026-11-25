const $ = id => document.getElementById(id);
let session = JSON.parse(localStorage.getItem('session') || 'null');
let editingId = null;

const api = async (url, opts = {}) => {
  const res = await fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(session ? { Authorization: 'Bearer ' + session.token } : {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  const data = res.status === 204 ? null : await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro');
  return data;
};

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const canEdit = m => session && (session.role === 'admin' || session.userId === m.user_id);

function renderSession() {
  const logged = !!session;
  $('auth-box').hidden = logged;
  $('movie-form').hidden = !logged;
  $('logout-btn').hidden = !logged;
  $('user-name').textContent = logged ? `Olá, ${session.name} (${session.role})` : '';
}

async function loadMovies() {
  const q = encodeURIComponent($('search').value), g = encodeURIComponent($('genre-filter').value);
  const movies = await api(`/api/movies?q=${q}&genre=${g}`);
  $('movie-list').innerHTML = movies.length ? movies.map(m => `
    <article class="card" data-title="${esc(m.title)}">
      <h3>${esc(m.title)} <small>(${m.year})</small></h3>
      <div class="meta">${esc(m.genre)} · ${esc(m.director || '—')} · ⭐ ${m.rating ?? '—'}</div>
      <p>${esc(m.synopsis || '')}</p>
      ${canEdit(m) ? `<div class="actions">
        <button class="secondary" onclick="editMovie(${m.id})">Editar</button>
        <button class="danger" onclick="removeMovie(${m.id})">Excluir</button></div>` : ''}
    </article>`).join('') : '<p>Nenhum filme encontrado.</p>';
}

async function authenticate(path) {
  try {
    const data = await api('/api/' + path, { method: 'POST', body: { name: $('name').value, email: $('email').value, password: $('password').value } });
    const payload = JSON.parse(atob(data.token.split('.')[1]));
    session = { ...data, userId: payload.id };
    localStorage.setItem('session', JSON.stringify(session));
    $('auth-msg').textContent = '';
    renderSession(); loadMovies();
  } catch (e) { $('auth-msg').textContent = e.message; }
}

window.editMovie = async id => {
  const m = await api('/api/movies/' + id);
  editingId = id;
  $('form-title').textContent = 'Editar filme';
  $('m-title').value = m.title; $('m-year').value = m.year; $('m-genre').value = m.genre;
  $('m-director').value = m.director || ''; $('m-rating').value = m.rating ?? ''; $('m-synopsis').value = m.synopsis || '';
  window.scrollTo(0, 0);
};
window.removeMovie = async id => {
  if (!confirm('Excluir este filme?')) return;
  await api('/api/movies/' + id, { method: 'DELETE' }); loadMovies();
};

function resetForm() {
  editingId = null; $('form-title').textContent = 'Novo filme';
  ['m-title', 'm-year', 'm-director', 'm-rating', 'm-synopsis'].forEach(i => $(i).value = '');
  $('form-msg').textContent = '';
}

$('login-btn').onclick = () => authenticate('login');
$('register-btn').onclick = () => authenticate('register');
$('logout-btn').onclick = () => { session = null; localStorage.removeItem('session'); renderSession(); loadMovies(); };
$('cancel-edit').onclick = resetForm;
$('search').oninput = loadMovies;
$('genre-filter').onchange = loadMovies;
$('save-movie').onclick = async () => {
  const body = { title: $('m-title').value, year: $('m-year').value, genre: $('m-genre').value,
    director: $('m-director').value, rating: $('m-rating').value, synopsis: $('m-synopsis').value };
  try {
    await api(editingId ? '/api/movies/' + editingId : '/api/movies', { method: editingId ? 'PUT' : 'POST', body });
    resetForm(); loadMovies();
  } catch (e) { $('form-msg').textContent = e.message; }
};

renderSession(); loadMovies();
