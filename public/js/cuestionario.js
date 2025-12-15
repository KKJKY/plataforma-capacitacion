// Datos globales
let cuestionario = null;
let indice = 0;
let respuestas = {}; // { pregunta_id: opcion_id }

// Obtener parámetros de la URL
const params = new URLSearchParams(window.location.search);
const idCuestionario = params.get("id");
const usuario = JSON.parse(localStorage.getItem("user"));

// -------- Cargar Cuestionario --------
async function cargarCuestionario() {
  const res = await fetch(`/api/cuestionarios/${idCuestionario}`);
  const data = await res.json();

  cuestionario = data;
  document.getElementById("titulo-cuestionario").textContent = data.titulo;

  mostrarPregunta();
  actualizarProgreso();
}

// -------- Mostrar Pregunta --------
function mostrarPregunta() {
  const p = cuestionario.preguntas[indice];
  document.getElementById("pregunta-texto").textContent = p.enunciado;

  const contenedor = document.getElementById("opciones-container");
  contenedor.innerHTML = "";

  p.opciones.forEach(op => {
    contenedor.innerHTML += `
      <label class="opcion">
        <input type="radio" 
               name="respuesta" 
               value="${op.id}" 
               ${respuestas[p.id] === op.id ? "checked" : ""}>
        ${op.texto}
      </label>
    `;
  });

  // Botones
  document.getElementById("btn-anterior").disabled = indice === 0;

  if (indice === cuestionario.preguntas.length - 1) {
    document.getElementById("btn-siguiente").style.display = "none";
    document.getElementById("btn-finalizar").style.display = "block";
  } else {
    document.getElementById("btn-siguiente").style.display = "block";
    document.getElementById("btn-finalizar").style.display = "none";
  }

  actualizarProgreso();
}

// -------- Guardar respuesta seleccionada --------
function guardarRespuesta() {
  const p = cuestionario.preguntas[indice];
  const seleccionado = document.querySelector("input[name='respuesta']:checked");

  if (seleccionado) {
    respuestas[p.id] = parseInt(seleccionado.value);
  }
}

// -------- Barra de progreso --------
function actualizarProgreso() {
  const total = cuestionario.preguntas.length;
  const porcentaje = ((indice + 1) / total) * 100;

  document.getElementById("progress-fill").style.width = porcentaje + "%";
}

// -------- Botones navega --------
document.getElementById("btn-siguiente").addEventListener("click", () => {
  guardarRespuesta();

  if (indice < cuestionario.preguntas.length - 1) {
    indice++;
    mostrarPregunta();
  }
});

document.getElementById("btn-anterior").addEventListener("click", () => {
  guardarRespuesta();

  if (indice > 0) {
    indice--;
    mostrarPregunta();
  }
});

// Enviar respuestas
document.getElementById("btn-finalizar").addEventListener("click", async () => {
  guardarRespuesta();

  const respuestasArray = Object.keys(respuestas).map(pregunta_id => ({
    pregunta_id: parseInt(pregunta_id),
    opcion_id: respuestas[pregunta_id]
  }));

  const body = {
    usuario_id: usuario.id,
    cuestionario_id: parseInt(idCuestionario),
    respuestas: respuestasArray
  };

  const res = await fetch(`/api/cuestionarios/${idCuestionario}/resolver`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const resultado = await res.json();

  alert(`
    ¡Examen Finalizado!
    Puntaje: ${resultado.puntaje}%
    Correctas: ${resultado.correctas}
    Incorrectas: ${resultado.incorrectas}
  `);

  window.location.href = "dashboard.html";
});

// Inicializar
cargarCuestionario();
