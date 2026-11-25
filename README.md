# 🎬 Catálogo de Filmes (Full Stack)

Frontend HTML/CSS/JS · Backend Node.js + Express (API REST) · SQLite · JWT (autenticação/autorização) · Jest + Selenium (testes).

## Rodar
```bash
npm install
npm start          # http://localhost:3000
npm test           # testes de API (Jest + Supertest)
npm run test:e2e   # teste Selenium (precisa do Google Chrome instalado)
```
Login de admin: `admin@filmes.com` / `admin123` (admin edita/exclui qualquer filme; usuário comum só os seus).

## API
| Método | Rota | Acesso |
|---|---|---|
| POST | /api/register, /api/login | público |
| GET | /api/movies?q=&genre= , /api/movies/:id | público |
| POST | /api/movies | logado |
| PUT/DELETE | /api/movies/:id | dono ou admin |

---
# Passo a passo dos 6 ambientes

## 1. Gestão de tarefas → Trello
1. Acesse trello.com e crie um quadro "Catálogo de Filmes" e convide o time.
2. Crie as listas: **Backlog · Fazendo · Testando · Feito**.
3. Crie cartões: Protótipo no Figma, Modelar banco, API de autenticação, CRUD de filmes, Telas, Testes Jest, Teste Selenium, Deploy.
4. Atribua um responsável e prazo em cada cartão e mova-os conforme avançam.
5. Tire print do quadro para a entrega.

## 2. Design de interfaces → Figma
1. Crie conta em figma.com e um arquivo "Catálogo de Filmes".
2. Faça 3 frames (1440×1024): **Login**, **Lista de filmes** (busca + filtro + cards), **Formulário de filme**.
3. Use as cores do projeto: fundo `#0f1220`, cards `#1b2036`, destaque `#f5b301`.
4. Ligue os frames em modo Prototype (clique em Entrar → Lista) e compartilhe o link.

## 3. Desenvolvimento → Visual Studio Code
1. Instale o VS Code e o Node.js LTS.
2. `File > Open Folder` na pasta do projeto; abra o terminal (Ctrl+`) e rode `npm install`.
3. Extensões úteis: ESLint, Prettier, SQLite Viewer, GitLens.
4. Controle de versão: `git init`, `git add .`, `git commit -m "primeira versão"`, crie um repositório no GitHub e `git push`.

## 4. Banco de dados → DB Browser for SQLite
1. Instale em sqlitebrowser.org e rode `npm start` uma vez (cria `catalogo.db`).
2. `Abrir Banco de Dados` → selecione `catalogo.db`.
3. Veja as tabelas `users` e `movies` na aba *Estrutura* e os dados em *Navegar nos Dados*.
4. Teste na aba *Executar SQL*: `SELECT genre, COUNT(*) FROM movies GROUP BY genre;`

## 5. Testes → Selenium
1. Instale o Google Chrome (o Selenium 4 baixa o driver sozinho).
2. `npm run test:e2e` roda o fluxo: cadastro → criar filme → buscar → excluir.
3. Para ver o navegador abrindo: `HEADLESS=0 npm run test:e2e` (Windows PowerShell: `$env:HEADLESS=0; npm run test:e2e`).

## 6. Execução e servidor web → Node/Express + Render
1. Suba o projeto no GitHub.
2. Em render.com: *New > Web Service* → conecte o repositório.
3. Build: `npm install` · Start: `npm start`.
4. Em *Environment* adicione `JWT_SECRET` com um valor longo e aleatório.
5. Use a URL pública gerada. (No plano gratuito os dados do SQLite somem a cada redeploy; adicione um disco persistente ou use o banco só para demonstração.)
6. Opcional: `docker build -t filmes . && docker run -p 3000:3000 filmes`.
