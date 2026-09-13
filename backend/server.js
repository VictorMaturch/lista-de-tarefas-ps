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

const PORTA = 3000;
app.listen(PORTA, () => {
  console.log('Servidor rodando em http://localhost:' + PORTA);
});
