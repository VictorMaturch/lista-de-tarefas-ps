const API_URL = 'http://localhost:3000/tarefas';

const form = document.getElementById('formTarefa');
const input = document.getElementById('inputTarefa');
const lista = document.getElementById('listaTarefas');
const mensagem = document.getElementById('mensagem');

async function atualizarTarefa(id, dados) {
  const resposta = await fetch(API_URL + '/' + id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });

  if (resposta.ok) {
    mensagem.style.color = 'green';
    mensagem.textContent = 'Tarefa atualizada!';
    setTimeout(function () { mensagem.textContent = ''; }, 2000);
    carregarTarefas();
  } else {
    mensagem.style.color = 'red';
    mensagem.textContent = 'Erro ao atualizar a tarefa';
  }
}

async function carregarTarefas() {
  const resposta = await fetch(API_URL);
  const tarefas = await resposta.json();

  lista.innerHTML = '';
  tarefas.forEach(function (tarefa) {
    const li = document.createElement('li');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = tarefa.concluida === 1;
    checkbox.addEventListener('change', function () {
      atualizarTarefa(tarefa.id, { texto: tarefa.texto, concluida: checkbox.checked ? 1 : 0 });
    });

    const span = document.createElement('span');
    span.textContent = tarefa.texto;
    if (tarefa.concluida === 1) span.classList.add('concluida');

    const botaoEditar = document.createElement('button');
    botaoEditar.textContent = 'Editar';
    botaoEditar.className = 'btn-editar';
    botaoEditar.addEventListener('click', function () {
      const novoTexto = prompt('Editar tarefa:', tarefa.texto);
      if (novoTexto && novoTexto.trim()) {
        atualizarTarefa(tarefa.id, { texto: novoTexto.trim(), concluida: tarefa.concluida });
      }
    });

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(botaoEditar);
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
