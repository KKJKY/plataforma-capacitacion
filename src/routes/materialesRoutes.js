import express from "express";
import { subirMaterial, obtenerMateriales, eliminarMaterial, upload, obtenerMaterialesPorCategoria } from "../controllers/materialesController.js";

const router = express.Router();

//  Obtener todos los materiales
router.get("/", obtenerMateriales);

//  Subir nuevo material
router.post("/subir", upload.single("archivo"), subirMaterial);

//  Eliminar material por ID
router.delete("/:id", eliminarMaterial);

router.get("/categoria/:id", obtenerMaterialesPorCategoria);


export default router;
