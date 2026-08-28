import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/microapi";

export async function conectarBanco() {
  mongoose.set("strictQuery", true);

  // Em ambiente Docker o Mongo pode demorar alguns segundos a mais que a API
  // para aceitar conexões, então tentamos algumas vezes antes de desistir.
  const tentativas = 10;

  for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
    try {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
      console.log("Conectado ao MongoDB");
      return;
    } catch (err) {
      console.error(
        `Falha ao conectar no MongoDB (${tentativa}/${tentativas}): ${err.message}`
      );
      if (tentativa === tentativas) throw err;
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}
