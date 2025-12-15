document.addEventListener("DOMContentLoaded", () => {
  // === CONTROL DE SESIÓN ===
  const userRaw = localStorage.getItem("user");
  if (!userRaw) {
    window.location.href = "/";
    return;
  }

  const user = JSON.parse(userRaw);

  // Ocultar tarjeta "Gestión de Usuarios" para practicantes
  const cardUsuarios = document.getElementById("card-usuarios");

  if (cardUsuarios && user.rol !== "administrador") {
      cardUsuarios.style.display = "none";
  }


  // Verificar si el usuario está ACTIVO
  if (user.estado && user.estado.toLowerCase() !== "activo") {
    alert("Tu cuenta está inactiva. Contacta al administrador.");
    localStorage.removeItem("user");
    window.location.href = "/";
    return;
  }

  // Mostrar nombre del usuario
  const userNameEl = document.getElementById("usuario-nombre");
  if (userNameEl) {
    userNameEl.textContent = `${user.nombre} (${user.rol})`;
  }

  // Botón de cerrar sesión
  const logoutBtn = document.getElementById("logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("user");
      window.location.href = "/";
    });
  }

  // === FUNCIÓN GENERAL PARA MOSTRAR SECCIONES ===
  window.mostrarSeccion = function (id) {
    document
      .querySelectorAll(".seccion")
      .forEach((sec) => sec.classList.remove("visible"));
    const seccion = document.getElementById(id);
    if (seccion) seccion.classList.add("visible");
  };

  // === NAVEGACIÓN SIN RECARGA Y SIN # EN LA URL ===
  const sidebarNav = document.querySelector(".sidebar nav");
  if (sidebarNav) {
    sidebarNav.addEventListener("click", (e) => {
      const link = e.target.closest("a[data-seccion]");
      if (!link) return;

      e.preventDefault();
      e.stopPropagation();

      const id = link.getAttribute("data-seccion");

      // Ocultar todas las secciones
      document
        .querySelectorAll(".seccion")
        .forEach((sec) => sec.classList.remove("visible"));

      // Mostrar la sección seleccionada
      const target = document.getElementById(id);
      if (target) target.classList.add("visible");

      // Limpiar hash
      if (location.hash) {
        history.replaceState(null, "", location.pathname);
      }

      // Cargar datos según sección
      if (id === "usuarios") {
        cargarUsuarios();
      } else if (id === "cuestionarios") {
        cargarCuestionarios();
      }
    });
  }

  // === SI ENTRA CON UN HASH (EJ. /dashboard.html#usuarios) ===
  if (location.hash) {
    const id = location.hash.replace("#", "");
    const target = document.getElementById(id);
    if (target) {
      document
        .querySelectorAll(".seccion")
        .forEach((sec) => sec.classList.remove("visible"));
      target.classList.add("visible");
      if (id === "usuarios") cargarUsuarios();
      if (id === "cuestionarios") cargarCuestionarios();
    }
    history.replaceState(null, "", location.pathname);
  }

  // === FORMULARIO DE ADMINISTRADOR (MATERIALES) ===
  const formMaterial = document.getElementById("form-material");
  if (formMaterial) {
    if (user.rol === "administrador") {
      formMaterial.style.display = "block";
    } else {
      const contenedor = document.querySelector("#manuales");
      if (contenedor) {
        const aviso = document.createElement("div");
        aviso.classList.add("alerta-info");
        aviso.innerHTML = `
          <p style="
            background: #e8f4ff;
            color: #0056b3;
            padding: 12px;
            border-radius: 8px;
            font-weight: 500;
            margin-top: 15px;">
              Solo los administradores pueden subir nuevos manuales.
          </p>
        `;
        contenedor.insertBefore(aviso, contenedor.firstChild);
      }
    }
  }

  // === OCULTAR SECCIÓN USUARIOS SI NO ES ADMIN ===
  if (user.rol !== "administrador") {
    const usuarioLink = document.querySelector('[data-seccion="usuarios"]');
    if (usuarioLink) usuarioLink.style.display = "none";
  }

  // === FUNCIÓN PARA CARGAR USUARIOS ===
  async function cargarUsuarios() {
    const contenedor = document.getElementById("lista-usuarios");
    if (!contenedor || user.rol !== "administrador") return;

    contenedor.innerHTML = "<p>Cargando usuarios...</p>";

    try {
      const res = await fetch("/api/usuarios");
      if (!res.ok) throw new Error("Error al obtener usuarios");

      const usuarios = await res.json();
      contenedor.innerHTML = "";

      if (usuarios.length === 0) {
        contenedor.innerHTML = "<p>No hay usuarios registrados.</p>";
        return;
      }

      usuarios.forEach((u) => {
        const card = document.createElement("div");
        card.classList.add("usuario-card");
        card.innerHTML = `
          <div>
            <strong>${u.nombre}</strong>

            <!-- ETIQUETA DE ROL -->
            <span class="rol-tag ${u.rol.toLowerCase()}">
              ${u.rol}
            </span>

            <!-- ETIQUETA DE ESTADO -->
            <span class="estado-tag ${u.estado.toLowerCase() === "activo" ? "activo" : "inactivo"}">
              ${u.estado}
            </span>
          </div>
          
          <div class="acciones">
            <button class="btn-activar" onclick="cambiarEstado('${u.id}', '${u.estado}')">Activar</button>
            <button class="btn-eliminar" onclick="eliminarUsuario('${u.id}')">Eliminar</button>
          </div>
        `;
        contenedor.appendChild(card);
      });
    } catch (error) {
      console.error(error);
      contenedor.innerHTML = `<p style="color:red;">⚠️ ${error.message}</p>`;
    }
  }

  // === CAMBIAR ESTADO USUARIO ===
  window.cambiarEstado = async function (id, estadoActual) {
    const actual = (estadoActual || "").toLowerCase();
    const nuevo = actual === "activo" ? "inactivo" : "activo";

    if (!confirm(`¿Deseas cambiar el estado a ${nuevo}?`)) return;

    try {
      const res = await fetch(`/api/usuarios/${id}/estado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevo }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error al actualizar el estado del usuario");
        return;
      }

      alert(`Estado actualizado a ${data.estado}`);
      cargarUsuarios();
    } catch (error) {
      console.error("Error en el cambio de estado:", error);
      alert("Error de conexión con el servidor");
    }
  };

  // === ELIMINAR USUARIO ===
  window.eliminarUsuario = async function (id) {
    if (!confirm("¿Seguro que deseas eliminar este usuario?")) return;

    try {
      const res = await fetch(`/api/usuarios/${id}`, { method: "DELETE" });
      if (res.ok) {
        alert("Usuario eliminado correctamente");
        cargarUsuarios();
      } else {
        alert("No se pudo eliminar el usuario");
      }
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      alert("Error al conectar con el servidor");
    }
  };

  // === MODAL NUEVO USUARIO ===
  const modalUsuario = document.getElementById("modal-usuario");
  const btnNuevo = document.getElementById("btn-nuevo");
  const cerrarModalUsuario = document.getElementById("cerrar-modal-usuario");

  if (btnNuevo) {
    btnNuevo.addEventListener("click", () => {
      modalUsuario.style.display = "flex";
    });
  }

  if (cerrarModalUsuario) {
    cerrarModalUsuario.addEventListener("click", () => {
      modalUsuario.style.display = "none";
    });
  }

  window.addEventListener("click", (e) => {
    if (e.target === modalUsuario) {
      modalUsuario.style.display = "none";
    }
  });

  // === REGISTRAR NUEVO USUARIO ===
  document
    .getElementById("form-nuevo-usuario")
    ?.addEventListener("submit", async (e) => {
      e.preventDefault();

      const form = e.target;
      const data = {
        nombre: form.nombre.value,
        correo: form.correo.value,
        rol: form.rol.value,
        contrasena: form.contrasena.value,
        estado: form.estado.value,
      };

      try {
        const res = await fetch("/api/usuarios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await res.json();

        if (!res.ok) {
          alert("⚠️ " + (result.error || "Error al crear usuario"));
          return;
        }

        alert("Usuario creado correctamente");

        form.reset();
        modalUsuario.style.display = "none";

        cargarUsuarios();
      } catch (err) {
        console.error(err);
        alert("Error de conexión con el servidor");
      }
    });

  // ================================
  //   MÓDULO DE CUESTIONARIOS
  // ================================

  let cuestionarioActual = null;
  let preguntaActual = null;

  // MODAL NUEVO CUESTIONARIO
  const btnNuevoCuestionario = document.getElementById(
    "btn-nuevo-cuestionario"
  );
  const modalCuestionario = document.getElementById("modal-cuestionario");
  const cerrarModalCuestionario = document.getElementById(
    "cerrar-modal-cuestionario"
  );

  if (btnNuevoCuestionario && user.rol === "administrador") {
    btnNuevoCuestionario.addEventListener("click", () => {
      modalCuestionario.style.display = "flex";
      cargarManualesSelect();
    });
  }

  if (cerrarModalCuestionario) {
    cerrarModalCuestionario.addEventListener("click", () => {
      modalCuestionario.style.display = "none";
    });
  }

  window.addEventListener("click", (e) => {
    if (e.target === modalCuestionario) {
      modalCuestionario.style.display = "none";
    }
  });

  // MODAL NUEVA PREGUNTA
  const btnNuevaPregunta = document.getElementById("btn-nueva-pregunta");
  const modalPregunta = document.getElementById("modal-pregunta");
  const cerrarModalPregunta = document.getElementById("cerrar-modal-pregunta");

  if (btnNuevaPregunta) {
    btnNuevaPregunta.addEventListener("click", () => {
      modalPregunta.style.display = "flex";
    });
  }
  
    // =============================================
  //   NUEVO SISTEMA estilo Google Forms
  //   (Crear pregunta + opciones en un solo modal)
  // =============================================

  const contenedorOpciones = document.getElementById("form-opciones-dinamicas");
  const btnAgregarOpcion = document.getElementById("btn-agregar-opcion");
  const btnGuardarPreguntaCompleta = document.getElementById("btn-guardar-pregunta-completa");

  // Agregar nueva opción dinámica
  if (btnAgregarOpcion) {
    btnAgregarOpcion.addEventListener("click", () => {
      const div = document.createElement("div");
      div.classList.add("opcion-item");

      div.innerHTML = `
        <input type="text" class="texto-opcion" placeholder="Texto de la opción">
        <input type="radio" name="opcion-correcta" class="radio-correcta">
        <button class="btn-eliminar-op" type="button">X</button>
      `;

      div.querySelector(".btn-eliminar-op").onclick = () => div.remove();

      contenedorOpciones.appendChild(div);
    });
  }

  // Guardar pregunta + opciones
  if (btnGuardarPreguntaCompleta) {
    btnGuardarPreguntaCompleta.addEventListener("click", async () => {
      const enunciado = document.getElementById("texto-pregunta").value.trim();
      const lista = document.querySelectorAll(".opcion-item");

      if (!enunciado) {
        alert("Debes escribir una pregunta");
        return;
      }

      let opciones = [];
      let correctaExiste = false;

      lista.forEach((op, idx) => {
        const texto = op.querySelector(".texto-opcion").value.trim();
        const esCorrecta = op.querySelector(".radio-correcta").checked;

        if (texto !== "") {
          opciones.push({
            texto,
            correcta: esCorrecta ? 1 : 0,
          });

          if (esCorrecta) correctaExiste = true;
        }
      });

      if (opciones.length < 2) {
        alert("Debes agregar al menos 2 opciones");
        return;
      }

      if (!correctaExiste) {
        alert("Selecciona una opción correcta");
        return;
      }

      // Enviar al backend (crear pregunta completa)
      const res = await fetch(`/api/cuestionarios/${cuestionarioActual}/preguntas-completa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enunciado,
          opciones
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error);
        return;
      }

      alert("Pregunta creada correctamente ❤️");

      // Limpiar formulario
      document.getElementById("texto-pregunta").value = "";
      contenedorOpciones.innerHTML = "";

      modalPregunta.style.display = "none";
      cargarPreguntas(cuestionarioActual);
    });
  }


  if (cerrarModalPregunta) {
    cerrarModalPregunta.addEventListener("click", () => {
      modalPregunta.style.display = "none";
    });
  }

  window.addEventListener("click", (e) => {
    if (e.target === modalPregunta) {
      modalPregunta.style.display = "none";
    }
  });

  // MODAL NUEVA OPCIÓN
  const modalOpcion = document.getElementById("modal-opcion");
  const cerrarModalOpcion = document.getElementById("cerrar-modal-opcion");

  if (cerrarModalOpcion) {
    cerrarModalOpcion.addEventListener("click", () => {
      modalOpcion.style.display = "none";
    });
  }

  window.addEventListener("click", (e) => {
    if (e.target === modalOpcion) {
      modalOpcion.style.display = "none";
    }
  });

  // CREAR CUESTIONARIO
  document
    .getElementById("form-nuevo-cuestionario")
    ?.addEventListener("submit", async (e) => {
      e.preventDefault();

      const form = e.target;
      const datos = {
        titulo: form.titulo.value,
        descripcion: form.descripcion.value,
        manual_id: form.manual_id.value,
      };

      const res = await fetch("/api/cuestionarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });

      const data = await res.json();

      if (!res.ok) {
        alert("Error: " + data.error);
        return;
      }

      alert("Cuestionario creado correctamente");
      modalCuestionario.style.display = "none";
      form.reset();
      cargarCuestionarios();
    });

      // CREAR PREGUNTA + OPCIONES (estilo Google Forms)
  document
    .getElementById("form-nueva-pregunta")
    ?.addEventListener("submit", async (e) => {
      e.preventDefault();

      const form = e.target;
      const enunciado = form.enunciado.value.trim();

      if (!enunciado) {
        alert("El enunciado es obligatorio");
        return;
      }

      const filas = contOpciones.querySelectorAll(".opcion-row");
      if (filas.length < 2) {
        alert("Debes agregar al menos 2 opciones");
        return;
      }

      const opciones = [];
      let indiceCorrecta = -1;

      filas.forEach((fila, index) => {
        const txt = fila.querySelector(".texto-opcion").value.trim();
        const radio = fila.querySelector(".marcar-correcta");

        if (txt) {
          opciones.push({
            texto: txt,
            correcta: radio.checked ? 1 : 0
          });

          if (radio.checked) indiceCorrecta = index;
        }
      });

      if (opciones.length < 2) {
        alert("Las opciones deben tener texto (al menos 2).");
        return;
      }

      if (indiceCorrecta === -1) {
        alert("Debes marcar UNA opción como correcta.");
        return;
      }

      const res = await fetch(
        `/api/cuestionarios/${cuestionarioActual}/preguntas-completa`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enunciado, opciones }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error al crear la pregunta");
        return;
      }

      alert("Pregunta creada correctamente");
      modalPregunta.style.display = "none";
      form.reset();
      contOpciones.innerHTML = "";
      cargarPreguntas(cuestionarioActual);
    });


  // CREAR OPCIÓN
  document
    .getElementById("form-nueva-opcion")
    ?.addEventListener("submit", async (e) => {
      e.preventDefault();

      const form = e.target;
      const data = {
        texto: form.texto.value,
        correcta: form.correcta.value,
      };

      const res = await fetch(
        `/api/cuestionarios/pregunta/${preguntaActual}/opciones`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      const result = await res.json();

      if (!res.ok) {
        alert(result.error);
        return;
      }

      alert("Opción creada correctamente");
      modalOpcion.style.display = "none";
      form.reset();
      cargarPreguntas(cuestionarioActual);
    });

  // CARGAR USUARIOS AL INICIO (SI ES ADMIN)
  if (user.rol === "administrador") {
    cargarUsuarios();
  }

  // CARGAR MANUALES PARA EL SELECT DE CUESTIONARIOS
  async function cargarManualesSelect() {
    const select = document.getElementById("manuales-select");
    if (!select) return;

    const res = await fetch("/api/materiales");
    const data = await res.json();

    select.innerHTML = "<option value=''>Seleccionar manual...</option>";

    data.forEach((m) => {
      if (m.tipo === "documento") {
        select.innerHTML += `<option value="${m.id}">${m.titulo}</option>`;
      }
    });
  }

    document.getElementById("volver-manuales").onclick = () => {
        mostrarSeccion("manuales");
    };




  // CARGAR CUESTIONARIOS EN LA LISTA PRINCIPAL
  async function cargarCuestionarios() {
    const contenedor = document.getElementById(
      "lista-categorias-cuestionarios"
    );
    if (!contenedor) return;

    contenedor.innerHTML = "<p>Cargando cuestionarios...</p>";

    const res = await fetch("/api/cuestionarios");
    const data = await res.json();

    contenedor.innerHTML = "";

    if (!data.cuestionarios || data.cuestionarios.length === 0) {
      contenedor.innerHTML = "<p>No hay cuestionarios creados.</p>";
      return;
    }

    data.cuestionarios.forEach((c) => {
  const card = document.createElement("div");
  card.classList.add("cuest-card");
      let botones = `
          <button class="btn-iniciar" onclick="window.location.href='cuestionario.html?id=${c.id}'">
            Iniciar
          </button>
      `;

      if (user.rol === "administrador") {
        botones = `
          <button class="btn-editar" onclick="editarCuestionario(${c.id}, '${c.titulo.replace(/'/g, "\\'")}', '${(c.descripcion || "").replace(/'/g, "\\'")}')">
            Editar
          </button>

          <button class="btn-eliminar" onclick="eliminarCuestionario(${c.id})">
            Eliminar
          </button>

          <button class="btn-cuestionario" onclick="abrirCuestionario(${c.id})">
            Administrar
          </button>

          <button class="btn-iniciar" onclick="window.location.href='cuestionario.html?id=${c.id}'">
            Iniciar
          </button>
        `;
      }

      card.innerHTML = `
        <h3>${c.titulo}</h3>
        <p>${c.descripcion || ""}</p>
        <div class="acciones-cuestionario">
          ${botones}
        </div>
      `;

      contenedor.appendChild(card);
    });

  }

  // ABRIR CUESTIONARIO EN MODO ADMIN
  window.abrirCuestionario = async function (id) {
    cuestionarioActual = id;
    mostrarSeccion("admin-cuestionario");

    const tituloEl = document.getElementById("admin-cuestionario-titulo");

    // Obtener el cuestionario sólo para mostrar el título
    const res = await fetch("/api/cuestionarios");
    const data = await res.json();
    const cuest = data.cuestionarios.find((c) => c.id === id);

    if (cuest) {
      tituloEl.textContent = "Administrar: " + cuest.titulo;
    } else {
      tituloEl.textContent = "Administrar Cuestionario";
    }

    cargarPreguntas(id);
  };

  // CARGAR PREGUNTAS DE UN CUESTIONARIO
  async function cargarPreguntas(cuestionario_id) {
    const contenedor = document.getElementById("lista-preguntas");
    if (!contenedor) return;

    contenedor.innerHTML = "<p>Cargando preguntas...</p>";

    const res = await fetch(`/api/cuestionarios/${cuestionario_id}/preguntas`);
    const data = await res.json();

    contenedor.innerHTML = "";

    if (!data.preguntas || data.preguntas.length === 0) {
      contenedor.innerHTML = "<p>No hay preguntas creadas.</p>";
      return;
    }

    data.preguntas.forEach((p) => {
      const div = document.createElement("div");
      div.classList.add("pregunta-card");

      div.innerHTML = `
        <div class="pregunta-header">
          <h3>${p.enunciado}</h3>

          <div class="acciones-pregunta">
            <button class="btn btn-azul" onclick="editarPregunta(${p.id}, '${p.enunciado.replace(/'/g, "\\'")}')">
              Editar
            </button>

            <button class="btn btn-rojo" onclick="eliminarPregunta(${p.id})">
              Eliminar
            </button>
          </div>
        </div>

        <div id="opciones-${p.id}" class="opciones-list">
          <p>Cargando opciones...</p>
        </div>

        <button class="btn btn-admin" onclick="abrirModalOpcion(${p.id})">
          + Agregar Opción
        </button>
        <hr>
      `;

      contenedor.appendChild(div);

      cargarOpciones(p.id);
    });
  }

  //EDITAR CUESTIONARIO
    window.editarCuestionario = async function(id, tituloActual, descripcionActual) {
    const nuevoTitulo = prompt("Editar título:", tituloActual);
    if (!nuevoTitulo) return;

    const nuevaDescripcion = prompt("Editar descripción:", descripcionActual || "");
    
    await fetch(`/api/cuestionarios/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo: nuevoTitulo,
        descripcion: nuevaDescripcion
      })
    });

    alert("Cuestionario actualizado");
    cargarCuestionarios();
  };

  //ELIMINAR CUESTIONARIO
    window.eliminarCuestionario = async function(id) {
    if (!confirm("¿Seguro que deseas eliminar este cuestionario COMPLETO?")) return;

    await fetch(`/api/cuestionarios/${id}`, {
      method: "DELETE"
    });

    alert("Cuestionario eliminado correctamente");
    cargarCuestionarios();
  };

  // CARGAR OPCIONES DE UNA PREGUNTA
    async function cargarOpciones(pregunta_id) {
    const contenedor = document.getElementById(`opciones-${pregunta_id}`);
    if (!contenedor) return;

    const res = await fetch(`/api/cuestionarios/pregunta/${pregunta_id}/opciones`);
    const data = await res.json();

    contenedor.innerHTML = "";

    if (!data.opciones || data.opciones.length === 0) {
      contenedor.innerHTML = "<p>No hay opciones aún.</p>";
      return;
    }

    data.opciones.forEach((o) => {
      const item = document.createElement("div");
      item.classList.add("opcion-item");

      item.innerHTML = `
        <span>${o.texto}</span>
        ${o.correcta ? "<span class='correcta-tag'>Correcta</span>" : ""}

        <div class="acciones-opcion">
          <button class="btn btn-azul" onclick="editarOpcion(${o.id}, '${o.texto.replace(/'/g, "\\'")}', ${pregunta_id})">
            Editar
          </button>

          <button class="btn btn-rojo" onclick="eliminarOpcion(${o.id}, ${pregunta_id})">
            Eliminar
          </button>
        </div>
      `;

      contenedor.appendChild(item);
    });
  }


  // ABRIR MODAL DE OPCIÓN
  window.abrirModalOpcion = function (pregunta_id) {
    preguntaActual = pregunta_id;
    modalOpcion.style.display = "flex";
  };

  //EDITAR PREGUNTA
  async function editarPregunta(id, enunciadoActual) {
    const nuevo = prompt("Editar pregunta:", enunciadoActual);
    if (!nuevo) return;

    await fetch(`/api/cuestionarios/pregunta/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enunciado: nuevo })
    });

    cargarPreguntas(cuestionarioActual);
  }

