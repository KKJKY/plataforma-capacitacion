import db from "../db.js";

// 1. LISTAR CUESTIONARIOS

export const obtenerCuestionarios = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM cuestionarios ORDER BY id DESC");
    res.json({ total: rows.length, cuestionarios: rows });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener cuestionarios" });
  }
};

// 2. CREAR CUESTIONARIO
export const crearCuestionario = async (req, res) => {
  try {
    const { titulo, descripcion, manual_id } = req.body;

    if (!titulo || !manual_id)
      return res.status(400).json({ error: "titulo y manual_id son obligatorios" });

    const [result] = await db.query(
      "INSERT INTO cuestionarios (titulo, descripcion, manual_id, estado) VALUES (?, ?, ?, 'Activo')",
      [titulo, descripcion || "", manual_id]
    );

    res.status(201).json({
      message: "Cuestionario creado",
      id: result.insertId
    });
  } catch (error) {
    res.status(500).json({ error: "Error al crear cuestionario" });
  }
};

/* =======================================================
   3. OBTENER CUESTIONARIO COMPLETO (preguntas + opciones)
======================================================= */
export const obtenerCuestionario = async (req, res) => {
  const { id } = req.params;

  try {
    // Obtener datos del cuestionario
    const [cuest] = await db.query(
      "SELECT * FROM cuestionarios WHERE id = ?",
      [id]
    );

    if (cuest.length === 0)
      return res.status(404).json({ error: "Cuestionario no encontrado" });

    // Obtener preguntas
    const [preguntas] = await db.query(
      "SELECT * FROM cuestion WHERE cuestionario_id = ?",
      [id]
    );

    // Obtener opciones por pregunta
    for (let p of preguntas) {
      const [opciones] = await db.query(
        "SELECT * FROM opciones WHERE pregunta_id = ?",
        [p.id]
      );
      p.opciones = opciones;
    }

    res.json({
      id: cuest[0].id,
      titulo: cuest[0].titulo,
      descripcion: cuest[0].descripcion,
      preguntas
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener cuestionario completo" });
  }
};


/* =======================================================
   4. OBTENER PREGUNTAS DE UN CUESTIONARIO
======================================================= */
export const obtenerPreguntas = async (req, res) => {
  const { id } = req.params;

  try {
    const [preguntas] = await db.query(
      "SELECT * FROM cuestion WHERE cuestionario_id = ?",
      [id]
    );

    res.json({ total: preguntas.length, preguntas });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener preguntas" });
  }
};

/* =======================================================
   5. CREAR PREGUNTA
======================================================= */
export const crearPregunta = async (req, res) => {
  const { id } = req.params;
  const { enunciado } = req.body;

  if (!enunciado)
    return res.status(400).json({ error: "enunciado obligatorio" });

  try {
    const [result] = await db.query(
      "INSERT INTO cuestion (cuestionario_id, enunciado) VALUES (?, ?)",
      [id, enunciado]
    );

    res.status(201).json({ id: result.insertId, enunciado });
  } catch (error) {
    res.status(500).json({ error: "Error al crear pregunta" });
  }
};

// CREAR PREGUNTA + OPCIONES (estilo Google Forms)
export const crearPreguntaConOpciones = async (req, res) => {
  const { id } = req.params; // id = cuestionario_id
  const { enunciado, opciones } = req.body;

  // Validaciones básicas
  if (!enunciado)
    return res.status(400).json({ error: "enunciado obligatorio" });

  if (!Array.isArray(opciones) || opciones.length < 2) {
    return res.status(400).json({ error: "Debe haber al menos 2 opciones" });
  }

  // Debe haber exactamente UNA correcta
  const numCorrectas = opciones.filter(o => Number(o.correcta) === 1).length;
  if (numCorrectas !== 1) {
    return res.status(400).json({
      error: "Debe haber exactamente UNA opción marcada como correcta"
    });
  }

  const conn = db; // usamos la misma conexión simple

  try {
    // 1. Crear la pregunta
    const [resultPregunta] = await conn.query(
      "INSERT INTO cuestion (cuestionario_id, enunciado) VALUES (?, ?)",
      [id, enunciado]
    );
    const preguntaId = resultPregunta.insertId;

    // 2. Insertar opciones
    for (let op of opciones) {
      const texto = op.texto || "";
      const esCorrecta = Number(op.correcta) === 1 ? 1 : 0;

      await conn.query(
        "INSERT INTO opciones (pregunta_id, texto, correcta) VALUES (?, ?, ?)",
        [preguntaId, texto, esCorrecta]
      );
    }

    res.status(201).json({
      message: "Pregunta y opciones creadas correctamente",
      pregunta_id: preguntaId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear pregunta completa" });
  }
};


// 6. OBTENER OPCIONES DE UNA PREGUNTA
 
export const obtenerOpcionesPregunta = async (req, res) => {
  const { id } = req.params;

  try {
    const [opciones] = await db.query(
      "SELECT * FROM opciones WHERE pregunta_id = ?",
      [id]
    );

    res.json({ total: opciones.length, opciones });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener opciones" });
  }
};

/* =======================================================
   7. CREAR OPCIÓN
======================================================= */
export const crearOpcion = async (req, res) => {
  const { id } = req.params; // id = pregunta_id
  const { texto, correcta } = req.body;

  if (!texto)
    return res.status(400).json({ error: "texto obligatorio" });

  const esCorrecta = Number(correcta) === 1 ? 1 : 0;

  try {
    // Si la opción es marcada como correcta, desmarcar las otras
    if (esCorrecta === 1) {
      await db.query(
        "UPDATE opciones SET correcta = 0 WHERE pregunta_id = ?",
        [id]
      );
    }

    const [result] = await db.query(
      "INSERT INTO opciones (pregunta_id, texto, correcta) VALUES (?, ?, ?)",
      [id, texto, esCorrecta]
    );

    res.status(201).json({ id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: "Error al crear opción" });
  }
};


/* =======================================================
   8. GUARDAR RESPUESTAS DEL PRACTICANTE
======================================================= */
export const registrarRespuestas = async (req, res) => {
  const { usuario_id, cuestionario_id, respuestas } = req.body;

  if (!usuario_id || !cuestionario_id || !respuestas?.length)
    return res.status(400).json({ error: "datos incompletos" });

  let correctas = 0;

  for (let r of respuestas) {
    const [opc] = await db.query("SELECT correcta FROM opciones WHERE id = ?", [
      r.opcion_id,
    ]);

    const esCorrecta = opc[0]?.correcta ? 1 : 0;

    if (esCorrecta) correctas++;

    await db.query(
      "INSERT INTO respuestas_usuario (usuario_id, cuestionario_id, pregunta_id, opcion_id, correcta) VALUES (?, ?, ?, ?, ?)",
      [usuario_id, cuestionario_id, r.pregunta_id, r.opcion_id, esCorrecta]
    );
  }

  const total = respuestas.length;

  await db.query(
    "INSERT INTO intentos (usuario_id, cuestionario_id, puntaje) VALUES (?, ?, ?)",
    [usuario_id, cuestionario_id, correctas]
  );

  res.json({
    correctas,
    incorrectas: total - correctas,
    puntaje: correctas
  });
};

// 9. REGISTRAR INTENTO MANUAL 
export const registrarIntento = async (req, res) => {
  const { usuario_id, cuestionario_id, puntaje } = req.body;

  try {
    const [result] = await db.query(
      "INSERT INTO intentos (usuario_id, cuestionario_id, puntaje) VALUES (?, ?, ?)",
      [usuario_id, cuestionario_id, puntaje]
    );

    res.json({ id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: "Error al registrar intento" });
  }
};

// 10. RESOLVER CUESTIONARIO (sin guardar en BD)
export const resolverCuestionario = async (req, res) => {
  const { respuestas } = req.body;

  try {
    let correctas = 0;
    let incorrectas = 0;
    let detalle = [];

    for (let r of respuestas) {
      
      // Obtener la pregunta
      const [preg] = await db.query(
        "SELECT enunciado FROM cuestion WHERE id = ?",
        [r.pregunta_id]
      );

      // Obtener todas las opciones
      const [opciones] = await db.query(
        "SELECT id, texto, correcta FROM opciones WHERE pregunta_id = ?",
        [r.pregunta_id]
      );

      const opcionMarcada = opciones.find(o => o.id === r.opcion_id);
      const opcionCorrecta = opciones.find(o => o.correcta === 1);

      const esCorrecta = opcionMarcada && opcionCorrecta && opcionMarcada.id === opcionCorrecta.id;

      if (esCorrecta) correctas++;
      else incorrectas++;

      detalle.push({
        pregunta: preg[0]?.enunciado || "Pregunta no encontrada",
        respuesta_usuario: opcionMarcada?.texto || "Sin responder",
        respuesta_correcta: opcionCorrecta?.texto || "No definida"
      });
    }

    const puntaje = Math.round((correctas * 100) / respuestas.length);

    res.json({
      puntaje,
      correctas,
      incorrectas,
      detalle
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al resolver cuestionario" });
  }
};

//EDITAR PREGUNTA

export const editarPregunta = async (req, res) => {
  const { id } = req.params;
  const { enunciado } = req.body;

  try {
    await db.query("UPDATE cuestion SET enunciado = ? WHERE id = ?", [
      enunciado,
      id,
    ]);

    res.json({ message: "Pregunta actualizada correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar pregunta" });
  }
};

//ELIMINAR PREGUNTA

export const eliminarPregunta = async (req, res) => {
  const { id } = req.params;

  try {
    // Primero borrar opciones
    await db.query("DELETE FROM opciones WHERE pregunta_id = ?", [id]);

    // Luego borrar la pregunta
    await db.query("DELETE FROM cuestion WHERE id = ?", [id]);

    res.json({ message: "Pregunta eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar pregunta" });
  }
};

//EDITAR OPCION
export const editarOpcion = async (req, res) => {
  const { id } = req.params;
  const { texto, correcta } = req.body;

  const esCorrecta = Number(correcta) === 1 ? 1 : 0;

  try {
    // Obtener pregunta a la que pertenece
    const [preg] = await db.query(
      "SELECT pregunta_id FROM opciones WHERE id = ?",
      [id]
    );

    const preguntaId = preg[0].pregunta_id;

    //  Si se marca como correcta, desmarcar las demás de esa pregunta
    if (esCorrecta === 1) {
      await db.query(
        "UPDATE opciones SET correcta = 0 WHERE pregunta_id = ? AND id != ?",
        [preguntaId, id]
      );
    }

    // Actualizar esta opción
    await db.query(
      "UPDATE opciones SET texto = ?, correcta = ? WHERE id = ?",
      [texto, esCorrecta, id]
    );

    res.json({ message: "Opción actualizada correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar opción" });
  }
};


//ELIMINAR OPCION
export const eliminarOpcion = async (req, res) => {
  const { id } = req.params;

  try {
    await db.query("DELETE FROM opciones WHERE id = ?", [id]);

    res.json({ message: "Opción eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar opción" });
  }
};

//ELIMINAR CUESTIONARIOS COMPLETOS
export const eliminarCuestionario = async (req, res) => {
  const { id } = req.params;

  try {
    await db.query("DELETE FROM respuestas_usuario WHERE cuestionario_id = ?", [id]);
    await db.query("DELETE FROM intentos WHERE cuestionario_id = ?", [id]);

    const [pregs] = await db.query("SELECT id FROM cuestion WHERE cuestionario_id = ?", [id]);

    for (let p of pregs) {
      await db.query("DELETE FROM opciones WHERE pregunta_id = ?", [p.id]);
    }

    await db.query("DELETE FROM cuestion WHERE cuestionario_id = ?", [id]);
    await db.query("DELETE FROM cuestionarios WHERE id = ?", [id]);

    res.json({ message: "Cuestionario eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar cuestionario" });
  }
};

export const editarCuestionario = async (req, res) => {
  const { id } = req.params;
  const { titulo, descripcion } = req.body;

  try {
    await db.query(
      "UPDATE cuestionarios SET titulo = ?, descripcion = ? WHERE id = ?",
      [titulo, descripcion || "", id]
    );

    res.json({ message: "Cuestionario actualizado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar cuestionario" });
  }
};

