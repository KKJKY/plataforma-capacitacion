document.addEventListener("DOMContentLoaded", async () => {
  const lista = document.getElementById("lista-usuarios");
  const btnNuevo = document.getElementById("btn-nuevo");
  const user = JSON.parse(localStorage.getItem("user")) || {};

  // --- Botón "Nuevo Usuario" (solo admin)
  if (btnNuevo) {
    btnNuevo.addEventListener("click", async () => {
      if (user.rol !== "administrador") {
        alert(" Solo los administradores pueden crear usuarios.");
        return;
      }

      const nombre = prompt("Nombre del nuevo usuario:");
      const correo = prompt("Correo del nuevo usuario:");
      const contrasena = prompt("Contraseña temporal:");
      const rol = prompt("Rol (administrador / practicante):", "practicante");

      if (!nombre || !correo || !contrasena) {
        alert(" Todos los campos son obligatorios.");
        return;
      }

      try {
        const res = await fetch("/api/usuarios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre, correo, contrasena, rol, rolAdmin: user.rol }),
        });
        const data = await res.json();
        alert(data.message || data.error);
        cargarUsuarios();
      } catch (error) {
        console.error(error);
        alert("Error al crear usuario.");
      }
    });
  }

  // --- Cargar usuarios
  async function cargarUsuarios() {
    lista.innerHTML = "Cargando usuarios...";
    try {
      const res = await fetch(`/api/usuarios?rol=${user.rol}`);
      const usuarios = await res.json();

      lista.innerHTML = "";

      usuarios.forEach((u) => {
        const card = document.createElement("div");
        card.classList.add("usuario-card");

        const esActivo = u.estado === "activo";

        card.innerHTML = `
          <strong>${u.nombre}</strong>
          <div>
            <span class="rol-tag ${u.rol}">${u.rol}</span>
            <span class="estado-tag ${esActivo ? "activo" : "inactivo"}">${u.estado}</span>
          </div>
          ${
            user.rol === "administrador"
              ? `
              <div class="acciones">
                <button 
                  class="btn-estado ${esActivo ? "btn-desactivar" : "btn-activar"}"
                  onclick="cambiarEstado(${u.id}, '${esActivo ? "inactivo" : "activo"}', this)">
                  ${esActivo ? "Desactivar" : "Activar"}
                </button>
                <button class="btn-eliminar" onclick="eliminarUsuario(${u.id})">Eliminar</button>
              </div>
            `
              : ""
          }
        `;
        lista.appendChild(card);
      });
    } catch (error) {
      lista.innerHTML = "<p> Error al obtener usuarios</p>";
    }
  }

  // --- Cambiar estado (sin recargar toda la lista)
  window.cambiarEstado = async (id, nuevoEstado, boton) => {
    if (user.rol !== "administrador") return alert("❌ Solo los administradores pueden modificar usuarios.");

    try {
      const res = await fetch(`/api/usuarios/${id}/estado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado, rol: user.rol }),
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error);

      // Cambiar color y texto del botón sin recargar todo
      const estadoTag = boton.closest(".usuario-card").querySelector(".estado-tag");
      if (nuevoEstado === "activo") {
        boton.textContent = "Desactivar";
        boton.classList.remove("btn-activar");
        boton.classList.add("btn-desactivar");
        estadoTag.textContent = "activo";
        estadoTag.classList.remove("inactivo");
        estadoTag.classList.add("activo");
      } else {
        boton.textContent = "Activar";
        boton.classList.remove("btn-desactivar");
        boton.classList.add("btn-activar");
        estadoTag.textContent = "inactivo";
        estadoTag.classList.remove("activo");
        estadoTag.classList.add("inactivo");
      }
    } catch (error) {
      alert(" Error al cambiar el estado del usuario");
    }
  };

  // --- Eliminar usuario
  window.eliminarUsuario = async (id) => {
    if (user.rol !== "administrador") return alert("❌ Solo los administradores pueden eliminar usuarios.");
    if (!confirm("¿Seguro que deseas eliminar este usuario?")) return;

    try {
      const res = await fetch(`/api/usuarios/${id}?rol=${user.rol}`, { method: "DELETE" });
      const data = await res.json();
      alert(data.message || data.error);
      cargarUsuarios();
    } catch (error) {
      alert(" Error al eliminar usuario");
    }
  };

  cargarUsuarios();
});
