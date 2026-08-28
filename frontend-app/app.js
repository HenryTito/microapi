// Em Docker o nginx faz proxy de /api para o backend; fora dele usamos a API local.
const API = location.port === "5173" || location.protocol === "file:"
  ? "http://localhost:8888"
  : "/api";

const formulario = document.getElementById("formulario");
const campoId = document.getElementById("id");
const campoNome = document.getElementById("nome");
const campoEmail = document.getElementById("email");
const campoFoto = document.getElementById("foto");
const botaoCancelar = document.getElementById("botaoCancelar");
const tituloFormulario = document.getElementById("tituloFormulario");
const lista = document.getElementById("lista");
const vazio = document.getElementById("vazio");
const mensagem = document.getElementById("mensagem");
const status = document.getElementById("status");

function mostrarMensagem(texto) {
  mensagem.textContent = texto;
  mensagem.hidden = !texto;
}

async function requisitar(caminho, opcoes = {}) {
  const resposta = await fetch(`${API}${caminho}`, {
    headers: { "Content-Type": "application/json" },
    ...opcoes,
  });
  const corpo = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(corpo.erro || `Erro ${resposta.status}`);
  return corpo;
}

function iniciais(nome) {
  return nome.trim().charAt(0).toUpperCase() || "?";
}

function criarItem(usuario) {
  const item = document.createElement("li");

  if (usuario.foto) {
    const img = document.createElement("img");
    img.src = usuario.foto;
    img.alt = usuario.nome;
    item.appendChild(img);
  } else {
    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = iniciais(usuario.nome);
    item.appendChild(avatar);
  }

  const dados = document.createElement("div");
  dados.className = "dados";
  const nome = document.createElement("strong");
  nome.textContent = usuario.nome;
  const email = document.createElement("span");
  email.textContent = usuario.email;
  dados.append(nome, email);
  item.appendChild(dados);

  const editar = document.createElement("button");
  editar.className = "secundario";
  editar.textContent = "Editar";
  editar.onclick = () => preencherFormulario(usuario);

  const remover = document.createElement("button");
  remover.className = "perigo";
  remover.textContent = "Remover";
  remover.onclick = () => removerUsuario(usuario);

  item.append(editar, remover);
  return item;
}

function preencherFormulario(usuario) {
  campoId.value = usuario._id;
  campoNome.value = usuario.nome;
  campoEmail.value = usuario.email;
  campoFoto.value = usuario.foto || "";
  tituloFormulario.textContent = "Editando usuário";
  botaoCancelar.hidden = false;
  mostrarMensagem("");
  campoNome.focus();
}

function limparFormulario() {
  formulario.reset();
  campoId.value = "";
  tituloFormulario.textContent = "Novo usuário";
  botaoCancelar.hidden = true;
  mostrarMensagem("");
}

async function carregar() {
  try {
    const usuarios = await requisitar("/usuarios");
    lista.replaceChildren(...usuarios.map(criarItem));
    vazio.hidden = usuarios.length > 0;
    status.textContent = `${usuarios.length} usuário(s) — API conectada`;
    status.classList.remove("erro");
  } catch (err) {
    lista.replaceChildren();
    vazio.hidden = true;
    status.textContent = `Falha ao falar com a API: ${err.message}`;
    status.classList.add("erro");
  }
}

async function removerUsuario(usuario) {
  if (!confirm(`Remover ${usuario.nome}?`)) return;
  try {
    await requisitar(`/usuarios/${usuario._id}`, { method: "DELETE" });
    if (campoId.value === usuario._id) limparFormulario();
    await carregar();
  } catch (err) {
    mostrarMensagem(err.message);
  }
}

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const id = campoId.value;
  const corpo = JSON.stringify({
    nome: campoNome.value,
    email: campoEmail.value,
    foto: campoFoto.value,
  });

  try {
    await requisitar(id ? `/usuarios/${id}` : "/usuarios", {
      method: id ? "PUT" : "POST",
      body: corpo,
    });
    limparFormulario();
    await carregar();
  } catch (err) {
    mostrarMensagem(err.message);
  }
});

botaoCancelar.addEventListener("click", limparFormulario);

carregar();
