const express = require('express');
const cors = require('cors');
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

// AC2: adiciona a coluna "concluida" se o banco antigo ainda não tiver
const colunas = db.prepare('PRAGMA table_info(tarefas)').all();
const temConcluida = colunas.some(function (c) { return c.name === 'concluida'; });
if (!temConcluida) {
  db.exec('ALTER TABLE tarefas ADD COLUMN concluida INTEGER NOT NULL DEFAULT 0');
}

// lista todas as tarefas cadastradas
app.get('/tarefas', (req, res) => {
  const tarefas = db.prepare('SELECT * FROM tarefas ORDER BY id DESC').all();
  res.json(tarefas);
});

// cadastra uma nova tarefa
app.post('/tarefas', (req, res) => {
  const texto = req.body.texto;

  if (!texto || texto.trim() === '') {
    return res.status(400).json({ erro: 'A tarefa precisa ter um texto' });
  }

  const resultado = db.prepare('INSERT INTO tarefas (texto) VALUES (?)').run(texto.trim());
  const novaTarefa = db.prepare('SELECT * FROM tarefas WHERE id = ?').get(resultado.lastInsertRowid);

  res.status(201).json(novaTarefa);
});

// AC2: edita o texto e/ou marca como concluída
app.put('/tarefas/:id', (req, res) => {
  const id = Number(req.params.id);
  const tarefa = db.prepare('SELECT * FROM tarefas WHERE id = ?').get(id);

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

const PORTA = 3000;
app.listen(PORTA, () => {
  console.log('Servidor rodando em http://localhost:' + PORTA);
});
