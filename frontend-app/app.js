// Em Docker o nginx faz proxy de /api para o backend; fora dele usamos a API local.
const API =
  location.port === "5173" || location.protocol === "file:"
    ? "http://localhost:8888"
    : "/api";

const el = (id) => document.getElementById(id);

const formulario = el("formulario");
const campoId = el("id");
const campoNome = el("nome");
const campoEmail = el("email");
const campoFoto = el("foto");
const botaoSalvar = el("botaoSalvar");
const botaoCancelar = el("botaoCancelar");
const tituloFormulario = el("tituloFormulario");
const lista = el("lista");
const contador = el("contador");
const carregando = el("carregando");
const vazio = el("vazio");
const falha = el("falha");
const falhaDetalhe = el("falhaDetalhe");
const ponto = el("ponto");
const statusTexto = el("statusTexto");
const avisos = el("avisos");

/* ---------- avatar ---------- */

// Deriva uma cor estável a partir do texto, para que cada pessoa
// tenha sempre o mesmo avatar quando não houver foto.
function corDoTexto(texto) {
  let soma = 0;
  for (const caractere of texto) soma = (soma * 31 + caractere.codePointAt(0)) % 360;
  return `hsl(${soma} 32% 45%)`;
}

function iniciais(nome) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return "?";
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

function montarAvatar(usuario, classes = "avatar") {
  if (usuario.foto) {
    const img = document.createElement("img");
    img.className = classes;
    img.src = usuario.foto;
    img.alt = "";
    img.loading = "lazy";
    // Se a URL da foto quebrar, cai para as iniciais.
    img.onerror = () => img.replaceWith(montarAvatar({ ...usuario, foto: "" }, classes));
    return img;
  }

  const div = document.createElement("div");
  div.className = classes;
  div.textContent = iniciais(usuario.nome || usuario.email);
  div.style.background = corDoTexto(usuario.nome || usuario.email);
  return div;
}

/* ---------- avisos ---------- */

function avisar(texto, tipo = "ok") {
  const aviso = document.createElement("div");
  aviso.className = `aviso ${tipo === "erro" ? "erro" : ""}`;
  aviso.textContent = texto;
  avisos.appendChild(aviso);

  setTimeout(() => {
    aviso.classList.add("saindo");
    aviso.addEventListener("animationend", () => aviso.remove(), { once: true });
  }, 3200);
}

/* ---------- API ---------- */

async function requisitar(caminho, opcoes = {}) {
  const resposta = await fetch(`${API}${caminho}`, {
    headers: { "Content-Type": "application/json" },
    ...opcoes,
  });
  const corpo = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(corpo.erro || `Erro ${resposta.status}`);
  return corpo;
}

function definirStatus(texto, estado) {
  statusTexto.textContent = texto;
  ponto.classList.toggle("ativo", estado === "ativo");
  ponto.classList.toggle("falha", estado === "falha");
}

/* ---------- lista ---------- */

function criarItem(usuario) {
  const item = document.createElement("li");
  item.dataset.id = usuario._id;

  item.appendChild(montarAvatar(usuario));

  const dados = document.createElement("div");
  dados.className = "dados";
  const nome = document.createElement("strong");
  nome.textContent = usuario.nome;
  const email = document.createElement("span");
  email.textContent = usuario.email;
  dados.append(nome, email);
  item.appendChild(dados);

  const botoes = document.createElement("div");
  botoes.className = "botoes-item";

  const editar = document.createElement("button");
  editar.className = "acao-texto";
  editar.type = "button";
  editar.textContent = "Editar";
  editar.setAttribute("aria-label", `Editar ${usuario.nome}`);
  editar.onclick = () => preencherFormulario(usuario);

  const remover = document.createElement("button");
  remover.className = "acao-texto remover";
  remover.type = "button";
  remover.textContent = "Remover";
  remover.setAttribute("aria-label", `Remover ${usuario.nome}`);
  remover.onclick = () => removerUsuario(usuario);

  botoes.append(editar, remover);
  item.appendChild(botoes);
  return item;
}

