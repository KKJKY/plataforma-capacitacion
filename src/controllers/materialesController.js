import db from "../db.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// =========================
// CONFIGURACIÓN DE MULTER
// =========================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

export const upload = multer({ storage });

// =========================
// SUBIR MATERIAL
// =========================
export const subirMaterial = async (req, res) => {
  try {
    const { titulo, descripcion, categoria_id, tipo_archivo } = req.body;
    const archivo = req.file ? `/uploads/${req.file.filename}` : null;
    const tipo = tipo_archivo; // mapeamos al nombre de columna

    if (!titulo || !categoria_id || !archivo) {
      return res.status(400).json({ error: "Faltan datos requeridos" });
    }

    await db.query(
      "INSERT INTO materiales (titulo, descripcion, tipo, categoria_id, url) VALUES (?, ?, ?, ?, ?)",
      [titulo, descripcion || null, tipo || "documento", categoria_id, archivo]
    );

    res.json({ message: "Material subido correctamente", archivo });
  } catch (error) {
    console.error("Error al subir material:", error);
    res.status(500).json({ error: "Error al subir el material" });
  }
};



// =========================
// OBTENER MATERIALES
// =========================
export const obtenerMateriales = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM materiales ORDER BY id DESC");
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener materiales:", error);
    res.status(500).json({ error: "Error al obtener materiales" });
  }
};

// =========================
// OBTENER MATERIALES POR CATEGORÍA
// =========================
export const obtenerMaterialesPorCategoria = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM materiales WHERE categoria_id = ? ORDER BY id DESC",
      [id]
    );

    res.json(rows);
  } catch (error) {
    console.error("Error al obtener materiales por categoría:", error);
    res.status(500).json({ error: "Error al obtener materiales por categoría" });
  }
};



// =========================
// ELIMINAR MATERIAL
// =========================
export const eliminarMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Obtener archivo
    const [rows] = await db.query("SELECT url FROM materiales WHERE id = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Material no encontrado" });
    }

    const filePath = "public" + rows[0].url;

    // 2. Eliminar registro
    await db.query("DELETE FROM materiales WHERE id = ?", [id]);

    // 3. Eliminar archivo físico
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ message: "Material eliminado correctamente" });

  } catch (error) {
    console.error("Error al eliminar material:", error);
    res.status(500).json({ error: "Error al eliminar el material" });
  }
};
