const API = "/api/usuarios/login";
const btn = document.getElementById("btn-login");
const errorBox = document.getElementById("error");

btn.addEventListener("click", async () => {
  errorBox.textContent = "";
  const correo = document.getElementById("correo").value.trim();
  const contrasena = document.getElementById("contrasena").value.trim();

  if (!correo || !contrasena) {
    errorBox.textContent = "Completa correo y contraseña.";
    return;
  }

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo, contrasena }),
    });

    const data = await res.json();

    //  Manejo de errores específicos
    if (!res.ok) {
      if (res.status === 403) {
        errorBox.textContent = "Tu cuenta está inactiva. Contacta al administrador.";
      } else if (res.status === 401) {
        errorBox.textContent = "Contraseña incorrecta.";
      } else if (res.status === 404) {
        errorBox.textContent = "Usuario no encontrado.";
      } else {
        errorBox.textContent = data?.error || "Error al iniciar sesión.";
      }
      return;
    }

    //  Guardar datos del usuario si está activo
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("rol", data.user.rol);

    //  Redirigir al dashboard
    window.location.href = "/dashboard.html";
  } catch (e) {
    errorBox.textContent = "No se pudo conectar con el servidor.";
    console.error(e);
  }
});
