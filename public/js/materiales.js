
let categoriaActualId = null;
let categoriaActualNombre = null;


//      SISTEMA DE MATERIALES CON CATEGORÍAS (OPCIÓN A)

document.addEventListener("DOMContentLoaded", async () => {

  const user = JSON.parse(localStorage.getItem("user")) || { rol: "practicante" };
  // OCULTAR BOTÓN GENERAL "SUBIR MATERIAL" SI NO ES ADMIN
  const btnGeneral = document.getElementById("btn-abrir-modal");
  if (user.rol !== "administrador") {
      if (btnGeneral) btnGeneral.style.display = "none";
  }

  // Contenedor principal de categorías
  const contenedorCategorias = document.getElementById("lista-categorias");
  if (!contenedorCategorias) return;

  // Cargar categorías al abrir la sección
  await cargarCategorias();

  // Activar modal SOLO si el usuario es ADMIN
  if (user.rol === "administrador") activarModalCategoria();

  if (user.rol !== "administrador") {
  const btn = document.getElementById("btn-abrir-modal");
  if (btn) btn.style.display = "none";
  }

});

// Botón general para abrir el modal de subida

document.addEventListener("DOMContentLoaded", async () => {
  const user = JSON.parse(localStorage.getItem("user")) || { rol: "practicante" };

  // Ocultar botón "Subir material" para practicante
  const btnGeneral = document.getElementById("btn-abrir-modal");
  if (user.rol !== "administrador") {
    if (btnGeneral) btnGeneral.style.display = "none";
  } else {
    if (btnGeneral) {
      btnGeneral.addEventListener("click", () => {
        abrirModalSubida();   // <- AQUÍ se abre modal y se configura el submit
      });
    }
  }

  const contenedorCategorias = document.getElementById("lista-categorias");
  if (!contenedorCategorias) return;

  await cargarCategorias();
  if (user.rol === "administrador") activarModalCategoria();

  // guarda el rol global si quieres
  window.__ROL_ACTUAL__ = user.rol;
});


//                 CARGAR CATEGORÍAS

async function cargarCategorias() {
  const cont = document.getElementById("lista-categorias");
  cont.innerHTML = "<p>Cargando categorías...</p>";

  try {
    const res = await fetch("/api/categorias");
    const categorias = await res.json();

    cont.innerHTML = "";

    const user = JSON.parse(localStorage.getItem("user")) || { rol: "practicante" };
    const rol = user.rol;

    categorias.forEach(cat => {
      const card = document.createElement("div");
      card.classList.add("categoria-card");

      card.innerHTML = `
        <h3>${cat.nombre}</h3>

        <div class="acciones-cat">
          <button class="btn-ver"
            onclick="mostrarCategoria(${cat.id}, '${cat.nombre}')">
            Ver materiales
          </button>

          ${
            rol === "administrador"
              ? `<button class="btn-eliminar"
                   onclick="eliminarCategoria(${cat.id})">
                   Eliminar categoría
                 </button>`
              : ""
          }
        </div>
      `;

      cont.appendChild(card);
    });

  } catch (err) {
    console.error(err);
    cont.innerHTML = "<p>Error al cargar categorías.</p>";
  }
}


// =============================
//  MOSTRAR MATERIALES DE UNA CATEGORÍA
// =============================
window.mostrarCategoria = async function (categoriaId, nombreCategoria) {

    categoriaActualId = categoriaId;
    categoriaActualNombre = nombreCategoria;

    mostrarSeccion("categoria-detalle");
    document.getElementById("categoria-titulo").textContent = nombreCategoria;

    const contenedor = document.getElementById("materiales-lista");
    contenedor.innerHTML = "<p>Cargando materiales...</p>";

    try {
        const res = await fetch(`/api/materiales/categoria/${categoriaId}`);
        const materiales = await res.json();

        if (!materiales.length) {
            contenedor.innerHTML = "<p>No hay materiales en esta categoría.</p>";
            return;
        }

        contenedor.innerHTML = "";

        materiales.forEach(m => {
            const card = document.createElement("div");
            card.classList.add("material-card");

            let preview = "";

            switch (m.tipo) {
              case "pdf":
                preview = `
                  <div class="preview-container pdf">
                    <iframe src="${m.url}" loading="lazy"></iframe>
                  </div>
                `;
                break;

              case "video":
                preview = `
                  <div class="preview-container video">
                    <video controls preload="metadata">
                      <source src="${m.url}">
                    </video>
                  </div>
                `;
                break;

              case "imagen":
                preview = `
                  <div class="preview-container imagen">
                    <img src="${m.url}" alt="${m.titulo}">
                  </div>
                `;
                break;

              default:
                preview = `
                  <div class="preview-container archivo">
                    <p>Archivo disponible</p>
                  </div>
                `;
            }


            const user = JSON.parse(localStorage.getItem("user")) || { rol: "practicante" };

            card.innerHTML = `
                <h3>${m.titulo}</h3>
                <p>Tipo: ${m.tipo}</p>

                ${preview}

                <div class="acciones-material">
                    <a href="${m.url}" download class="btn-descargar">⬇ Descargar</a>

                    ${user.rol === "administrador" ? `
                      <button class="btn-eliminar-material" onclick="eliminarMaterial(${m.id})">
                        Eliminar
                      </button>
                    ` : ""}
                </div>
            `;


            contenedor.appendChild(card);
        });

    } catch (err) {
        contenedor.innerHTML = "<p>Error al cargar materiales.</p>";
    }
};



