const express = require('express');
const cors = require('cors');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const app = express();
app.use(cors());
app.use(express.json());

const db = new DatabaseSync('tarefas.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS tarefas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    texto TEXT NOT NULL,
    criada_em TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// AC2 e AC3: adiciona colunas novas se o banco antigo ainda não tiver
const colunas = db.prepare('PRAGMA table_info(tarefas)').all();
if (!colunas.some(function (c) { return c.name === 'concluida'; })) {
  db.exec('ALTER TABLE tarefas ADD COLUMN concluida INTEGER NOT NULL DEFAULT 0');
}
if (!colunas.some(function (c) { return c.name === 'usuario_id'; })) {
  db.exec('ALTER TABLE tarefas ADD COLUMN usuario_id INTEGER');
}

// AC3: tabelas de usuários e de sessões (login)
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    criado_em TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS sessoes (
    token TEXT PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    criada_em TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// ---------- funções de senha (a senha nunca é salva em texto puro) ----------
function gerarHash(senha) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(senha, salt, 64).toString('hex');
  return salt + ':' + hash;
}

function conferirSenha(senha, salvo) {
  const partes = salvo.split(':');
  if (partes.length !== 2) return false;
  const esperado = Buffer.from(partes[1], 'hex');
  const calculado = crypto.scryptSync(senha, partes[0], 64);
  return crypto.timingSafeEqual(calculado, esperado);
}

// ---------- AC3: cadastro, login e logout ----------
app.post('/cadastro', (req, res) => {
  const nome = String(req.body.nome || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const senha = String(req.body.senha || '');

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'Preencha nome, e-mail e senha' });
  }
  if (!email.includes('@')) {
    return res.status(400).json({ erro: 'E-mail inválido' });
  }
  if (senha.length < 6) {
    return res.status(400).json({ erro: 'A senha precisa ter pelo menos 6 caracteres' });
  }

  const existe = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email);
  if (existe) {
    return res.status(409).json({ erro: 'Já existe uma conta com esse e-mail' });
  }

  const resultado = db
    .prepare('INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)')
    .run(nome, email, gerarHash(senha));

  res.status(201).json({ id: Number(resultado.lastInsertRowid), nome: nome, email: email });
});

