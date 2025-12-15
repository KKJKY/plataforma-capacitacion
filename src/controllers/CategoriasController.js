import db from "../db.js";

// Obtener todas las categorías
export const obtenerCategorias = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM categorias ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener categorías" });
  }
};

// Crear categoría
export const crearCategoria = async (req, res) => {
  const { nombre } = req.body;

  if (!nombre)
    return res.status(400).json({ error: "El nombre es obligatorio" });

  try {
    const [result] = await db.query(
      "INSERT INTO categorias (nombre) VALUES (?)",
      [nombre]
    );
    res.json({ id: result.insertId, nombre });
  } catch (err) {
    res.status(500).json({ error: "Error al crear categoría" });
  }
};

// Editar categoría
export const actualizarCategoria = async (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;

  try {
    await db.query("UPDATE categorias SET nombre = ? WHERE id = ?", [
      nombre,
      id
    ]);

    res.json({ message: "Categoría actualizada" });
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar categoría" });
  }
};

// Eliminar categoría
export const eliminarCategoria = async (req, res) => {
  const { id } = req.params;

  try {
    await db.query("DELETE FROM categorias WHERE id = ?", [id]);
    res.json({ message: "Categoría eliminada" });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar categoría" });
  }
};