//                CREAR CATEGIRIA
async function crearCategoria(nombre) {
  try {
    const res = await fetch("/api/categorias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre })
    });

    if (!res.ok) {
      console.error("Error al crear categoría inicial");
    }
  } catch (e) {
    console.error("Error creando categoría por defecto:", e);
  }
}

//          CARGAR CATEGORIA EN SELECCION
async function cargarCategoriasEnSelect() {
  const select = document.getElementById("categoria_id");
  select.innerHTML = `<option value="">Seleccione una categoría...</option>`;

  try {
    const res = await fetch("/api/categorias");
    const categorias = await res.json();

    categorias.forEach(cat => {
      const op = document.createElement("option");
      op.value = cat.id;
      op.textContent = cat.nombre;
      select.appendChild(op);
    });

  } catch (error) {
    console.error("Error cargando lista en modal:", error);
  }
}

async function cargarMaterialesPorCategoria(id) {
    const cont = document.getElementById("materiales-lista");
    cont.innerHTML = "<p>Cargando...</p>";

    try {
        const res = await fetch(`/api/materiales/categoria/${id}`);
        const lista = await res.json();

        if (lista.length === 0) {
            cont.innerHTML = "<p>No hay materiales en esta categoría.</p>";
            return;
        }

        cont.innerHTML = "";

        lista.forEach(m => {
            const div = document.createElement("div");
            div.classList.add("material-card");

            div.innerHTML = `
                <h3>${m.titulo}</h3>
                <p><strong>Tipo:</strong> ${m.tipo || 'desconocido'}</p>

                ${getVistaMaterial(m)}

                <a href="${m.url}" download class="btn-descargar">⬇ Descargar</a>
            `;

            cont.appendChild(div);
        });

    } catch (error) {
        console.error(error);
        cont.innerHTML = "<p>Error cargando materiales.</p>";
    }
}


//               VER MATERIALES DE CATEGORÍA

async function verMateriales(categoria_id) {
  const cont = document.getElementById(`materiales-cat-${categoria_id}`);
  cont.innerHTML = "<p>Cargando materiales...</p>";

  try {
    const res = await fetch(`/api/materiales/categoria/${categoria_id}`);
    const lista = await res.json();

    cont.innerHTML = "";

    if (lista.length === 0) {
      cont.innerHTML = "<p>No hay materiales en esta categoría.</p>";
      return;
    }

    lista.forEach(m => {
      const item = document.createElement("div");
      item.classList.add("material-item");

      item.innerHTML = `
        <strong>${m.titulo}</strong>
        <p>${m.descripcion || ""}</p>
        <a href="${m.url}" download class="btn-descargar">⬇ Descargar</a>
      `;

      cont.appendChild(item);
    });

  } catch (error) {
    console.error(error);
    cont.innerHTML = "<p>Error cargando materiales.</p>";
  }
}



//           MODAL NUEVA CATEGORÍA

