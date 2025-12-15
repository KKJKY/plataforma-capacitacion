import express from "express";
import {
  obtenerCursos,
  crearCurso,
  actualizarCurso,
  eliminarCurso
} from "../controllers/cursosController.js";

const router = express.Router();

router.get("/", obtenerCursos);
router.post("/", crearCurso);
router.put("/:id", actualizarCurso);
router.delete("/:id", eliminarCurso);

export default router;
