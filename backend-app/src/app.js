import express from "express";
import cors from "cors";
import rotasUsuarios from "./rotas/usuarios.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ nome: "microapi", versao: "1.0.0", usuarios: "/usuarios" });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/usuarios", rotasUsuarios);

app.use((req, res) => {
  res.status(404).json({ erro: "Rota não encontrada" });
});

app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ erro: "JSON inválido" });
  }
  console.error(err);
  res.status(500).json({ erro: "Erro interno do servidor" });
});

export default app;
