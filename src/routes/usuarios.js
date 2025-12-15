import express from "express";
import {
  login,
  obtenerUsuarios,
  actualizarEstadoUsuario,
  crearUsuario,
  eliminarUsuario,
} from "../controllers/usuariosController.js";

const router = express.Router();

// === RUTAS ===
router.post("/login", login);
router.get("/", obtenerUsuarios);

// Ruta correcta para actualizar estado
router.put("/:id/estado", actualizarEstadoUsuario);

router.post("/", crearUsuario);
router.delete("/:id", eliminarUsuario);

export default router;


