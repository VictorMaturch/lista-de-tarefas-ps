# Lista de Tarefas

Projeto de Software com front-end, back-end e banco de dados.

## Funcionalidades por entrega

- **AC1:** cadastrar uma tarefa (front-end + back-end + banco de dados)
- **AC2:** editar e concluir uma tarefa (front-end + back-end + banco de dados)
- **AC3:** excluir uma tarefa, cadastro e login de usuário (cada usuário vê só as suas tarefas) e filtros por texto e por status (front-end + back-end + banco de dados)

## Como rodar

### 1. Back-end
```
cd backend
npm install
npm start
```
O servidor sobe em `http://localhost:3000`. Um arquivo `tarefas.db` (SQLite) é criado automaticamente na primeira execução, e as colunas e tabelas novas (`concluida`, `usuario_id`, `usuarios` e `sessoes`) são adicionadas automaticamente caso ainda não existam.

### 2. Front-end
Abra a pasta `frontend` no VS Code e rode o **`login.html`** com a extensão Live Server.

1. Crie uma conta em **Cadastre-se** e entre com o e-mail e a senha.
2. Cadastre tarefas, use **Editar** para mudar o texto, o checkbox para concluir e **Excluir** para remover.
3. Use a busca e o filtro **Todas / Pendentes / Concluídas** para encontrar tarefas.
4. Clique em **Sair** para encerrar a sessão.

Tudo fica salvo no banco de dados, não no navegador: atualize a página e os dados continuam lá.

## Estrutura
- `backend/server.js` - API com Express:
  - `POST /cadastro`, `POST /login` e `POST /logout` (usuários; a senha é salva criptografada)
  - `GET /tarefas` (com filtros `?status=` e `?busca=`), `POST /tarefas`, `PUT /tarefas/:id` e `DELETE /tarefas/:id` (exigem login)
- `backend/tarefas.db` - banco SQLite (criado automaticamente)
- `frontend/login.html` e `login.js` - telas de login e cadastro de usuário
- `frontend/index.html`, `style.css` e `script.js` - lista de tarefas com cadastro, edição, conclusão, exclusão e filtros
