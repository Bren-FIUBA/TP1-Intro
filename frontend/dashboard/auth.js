// ----------------- Lógica del login y la sesiones -----------------
const urlParams = new URLSearchParams(window.location.search);

// tomamos el ID de la URL
const sessionID = urlParams.get('sessionID');

// tomamos el ID almacenado como variable global en app.py, el id de la sesión
const storedSessionID = localStorage.getItem('sessionID');

if (storedSessionID !== sessionID) {
    console.log("El usuario no está autenticado, redirigiendo a login.");
        window.location.href = "http://localhost:8000/";
} else { // Si el usuario sí inició sesión, lo lleva al dashboard
    fetch(`http://127.0.0.1:5000/dashboard?sessionID=${sessionID}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.log(data.error);
                window.location.href = "http://localhost:8000/";
        } else {
            console.log("Bienvenido al dashboard:", data);
            // acá cargaría la data del usuario
        }
    })
    .catch(error => {
        console.error("Error al cargar el dashboard:", error);
            window.location.href = "http://localhost:8000/";
    });
}