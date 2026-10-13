# Lista de Tarefas

Projeto de Software com front-end, back-end e banco de dados.

## Funcionalidades por entrega

- **AC1:** cadastrar uma tarefa (front-end + back-end + banco de dados)
- **AC2:** editar e concluir uma tarefa (front-end + back-end + banco de dados)

## Como rodar

### 1. Back-end
```
cd backend
npm install
npm start
```
O servidor sobe em `http://localhost:3000`. Um arquivo `tarefas.db` (SQLite) é criado automaticamente na primeira execução. A coluna `concluida` é adicionada ao banco automaticamente, caso ainda não exista.

### 2. Front-end
Abra a pasta `frontend` no VS Code e rode o `index.html` com a extensão Live Server.

Com o back-end rodando, cadastre uma tarefa pelo formulário. Use o botão **Editar** para mudar o texto e o checkbox para marcar como concluída. Atualize a página e as mudanças continuam lá, porque estão salvas no banco de dados, não no navegador.

## Estrutura
- `backend/server.js` - API com Express (rotas GET e POST de `/tarefas` e PUT de `/tarefas/:id`)
- `backend/tarefas.db` - banco SQLite (criado automaticamente)
- `frontend/index.html`, `style.css`, `script.js` - tela de cadastro, edição e listagem