function marcarSelecionado() {
  const id = campoId.value;
  for (const item of lista.children) {
    item.classList.toggle("destacado", Boolean(id) && item.dataset.id === id);
  }
}

async function carregar({ silencioso = false } = {}) {
  if (!silencioso) {
    carregando.hidden = false;
    lista.hidden = true;
    vazio.hidden = true;
    falha.hidden = true;
  }

  try {
    const usuarios = await requisitar("/usuarios");
    lista.replaceChildren(...usuarios.map(criarItem));
    marcarSelecionado();

    carregando.hidden = true;
    falha.hidden = true;
    lista.hidden = usuarios.length === 0;
    vazio.hidden = usuarios.length > 0;
    contador.textContent = usuarios.length;
    definirStatus("API conectada", "ativo");
  } catch (err) {
    carregando.hidden = true;
    lista.hidden = true;
    vazio.hidden = true;
    falha.hidden = false;
    falhaDetalhe.textContent = err.message;
    contador.textContent = "0";
    definirStatus("sem conexão", "falha");
  }
}

/* ---------- formulário ---------- */

function preencherFormulario(usuario) {
  campoId.value = usuario._id;
  campoNome.value = usuario.nome;
  campoEmail.value = usuario.email;
  campoFoto.value = usuario.foto || "";
  tituloFormulario.textContent = "Editar usuário";
  botaoSalvar.textContent = "Salvar alterações";
  botaoCancelar.hidden = false;
  marcarSelecionado();
  campoNome.focus();
}

function limparFormulario() {
  formulario.reset();
  campoId.value = "";
  tituloFormulario.textContent = "Novo usuário";
  botaoSalvar.textContent = "Salvar";
  botaoCancelar.hidden = true;
  for (const campo of [campoNome, campoEmail, campoFoto]) {
    campo.classList.remove("invalido");
  }
  marcarSelecionado();
}

function validar() {
  let valido = true;
  const obrigatorios = [campoNome, campoEmail];

  for (const campo of obrigatorios) {
    const ok = campo.value.trim() !== "" && campo.checkValidity();
    campo.classList.toggle("invalido", !ok);
    if (!ok) valido = false;
  }
  return valido;
}

async function removerUsuario(usuario) {
  if (!confirm(`Remover ${usuario.nome}?`)) return;

  try {
    await requisitar(`/usuarios/${usuario._id}`, { method: "DELETE" });
    if (campoId.value === usuario._id) limparFormulario();
    await carregar({ silencioso: true });
    avisar(`${usuario.nome} foi removido`);
  } catch (err) {
    avisar(err.message, "erro");
  }
}

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  if (!validar()) {
    avisar("Preencha nome e e-mail corretamente", "erro");
    return;
  }

  const id = campoId.value;
  const corpo = JSON.stringify({
    nome: campoNome.value.trim(),
    email: campoEmail.value.trim(),
    foto: campoFoto.value.trim(),
  });

  botaoSalvar.disabled = true;
  const rotulo = botaoSalvar.textContent;
  botaoSalvar.textContent = "Salvando…";

  try {
    const usuario = await requisitar(id ? `/usuarios/${id}` : "/usuarios", {
      method: id ? "PUT" : "POST",
      body: corpo,
    });
    limparFormulario();
    await carregar({ silencioso: true });
    avisar(id ? `${usuario.nome} foi atualizado` : `${usuario.nome} foi cadastrado`);
  } catch (err) {
    avisar(err.message, "erro");
  } finally {
    botaoSalvar.disabled = false;
    botaoSalvar.textContent = rotulo;
  }
});

botaoCancelar.addEventListener("click", limparFormulario);
el("botaoTentar").addEventListener("click", () => carregar());

// Esc cancela a edição em andamento
document.addEventListener("keydown", (evento) => {
  if (evento.key === "Escape" && campoId.value) limparFormulario();
});

carregar();
