import mongoose from "mongoose";
import Usuario from "../modelos/usuario.js";

function idInvalido(id) {
  return !mongoose.Types.ObjectId.isValid(id);
}

function tratarErro(res, err) {
  if (err.name === "ValidationError") {
    return res.status(400).json({ erro: err.message });
  }
  // Índice único do e-mail
  if (err.code === 11000) {
    return res.status(409).json({ erro: "Já existe um usuário com este e-mail" });
  }
  console.error(err);
  return res.status(500).json({ erro: "Erro interno do servidor" });
}

export async function listar(req, res) {
  try {
    const usuarios = await Usuario.find().sort({ createdAt: -1 });
    res.json(usuarios);
  } catch (err) {
    tratarErro(res, err);
  }
}

export async function buscarPorId(req, res) {
  const { id } = req.params;
  if (idInvalido(id)) return res.status(400).json({ erro: "ID inválido" });

  try {
    const usuario = await Usuario.findById(id);
    if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado" });
    res.json(usuario);
  } catch (err) {
    tratarErro(res, err);
  }
}

export async function criar(req, res) {
  try {
    const { nome, email, foto } = req.body;
    const usuario = await Usuario.create({ nome, email, foto });
    res.status(201).json(usuario);
  } catch (err) {
    tratarErro(res, err);
  }
}

export async function atualizar(req, res) {
  const { id } = req.params;
  if (idInvalido(id)) return res.status(400).json({ erro: "ID inválido" });

  try {
    const { nome, email, foto } = req.body;
    // Só envia ao Mongo os campos realmente informados (atualização parcial)
    const dados = {};
    if (nome !== undefined) dados.nome = nome;
    if (email !== undefined) dados.email = email;
    if (foto !== undefined) dados.foto = foto;

    const usuario = await Usuario.findByIdAndUpdate(id, dados, {
      new: true,
      runValidators: true,
    });
    if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado" });
    res.json(usuario);
  } catch (err) {
    tratarErro(res, err);
  }
}

export async function remover(req, res) {
  const { id } = req.params;
  if (idInvalido(id)) return res.status(400).json({ erro: "ID inválido" });

  try {
    const usuario = await Usuario.findByIdAndDelete(id);
    if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado" });
    res.json({ mensagem: "Usuário removido", usuario });
  } catch (err) {
    tratarErro(res, err);
  }
}
