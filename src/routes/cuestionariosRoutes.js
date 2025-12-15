import express from "express";
import {
  obtenerCuestionarios,
  crearCuestionario,
  obtenerPreguntas,
  crearPregunta,
  obtenerOpcionesPregunta,
  crearOpcion,
  registrarRespuestas,
  registrarIntento,
  obtenerCuestionario,
  resolverCuestionario,
  editarPregunta,
  eliminarPregunta,
  editarOpcion,
  eliminarOpcion,
  eliminarCuestionario,
  crearPreguntaConOpciones
} from "../controllers/cuestionariosController.js";

const router = express.Router();

// CUESTIONARIOS
router.get("/", obtenerCuestionarios);
router.post("/", crearCuestionario);
router.get("/:id", obtenerCuestionario);
router.post("/:id/resolver", resolverCuestionario);

// PREGUNTAS
router.get("/:id/preguntas", obtenerPreguntas);
router.post("/:id/preguntas", crearPregunta);
router.put("/pregunta/:id", editarPregunta);
router.delete("/pregunta/:id", eliminarPregunta);

// PREGUNTA COMPLETA (enunciado + opciones)
router.post("/:id/preguntas-completa", crearPreguntaConOpciones);

// OPCIONES
router.get("/pregunta/:id/opciones", obtenerOpcionesPregunta);
router.post("/pregunta/:id/opciones", crearOpcion);
router.put("/opcion/:id", editarOpcion);
router.delete("/opcion/:id", eliminarOpcion);

// RESPUESTAS
router.post("/responder", registrarRespuestas);

// CUESTIONARIO COMPLETO
router.delete("/:id", eliminarCuestionario);

// NOTA FINAL
router.post("/intento", registrarIntento);

export default router;