//ELIMINAR PREGUNTA
  async function eliminarPregunta(id) {
    if (!confirm("¿Eliminar esta pregunta?")) return;

    await fetch(`/api/cuestionarios/pregunta/${id}`, {
      method: "DELETE"
    });

    cargarPreguntas(cuestionarioActual);
  }

  // === EDITAR CUESTIONARIO GENERAL ===
window.editarCuestionario = async function (id, tituloActual, descripcionActual) {
  const nuevoTitulo = prompt("Editar título del cuestionario:", tituloActual);
  if (!nuevoTitulo) return;

  const nuevaDescripcion = prompt("Editar descripción:", descripcionActual);
  if (nuevaDescripcion === null) return;

  await fetch(`/api/cuestionarios/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      titulo: nuevoTitulo,
      descripcion: nuevaDescripcion
    })
  });

  cargarCuestionarios();
};

// === ELIMINAR CUESTIONARIO COMPLETO ===
window.eliminarCuestionario = async function (id) {
  if (!confirm("¿Eliminar cuestionario COMPLETO? Se borrarán preguntas, opciones, intentos y respuestas.")) return;

  await fetch(`/api/cuestionarios/${id}`, {
    method: "DELETE"
  });

  cargarCuestionarios();
};


//EDITAR OPCION
  async function editarOpcion(id, textoActual, preguntaId) {
    const nuevo = prompt("Editar opción:", textoActual);
    if (!nuevo) return;

    await fetch(`/api/cuestionarios/opcion/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto: nuevo })
    });

    cargarOpciones(preguntaId);
  }

//ELIMINAR OPCION
  async function eliminarOpcion(id, preguntaId) {
    if (!confirm("¿Eliminar esta opción?")) return;

    await fetch(`/api/cuestionarios/opcion/${id}`, {
      method: "DELETE"
    });

    cargarOpciones(preguntaId);
  }

  window.abrirModalMaterial = function (categoriaId) {
    document.getElementById("categoria_id").value = categoriaId;
    document.getElementById("modal-subida").style.display = "flex";
  };


    // HACERLAS GLOBALES PARA LA INTERFAZ
  window.editarPregunta = editarPregunta;
  window.eliminarPregunta = eliminarPregunta;
  window.editarOpcion = editarOpcion;
  window.eliminarOpcion = eliminarOpcion;

});
