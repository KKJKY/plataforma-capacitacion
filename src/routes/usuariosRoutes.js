import express from "express";
import {
  login,
  obtenerUsuarios,
  actualizarEstadoUsuario,
  eliminarUsuario,
  crearUsuario
} from "../controllers/usuariosController.js";

const router = express.Router();

// Login
router.post("/login", login);

// CRUD Usuarios
router.get("/", obtenerUsuarios);
router.post("/", crearUsuario);
router.put("/:id", actualizarEstadoUsuario);
router.delete("/:id", eliminarUsuario);

export default router;


