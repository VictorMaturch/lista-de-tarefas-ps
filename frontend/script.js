const API_URL = 'http://localhost:3000/tarefas';

const form = document.getElementById('formTarefa');
const input = document.getElementById('inputTarefa');
const lista = document.getElementById('listaTarefas');
const mensagem = document.getElementById('mensagem');

async function carregarTarefas() {
  const resposta = await fetch(API_URL);
  const tarefas = await resposta.json();

  lista.innerHTML = '';
  tarefas.forEach(function (tarefa) {
    const li = document.createElement('li');
    li.textContent = tarefa.texto;
    lista.appendChild(li);
  });
}

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const texto = input.value.trim();
  if (!texto) return;

  const resposta = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texto: texto })
  });

  if (resposta.ok) {
    input.value = '';
    mensagem.style.color = 'green';
    mensagem.textContent = 'Tarefa cadastrada!';
    setTimeout(function () { mensagem.textContent = ''; }, 2000);
    carregarTarefas();
  } else {
    mensagem.style.color = 'red';
    mensagem.textContent = 'Erro ao cadastrar a tarefa';
  }
});

carregarTarefas();
