import "dotenv/config";
import app from "./app.js";
import { conectarBanco } from "./config/banco.js";

const PORT = process.env.PORT || 8888;

async function iniciar() {
  try {
    await conectarBanco();
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  } catch (err) {
    console.error("Não foi possível iniciar o servidor:", err.message);
    process.exit(1);
  }
}

iniciar();
