const API_URL = "/api/cursos";

async function obtenerCursos() {
  const res = await fetch(API_URL);
  const data = await res.json();
  const tabla = document.getElementById("tabla-cursos");
  tabla.innerHTML = "";

  data.forEach(curso => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${curso.id}</td>
      <td>${curso.titulo}</td>
      <td>${curso.descripcion}</td>
      <td>${curso.duracion}</td>
      <td>${curso.estado}</td>
      <td>
        <button onclick="eliminarCurso(${curso.id})">🗑️ Eliminar</button>
      </td>
    `;
    tabla.appendChild(fila);
  });
}

async function crearCurso() {
  const titulo = document.getElementById("titulo").value;
  const descripcion = document.getElementById("descripcion").value;
  const duracion = document.getElementById("duracion").value;
  const estado = document.getElementById("estado").value; 

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ titulo, descripcion, duracion, estado })
  });

  if (res.ok) {
    alert(" Curso creado correctamente");
    obtenerCursos();
  } else {
    alert(" Error al crear el curso");
  }
}

async function eliminarCurso(id) {
  if (confirm("¿Seguro que deseas eliminar este curso?")) {
    const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (res.ok) {
      alert(" Curso eliminado");
      obtenerCursos();
    } else {
      alert(" Error al eliminar el curso");
    }
  }
}

obtenerCursos();
