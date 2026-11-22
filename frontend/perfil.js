const BASE_URL = 'http://localhost:3000';

const mensagem = document.getElementById('mensagem');
const formDados = document.getElementById('formDados');
const formSenha = document.getElementById('formSenha');
const campoNome = document.getElementById('perfilNome');
const campoEmail = document.getElementById('perfilEmail');

const ERRO_SERVIDOR = 'Não foi possível conectar ao servidor. Rode "npm start" na pasta backend e tente de novo.';

// só entra quem estiver logado
const token = localStorage.getItem('token');
if (!token) {
  window.location.href = 'login.html';
}

function sair() {
  localStorage.removeItem('token');
  localStorage.removeItem('nome');
  window.location.href = 'login.html';
}

function mostrarMensagem(texto, cor) {
  mensagem.style.color = cor;
  mensagem.textContent = texto;
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

async function lerResposta(resposta) {
  try {
    return await resposta.json();
  } catch (erro) {
    return { erro: 'O servidor respondeu com erro ' + resposta.status + '. Confira se o server.js é o mais novo e reinicie com npm start.' };
  }
}

// preenche o formulário com os dados atuais do usuário
async function carregarPerfil() {
  try {
    const resposta = await chamarApi(BASE_URL + '/perfil');
    const dados = await lerResposta(resposta);

    if (resposta.ok) {
      campoNome.value = dados.nome;
      campoEmail.value = dados.email;
    } else {
      mostrarMensagem(dados.erro || 'Erro ao carregar o perfil', 'red');
    }
  } catch (erro) {
    console.error(erro);
    mostrarMensagem(ERRO_SERVIDOR, 'red');
  }
}

// editar nome e e-mail
formDados.addEventListener('submit', async function (e) {
  e.preventDefault();
  mostrarMensagem('Salvando...', '#555');

  try {
    const resposta = await chamarApi(BASE_URL + '/perfil', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: campoNome.value, email: campoEmail.value })
    });
    const dados = await lerResposta(resposta);

    if (resposta.ok) {
      localStorage.setItem('nome', dados.nome);
      mostrarMensagem('Dados atualizados!', 'green');
    } else {
      mostrarMensagem(dados.erro || 'Erro ao salvar os dados', 'red');
    }
  } catch (erro) {
    console.error(erro);
    mostrarMensagem(ERRO_SERVIDOR, 'red');
  }
});

// trocar a senha
formSenha.addEventListener('submit', async function (e) {
  e.preventDefault();

  const senhaAtual = document.getElementById('senhaAtual').value;
  const novaSenha = document.getElementById('novaSenha').value;
  const confirmarSenha = document.getElementById('confirmarSenha').value;

  if (novaSenha !== confirmarSenha) {
    mostrarMensagem('A confirmação da nova senha não confere', 'red');
    return;
  }

  mostrarMensagem('Trocando a senha...', '#555');

  try {
    const resposta = await chamarApi(BASE_URL + '/perfil/senha', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senhaAtual: senhaAtual, novaSenha: novaSenha })
    });
    const dados = await lerResposta(resposta);

    if (resposta.ok) {
      formSenha.reset();
      mostrarMensagem('Senha alterada com sucesso!', 'green');
    } else {
      mostrarMensagem(dados.erro || 'Erro ao trocar a senha', 'red');
    }
  } catch (erro) {
    console.error(erro);
    mostrarMensagem(ERRO_SERVIDOR, 'red');
  }
});

carregarPerfil();
