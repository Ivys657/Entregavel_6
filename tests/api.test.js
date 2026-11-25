process.env.DB_PATH = ':memory:';
const request = require('supertest');
const app = require('../server');

let token;
const movie = { title: 'Teste', year: 2020, genre: 'Drama', rating: 7.5 };

describe('Autenticação', () => {
  test('cadastra usuário e retorna token', async () => {
    const r = await request(app).post('/api/register').send({ name: 'Ana', email: 'ana@t.com', password: '123456' });
    expect(r.status).toBe(201);
    token = r.body.token;
  });
  test('rejeita e-mail duplicado', async () => {
    const r = await request(app).post('/api/register').send({ name: 'Ana', email: 'ana@t.com', password: '123456' });
    expect(r.status).toBe(409);
  });
  test('rejeita senha errada', async () => {
    const r = await request(app).post('/api/login').send({ email: 'ana@t.com', password: 'errada' });
    expect(r.status).toBe(401);
  });
});

describe('Filmes', () => {
  let id;
  test('lista filmes sem login', async () => {
    const r = await request(app).get('/api/movies');
    expect(r.status).toBe(200);
    expect(r.body.length).toBeGreaterThan(0);
  });
  test('criar exige autenticação', async () => {
    expect((await request(app).post('/api/movies').send(movie)).status).toBe(401);
  });
  test('cria filme válido', async () => {
    const r = await request(app).post('/api/movies').set('Authorization', 'Bearer ' + token).send(movie);
    expect(r.status).toBe(201); id = r.body.id;
  });
  test('valida ano inválido', async () => {
    const r = await request(app).post('/api/movies').set('Authorization', 'Bearer ' + token).send({ ...movie, year: 1500 });
    expect(r.status).toBe(400);
  });
  test('busca por título', async () => {
    const r = await request(app).get('/api/movies?q=Teste');
    expect(r.body).toHaveLength(1);
  });
  test('atualiza o próprio filme', async () => {
    const r = await request(app).put('/api/movies/' + id).set('Authorization', 'Bearer ' + token).send({ ...movie, title: 'Novo' });
    expect(r.status).toBe(200);
  });
  test('outro usuário não pode excluir (403)', async () => {
    const o = await request(app).post('/api/register').send({ name: 'Bia', email: 'bia@t.com', password: '123456' });
    const r = await request(app).delete('/api/movies/' + id).set('Authorization', 'Bearer ' + o.body.token);
    expect(r.status).toBe(403);
  });
  test('dono exclui filme', async () => {
    const r = await request(app).delete('/api/movies/' + id).set('Authorization', 'Bearer ' + token);
    expect(r.status).toBe(204);
  });
});
