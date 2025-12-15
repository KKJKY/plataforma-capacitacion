import db from "../db.js";

//  Obtener todos los cursos
export const obtenerCursos = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM cursos");
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener los cursos:", error);
    res.status(500).json({ error: "Error al obtener los cursos" });
  }
};

//  Crear un nuevo curso
export const crearCurso = async (req, res) => {
  try {
    const { titulo, descripcion, duracion, estado } = req.body;
    const [result] = await db.query(
      "INSERT INTO cursos (titulo, descripcion, duracion, estado) VALUES (?, ?, ?, ?)",
      [titulo, descripcion, duracion, estado]
    );
    res.json({ message: "Curso creado exitosamente", id: result.insertId });
  } catch (error) {
    console.error("Error al crear curso:", error);
    res.status(500).json({ error: "Error al crear el curso" });
  }
};

//  Actualizar un curso
export const actualizarCurso = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, duracion, estado } = req.body;
    const [result] = await db.query(
      "UPDATE cursos SET titulo=?, descripcion=?, duracion=?, estado=? WHERE id=?",
      [titulo, descripcion, duracion, estado, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Curso no encontrado" });
    }
    res.json({ message: "Curso actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar curso:", error);
    res.status(500).json({ error: "Error al actualizar el curso" });
  }
};

//  Eliminar un curso
export const eliminarCurso = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query("DELETE FROM cursos WHERE id=?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Curso no encontrado" });
    }
    res.json({ message: "Curso eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar curso:", error);
    res.status(500).json({ error: "Error al eliminar el curso" });
  }
};