function activarModalCategoria() {
  const btn = document.getElementById("btn-nueva-categoria");
  const modal = document.getElementById("modal-categoria");
  const cerrar = document.getElementById("cerrar-modal-categoria");
  const form = document.getElementById("form-nueva-categoria");

  if (!btn || !modal || !form) return;

  btn.onclick = () => modal.style.display = "flex";
  cerrar.onclick = () => modal.style.display = "none";

  form.onsubmit = async (e) => {
    e.preventDefault();

    const nombre = form.nombre.value.trim();
    if (!nombre) return alert("Debes escribir un nombre.");

    const res = await fetch("/api/categorias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre })
    });

    if (!res.ok) return alert("Error al crear categoría.");

    modal.style.display = "none";
    form.reset();
    cargarCategorias();
  };
}



//           MODAL SUBIR MATERIAL A UNA CATEGORÍA

function abrirModalSubida() {
  const modal = document.getElementById("modal-subida");
  const form  = document.getElementById("form-material");
  const cerrar = document.getElementById("btn-cerrar-modal");

  if (!modal || !form) return;

  // Mostrar modal
  modal.style.display = "flex";

  // Cargar categorías en el select
  cargarSelectCategorias();

  // Limpiar campos
  form.reset();

  // Cerrar modal
  if (cerrar) {
    cerrar.onclick = () => {
      modal.style.display = "none";
    };
  }

  // MUY IMPORTANTE: evitar que el form haga submit normal
  form.onsubmit = async (e) => {
    e.preventDefault();  // <- esto evita que te lleve a dashboard.html?titulo=...

    const data = new FormData(form);

    const res = await fetch("/api/materiales/subir", {
      method: "POST",
      body: data,
    });

    if (!res.ok) {
      alert("Error al subir material.");
      return;
    }

    alert("Material subido correctamente.");
    modal.style.display = "none";
    form.reset();
    cargarCategorias(); // refrescar tarjetas
  };
}

async function cargarSelectCategorias() {
  const select = document.getElementById("categoria_id");
  if (!select) return;

  try {
    const res = await fetch("/api/categorias");
    const categorias = await res.json();

    select.innerHTML = `<option value="">Seleccione una categoría...</option>`;

    categorias.forEach(cat => {
      const op = document.createElement("option");
      op.value = cat.id;
      op.textContent = cat.nombre;
      select.appendChild(op);
    });

  } catch (err) {
    console.error("Error cargando categorías en el select", err);
  }
}

function verMaterialesCategoria(id) {
    mostrarSeccion("categoria-detalle");

    const titulo = document.getElementById("categoria-titulo");
    const contenedor = document.getElementById("materiales-lista");

    titulo.textContent = "Cargando...";

    fetch(`/api/categorias/${id}`)
      .then(r => r.json())
      .then(cat => titulo.textContent = cat.nombre);

    contenedor.innerHTML = "<p>Cargando...</p>";

    fetch(`/api/materiales/categoria/${id}`)
      .then(r => r.json())
      .then(materiales => {
          if (materiales.length === 0) {
              contenedor.innerHTML = "<p>No hay materiales en esta categoría.</p>";
              return;
          }

          contenedor.innerHTML = materiales.map(m => `
              <div class="material-card">
                  <h3>${m.titulo}</h3>
                  <p>Tipo: ${m.tipo_archivo}</p>
                  <a class="btn-descargar" href="${m.url}" download>Descargar</a>
              </div>
          `).join("");
      });
}


//           ELIMINAR CATEGORÍA COMPLETA

async function eliminarCategoria(id) {
  if (!confirm("¿Eliminar esta categoría y sus materiales?")) return;

  const res = await fetch(`/api/categorias/${id}`, { method: "DELETE" });

  if (!res.ok) return alert("No se pudo eliminar.");

  alert("Categoría eliminada.");
  cargarCategorias();
}

function irCategoria(id, nombre) {
  const url = `materiales_categoria.html?id=${id}&nombre=${encodeURIComponent(nombre)}`;
  window.location.href = url;
}

document.getElementById("volver-manuales").onclick = () => {
    mostrarSeccion("manuales");
};

window.eliminarMaterial = async function (id) {
  if (!confirm("¿Estás seguro de eliminar este material?")) return;

  try {
    const res = await fetch(`/api/materiales/${id}`, {
      method: "DELETE"
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "No se pudo eliminar el material");
      return;
    }

    alert("Material eliminado correctamente");

    //  RECARGAR SOLO LA CATEGORÍA ACTUAL
    if (categoriaActualId && categoriaActualNombre) {
      mostrarCategoria(categoriaActualId, categoriaActualNombre);
    }

  } catch (error) {
    console.error(error);
    alert("Error de conexión con el servidor");
  }
};
