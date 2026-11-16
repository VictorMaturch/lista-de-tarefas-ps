const API = 'http://localhost:3000';

// se já estiver logado, vai direto para a lista
if (localStorage.getItem('token')) {
  window.location.href = 'index.html';
}

const formLogin = document.getElementById('formLogin');
const formCadastro = document.getElementById('formCadastro');
const trocaLogin = document.getElementById('trocaLogin');
const trocaCadastro = document.getElementById('trocaCadastro');
const mensagem = document.getElementById('mensagem');

const ERRO_SERVIDOR = 'Não foi possível conectar ao servidor. Rode "npm start" na pasta backend e tente de novo.';


// lê a resposta do servidor; se não vier JSON, devolve um erro explicando o motivo
async function lerResposta(resposta) {
  try {
    return await resposta.json();
  } catch (erro) {
    return { erro: 'O servidor respondeu com erro ' + resposta.status + ' e não tem essa rota. O server.js está desatualizado: troque pelo novo, pare o servidor (Ctrl+C) e rode npm start de novo.' };
  }
}

function mostrarMensagem(texto, cor) {
  mensagem.style.color = cor;
  mensagem.textContent = texto;
}

function mostrarCadastro() {
  formLogin.hidden = true;
  trocaLogin.hidden = true;
  formCadastro.hidden = false;
  trocaCadastro.hidden = false;
  mostrarMensagem('', 'green');
}

function mostrarLogin() {
  formCadastro.hidden = true;
  trocaCadastro.hidden = true;
  formLogin.hidden = false;
  trocaLogin.hidden = false;
  mostrarMensagem('', 'green');
}

document.getElementById('irCadastro').addEventListener('click', function (e) {
  e.preventDefault();
  mostrarCadastro();
});

document.getElementById('irLogin').addEventListener('click', function (e) {
  e.preventDefault();
  mostrarLogin();
});

formLogin.addEventListener('submit', async function (e) {
  e.preventDefault();
  mostrarMensagem('Entrando...', '#555');

  try {
    const resposta = await fetch(API + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.getElementById('loginEmail').value,
        senha: document.getElementById('loginSenha').value
      })
    });
    const dados = await lerResposta(resposta);

    if (resposta.ok) {
      localStorage.setItem('token', dados.token);
      localStorage.setItem('nome', dados.nome);
      window.location.href = 'index.html';
    } else {
      mostrarMensagem(dados.erro || 'Erro ao entrar', 'red');
    }
  } catch (erro) {
    console.error(erro);
    mostrarMensagem(ERRO_SERVIDOR, 'red');
  }
});

formCadastro.addEventListener('submit', async function (e) {
  e.preventDefault();
  mostrarMensagem('Cadastrando...', '#555');

  const email = document.getElementById('cadEmail').value;

  try {
    const resposta = await fetch(API + '/cadastro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: document.getElementById('cadNome').value,
        email: email,
        senha: document.getElementById('cadSenha').value
      })
    });
    const dados = await lerResposta(resposta);

    if (resposta.ok) {
      formCadastro.reset();
      mostrarLogin();
      document.getElementById('loginEmail').value = email;
      mostrarMensagem('Conta criada! Agora é só entrar.', 'green');
    } else {
      mostrarMensagem(dados.erro || 'Erro ao cadastrar', 'red');
    }
  } catch (erro) {
    console.error(erro);
    mostrarMensagem(ERRO_SERVIDOR, 'red');
  }
});
