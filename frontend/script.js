const BASE_URL = 'http://localhost:3000';
const API_URL = BASE_URL + '/tarefas';

const form = document.getElementById('formTarefa');
const input = document.getElementById('inputTarefa');
const lista = document.getElementById('listaTarefas');
const mensagem = document.getElementById('mensagem');
const filtroBusca = document.getElementById('filtroBusca');
const filtroStatus = document.getElementById('filtroStatus');
const btnSair = document.getElementById('btnSair');

// AC4: só entra quem estiver logado
const token = localStorage.getItem('token');
if (!token) {
  window.location.href = 'login.html';
}

document.getElementById('usuarioNome').textContent = localStorage.getItem('nome') || '';

function sair() {
  localStorage.removeItem('token');
  localStorage.removeItem('nome');
  window.location.href = 'login.html';
}

// faz as chamadas à API já enviando o token do usuário logado
async function chamarApi(url, opcoes) {
  opcoes = opcoes || {};
  opcoes.headers = Object.assign({}, opcoes.headers, { Authorization: 'Bearer ' + token });

  const resposta = await fetch(url, opcoes);
  if (resposta.status === 401) {
    sair();
  }
  return resposta;
}

btnSair.addEventListener('click', async function () {
  try {
    await chamarApi(BASE_URL + '/logout', { method: 'POST' });
  } catch (erro) {
    // se der erro de rede, sai mesmo assim
  }
  sair();
});

async function atualizarTarefa(id, dados) {
  const resposta = await chamarApi(API_URL + '/' + id, {
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

async function excluirTarefa(id) {
  const resposta = await chamarApi(API_URL + '/' + id, { method: 'DELETE' });

  if (resposta.ok) {
    mensagem.style.color = 'green';
    mensagem.textContent = 'Tarefa excluída!';
    setTimeout(function () { mensagem.textContent = ''; }, 2000);
    carregarTarefas();
  } else {
    mensagem.style.color = 'red';
    mensagem.textContent = 'Erro ao excluir a tarefa';
  }
}

async function carregarTarefas() {
  // AC4: os filtros são enviados para o back-end na própria URL
  const parametros = new URLSearchParams({
    status: filtroStatus.value,
    busca: filtroBusca.value.trim()
  });

  const resposta = await chamarApi(API_URL + '?' + parametros.toString());
  const tarefas = await resposta.json();

  lista.innerHTML = '';

  if (tarefas.length === 0) {
    const vazio = document.createElement('li');
    vazio.className = 'vazio';
    vazio.textContent = 'Nenhuma tarefa encontrada';
    lista.appendChild(vazio);
    return;
  }

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

    const botaoExcluir = document.createElement('button');
    botaoExcluir.textContent = 'Excluir';
    botaoExcluir.className = 'btn-excluir';
    botaoExcluir.addEventListener('click', function () {
      if (confirm('Excluir a tarefa "' + tarefa.texto + '"?')) {
        excluirTarefa(tarefa.id);
      }
    });

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(botaoEditar);
    li.appendChild(botaoExcluir);
    lista.appendChild(li);
  });
}

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const texto = input.value.trim();
  if (!texto) return;

  const resposta = await chamarApi(API_URL, {
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

filtroBusca.addEventListener('input', carregarTarefas);
filtroStatus.addEventListener('change', carregarTarefas);

carregarTarefas();