app.post('/login', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const senha = String(req.body.senha || '');

  const usuario = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
  if (!usuario || !conferirSenha(senha, usuario.senha_hash)) {
    return res.status(401).json({ erro: 'E-mail ou senha incorretos' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO sessoes (token, usuario_id) VALUES (?, ?)').run(token, usuario.id);

  res.json({ token: token, nome: usuario.nome });
});

// verifica o token enviado no cabeçalho Authorization
function autenticar(req, res, next) {
  const cabecalho = req.headers.authorization || '';
  const token = cabecalho.startsWith('Bearer ') ? cabecalho.slice(7) : '';

  const usuario = token
    ? db.prepare(
        'SELECT u.id, u.nome FROM sessoes s JOIN usuarios u ON u.id = s.usuario_id WHERE s.token = ?'
      ).get(token)
    : undefined;

  if (!usuario) {
    return res.status(401).json({ erro: 'Faça login para continuar' });
  }

  req.usuario = usuario;
  req.token = token;
  next();
}

app.post('/logout', autenticar, (req, res) => {
  db.prepare('DELETE FROM sessoes WHERE token = ?').run(req.token);
  res.json({ mensagem: 'Logout realizado' });
});

// ---------- AC4: perfil do usuário ----------

// devolve os dados do usuário logado
app.get('/perfil', autenticar, (req, res) => {
  const usuario = db.prepare('SELECT id, nome, email FROM usuarios WHERE id = ?').get(req.usuario.id);
  res.json(usuario);
});

// edita nome e e-mail
app.put('/perfil', autenticar, (req, res) => {
  const nome = String(req.body.nome || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();

  if (!nome || !email) {
    return res.status(400).json({ erro: 'Preencha nome e e-mail' });
  }
  if (!email.includes('@')) {
    return res.status(400).json({ erro: 'E-mail inválido' });
  }

  const outro = db.prepare('SELECT id FROM usuarios WHERE email = ? AND id != ?').get(email, req.usuario.id);
  if (outro) {
    return res.status(409).json({ erro: 'Já existe outra conta com esse e-mail' });
  }

  db.prepare('UPDATE usuarios SET nome = ?, email = ? WHERE id = ?').run(nome, email, req.usuario.id);
  res.json({ id: req.usuario.id, nome: nome, email: email });
});

// troca a senha (exige a senha atual)
app.put('/perfil/senha', autenticar, (req, res) => {
  const senhaAtual = String(req.body.senhaAtual || '');
  const novaSenha = String(req.body.novaSenha || '');

  const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.usuario.id);
  if (!conferirSenha(senhaAtual, usuario.senha_hash)) {
    return res.status(400).json({ erro: 'A senha atual está incorreta' });
  }
  if (novaSenha.length < 6) {
    return res.status(400).json({ erro: 'A nova senha precisa ter pelo menos 6 caracteres' });
  }
  if (novaSenha === senhaAtual) {
    return res.status(400).json({ erro: 'A nova senha precisa ser diferente da atual' });
  }

  db.prepare('UPDATE usuarios SET senha_hash = ? WHERE id = ?').run(gerarHash(novaSenha), req.usuario.id);

  // por segurança, encerra as outras sessões abertas desse usuário
  db.prepare('DELETE FROM sessoes WHERE usuario_id = ? AND token != ?').run(req.usuario.id, req.token);

  res.json({ mensagem: 'Senha alterada com sucesso' });
  
});// ---------- tarefas (agora cada usuário só enxerga as suas) ----------

// lista as tarefas do usuário, com filtros: ?status=todas|pendentes|concluidas&busca=texto
app.get('/tarefas', autenticar, (req, res) => {
  const status = req.query.status;
  const busca = String(req.query.busca || '').trim();

  let sql = 'SELECT * FROM tarefas WHERE usuario_id = ?';
  const parametros = [req.usuario.id];

  if (status === 'pendentes') {
    sql += ' AND concluida = 0';
  } else if (status === 'concluidas') {
    sql += ' AND concluida = 1';
  }

  if (busca) {
    sql += ' AND texto LIKE ?';
    parametros.push('%' + busca + '%');
  }

  sql += ' ORDER BY id DESC';

  const tarefas = db.prepare(sql).all(...parametros);
  res.json(tarefas);
});

// cadastra uma nova tarefa
app.post('/tarefas', autenticar, (req, res) => {
  const texto = req.body.texto;

  if (!texto || texto.trim() === '') {
    return res.status(400).json({ erro: 'A tarefa precisa ter um texto' });
  }

  const resultado = db
    .prepare('INSERT INTO tarefas (texto, usuario_id) VALUES (?, ?)')
    .run(texto.trim(), req.usuario.id);
  const novaTarefa = db.prepare('SELECT * FROM tarefas WHERE id = ?').get(resultado.lastInsertRowid);

  res.status(201).json(novaTarefa);
});

// edita o texto e/ou marca como concluída
app.put('/tarefas/:id', autenticar, (req, res) => {
  const id = Number(req.params.id);
  const tarefa = db
    .prepare('SELECT * FROM tarefas WHERE id = ? AND usuario_id = ?')
    .get(id, req.usuario.id);

  if (!tarefa) {
    return res.status(404).json({ erro: 'Tarefa não encontrada' });
  }

  let texto = tarefa.texto;
  if (req.body.texto !== undefined) {
    if (typeof req.body.texto !== 'string' || req.body.texto.trim() === '') {
      return res.status(400).json({ erro: 'A tarefa precisa ter um texto' });
    }
    texto = req.body.texto.trim();
  }

  let concluida = tarefa.concluida;
  if (req.body.concluida !== undefined) {
    concluida = req.body.concluida ? 1 : 0;
  }

  db.prepare('UPDATE tarefas SET texto = ?, concluida = ? WHERE id = ?').run(texto, concluida, id);

  const atualizada = db.prepare('SELECT * FROM tarefas WHERE id = ?').get(id);
  res.json(atualizada);
});

// exclui uma tarefa
app.delete('/tarefas/:id', autenticar, (req, res) => {
  const id = Number(req.params.id);
  const tarefa = db
    .prepare('SELECT * FROM tarefas WHERE id = ? AND usuario_id = ?')
    .get(id, req.usuario.id);

  if (!tarefa) {
    return res.status(404).json({ erro: 'Tarefa não encontrada' });
  }

  db.prepare('DELETE FROM tarefas WHERE id = ?').run(id);
  res.json({ mensagem: 'Tarefa excluída' });
});

const PORTA = 3000;
app.listen(PORTA, () => {
  console.log('Servidor rodando em http://localhost:' + PORTA);
});
