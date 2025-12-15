import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cursosRoutes from "./routes/cursosRoutes.js";
import usuariosRoutes from "./routes/usuarios.js";
import materialesRoutes from "./routes/materialesRoutes.js";
import cuestionariosRoutes from "./routes/cuestionariosRoutes.js";
import categoriasRoutes from "./routes/categoriasRoutes.js";
import db from "./db.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

//  Rutas API
app.use("/api/materiales", materialesRoutes);
app.use("/api/usuarios", usuariosRoutes);

app.use("/api/categorias", categoriasRoutes);


//  Servir frontend (carpeta public)
app.use(express.static("public"));

//  Cursos
app.use("/api/cursos", cursosRoutes);

app.use("/api/cuestionarios", cuestionariosRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
   if (process.env.NODE_ENV === "production") {
  console.log(`Servidor en producción (Railway) - puerto ${PORT}`);
  } else {
    console.log(`Servidor local en http://localhost:${PORT}`);
  }
  console.log("Conectado a MySQL en Docker correctamente");
});


