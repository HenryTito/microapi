import mongoose from "mongoose";

const schemaUsuario = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "E-mail inválido"],
    },
    foto: { type: String, required: false, trim: true, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Usuario", schemaUsuario);
