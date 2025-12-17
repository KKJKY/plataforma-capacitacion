import db from "../db.js";
import bcrypt from "bcryptjs";

// === LOGIN ===
export const login = async (req, res) => {
  const { correo, contrasena } = req.body;

  if (!correo || !contrasena) {
    return res.status(400).json({ error: "Correo y contraseña son requeridos" });
  }

  try {
    const [rows] = await db.query("SELECT * FROM usuarios WHERE correo = ?", [correo]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const user = rows[0];

    //  Verificar si el usuario está activo
    if (user.estado && user.estado.toLowerCase() !== "activo") {
      return res.status(403).json({ error: "Usuario inactivo. Contacta al administrador." });
    }

    // Validar contraseña
    const esValida = await bcrypt.compare(contrasena, user.contrasena);
    // Si usas hash -> const esValida = await bcrypt.compare(contrasena, user.contrasena);

    if (!esValida) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    // Inicio de sesión correcto
    res.json({
      message: "Inicio de sesión exitoso",
      user: {
        id: user.id,
        nombre: user.nombre,
        correo: user.correo,
        rol: user.rol,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};


// === OBTENER TODOS LOS USUARIOS ===
export const obtenerUsuarios = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id, nombre, correo, rol, estado FROM usuarios");
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
};

// === CAMBIAR ESTADO (activo / inactivo) ===
export const actualizarEstadoUsuario = async (req, res) => {
  const { id } = req.params;
  let { estado } = req.body;

  if (!id || !estado) {
    return res.status(400).json({ error: "Datos insuficientes" });
  }

  // Normaliza a minúsculas (para evitar errores por mayúsculas)
  estado = estado.toLowerCase();

  try {
    const [resultado] = await db.query("UPDATE usuarios SET estado = ? WHERE id = ?", [estado, id]);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ message: `Estado actualizado correctamente a ${estado}`, estado });
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    res.status(500).json({ error: "Error interno al actualizar estado" });
  }
};


// === CREAR NUEVO USUARIO ===
export const crearUsuario = async (req, res) => {
  const { nombre, correo, rol, contrasena, estado } = req.body;

  if (!nombre || !correo || !rol) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  try {
    const pass = contrasena || "123456";
    const estadoNormalizado = (estado || "activo").toLowerCase();

    await db.query(
      "INSERT INTO usuarios (nombre, correo, contrasena, rol, estado) VALUES (?, ?, ?, ?, ?)",
      [nombre, correo, pass, rol, estadoNormalizado]
    );

    res.status(201).json({ message: "Usuario creado correctamente" });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    res.status(500).json({ error: "Error interno al crear usuario" });
  }
};


// === ELIMINAR USUARIO ===
export const eliminarUsuario = async (req, res) => {
  const { id } = req.params;

  try {
    const [resultado] = await db.query("DELETE FROM usuarios WHERE id = ?", [id]);
    if (resultado.affectedRows === 0)
      return res.status(404).json({ error: "Usuario no encontrado" });

    res.json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    res.status(500).json({ error: "Error interno al eliminar usuario" });
  }
};

