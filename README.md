# Lista de Tarefas - AC1

Funcionalidade desta entrega: **cadastrar uma tarefa** (front-end + back-end + banco de dados).

## Como rodar

### 1. Back-end
```
cd backend
npm install
npm start
```
O servidor sobe em `http://localhost:3000`. Um arquivo `tarefas.db` (SQLite) é criado automaticamente na primeira execução.

### 2. Front-end
Abra a pasta `frontend` no VS Code e rode o `index.html` com a extensão Live Server.

Com o back-end rodando, cadastre uma tarefa pelo formulário e ela será salva no banco. Atualize a página e a tarefa continua lá, porque agora ela está no banco de dados, não no navegador.

## Estrutura
- `backend/server.js` - API com Express (rotas GET e POST de `/tarefas`)
- `backend/tarefas.db` - banco SQLite (criado automaticamente)
- `frontend/index.html`, `style.css`, `script.js` - tela de cadastro e listagem
