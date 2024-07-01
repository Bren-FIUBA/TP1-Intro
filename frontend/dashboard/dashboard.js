// Lógica del inicio de sesión y autenticación de usuarios
const urlParams = new URLSearchParams(window.location.search);

// tomamos el ID de la URL
const sessionID = urlParams.get('sessionID');

// tomamos el ID almacenado como variable global en app.py, el id de la sesión
const storedSessionID = localStorage.getItem('sessionID');

if (storedSessionID !== sessionID) {
    console.log("El usuario no está autenticado, redirigiendo a login.");
        window.location.href = "http://localhost:8000/login/";
} else { // Si el usuario sí inició sesión, lo lleva al dashboard
    fetch(`http://127.0.0.1:5000/dashboard?sessionID=${sessionID}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.log(data.error);
                window.location.href = "http://localhost:8000/login/";
        } else {
            console.log("Bienvenido al dashboard:", data);
            // acá cargaría la data del usuario
        }
    })
    .catch(error => {
        console.error("Error al cargar el dashboard:", error);
            window.location.href = "http://localhost:8000/login/";
    });
}

// -------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", function() {
    fetchUserInfo(); // Llama a una función para obtener datos del usuario al cargar la página
    updateDate(); // actualiza la fecha al cargar la página
    updateClock(); // actualiza el reloj al cargar la página
});

window.onload = function() {
    updateDate(); // Actualizar la fecha al recargar la página
};


// Lógica de la parte 'front' del to-do's div:
let agregandoTarea = false;

function agregarDivTarea() {
    if(agregandoTarea) {
        return; // para no agregar más tareas hasta no terminar de ingresar una.
    }

    agregandoTarea = true; // hasta no terminar con todo lo de abajo (agregar la tarea o removerla), no se pueden agregar más tareas.

    const tasksContainer = document.querySelector(".tasks-container");

    // creamos div de cada tarea
    let taskDiv = document.createElement("div");
    taskDiv.setAttribute("class", "task-div");

    // le metemos un input al div
    let tarea = document.createElement("input");
    tarea.type = "text";
    tarea.placeholder = "Nueva tarea";
    tarea.setAttribute("class", "task-input");

    taskDiv.append(tarea);

    // le metemos dos botones al div
    let agregarTareaButton = document.createElement("input");
    agregarTareaButton.type = "button";
    agregarTareaButton.value = "✔️";
    agregarTareaButton.onclick = function() {
        confirmarTarea(taskDiv, tarea);
    }
    agregarTareaButton.setAttribute("class", "add-task-button");

    taskDiv.append(agregarTareaButton);

    let removerTareaButton = document.createElement("input");
    removerTareaButton.type = "button";
    removerTareaButton.value = "❌";
    removerTareaButton.onclick = function() {
        removerTarea(taskDiv);
    }

    removerTareaButton.setAttribute("class", "remove-task-button");

    taskDiv.append(removerTareaButton);

    tasksContainer.append(taskDiv);

    // Para que al agregar una tarea, el div "scrollee" y lleve al usuario a la nueva tarea.
    taskDiv.scrollIntoView({ behavior: "smooth", block: "end" });
}

function confirmarTarea(taskDiv, tareaInput) {
    // Verificar que el input no esté vacío
    if (!tareaInput.value.trim()) {
        return; // si el input está vacío, no hace nada.
    }

    agregandoTarea = false;

    // Ahora cambiamos todo el div ya que la tarea pasa de ser un input a ser texto plano.

    // Crear un checkbox para marcar la tarea como completada
    let tareaCheckbox = document.createElement("input");
    tareaCheckbox.type = "checkbox";
    tareaCheckbox.setAttribute("class", "task-checkbox");

    // Crear un p para mostrar el texto de la tarea
    let tareaTexto = document.createElement("p");
    tareaTexto.textContent = tareaInput.value;
    tareaTexto.setAttribute("class", "task-text");

    // Crear el botón para editar la tarea
    let editarTareaButton = document.createElement("input");
    editarTareaButton.type = "button";
    editarTareaButton.value = "✏️";
    editarTareaButton.setAttribute("class", "edit-task-button");
    editarTareaButton.onclick = function() {
        editarTarea(taskDiv, tareaTexto);
    };

    // El botón de remover se mantiene, pero lo volvemos a hacer acá para que se muestre al final.
    let removerTareaButton = document.createElement("input");
    removerTareaButton.type = "button";
    removerTareaButton.value = "❌";
    removerTareaButton.setAttribute("class", "remove-task-button");
    removerTareaButton.onclick = function() {
        removerTarea(taskDiv);
    };

    // Borramos y añadimos lo necesario

    taskDiv.innerHTML = ""; // Borramos todo el contenido del div de la tarea
    taskDiv.append(tareaCheckbox); // Al div de la tarea, vacío, le agregamos el checkbox
    taskDiv.append(tareaTexto); // Ahora le agregamos el texto plano del input
    taskDiv.append(editarTareaButton); // Agregamos el botón de editar tare

    taskDiv.append(removerTareaButton);
}


function editarTarea(taskDiv, tareaTexto) {

    agregandoTarea = true;

    // ocultamos el checkbox en el modo edicion
    let tareaCheckbox = taskDiv.querySelector(".task-checkbox");
    if (tareaCheckbox) {
        tareaCheckbox.style.display = "none";
    }

    // Volvemos a crear un input para editar tarea
    let nuevoInput = document.createElement("input");
    nuevoInput.type = "text";
    nuevoInput.value = tareaTexto.textContent; // para no borrar el contenido a editar
    nuevoInput.setAttribute("class", "task-input");

    // Reemplazar texto con nuevo input
    taskDiv.replaceChild(nuevoInput, tareaTexto); // lo que hay (tareaTexto) lo reemplazamos por el nuevo input

    // Crear botón para confirmar la edición
    let confirmarEdicionButton = document.createElement("input");
    confirmarEdicionButton.type = "button";
    confirmarEdicionButton.value = "✔️";
    confirmarEdicionButton.setAttribute("class", "add-task-button");
    confirmarEdicionButton.onclick = function () {
        confirmarTarea(taskDiv, nuevoInput); // Reutilizamos la función que hicimos para agregar una tarea de cero
        
        // Además de ejecutar la función confirmartarea, mostramos nuevamente el checkbox
        if (tareaCheckbox) {
        tareaCheckbox.style.display = "inline-block";
        }
    };

    // Reemplazar el botón de edición por el de confirmación de edición nuevamente
    let editarButton = taskDiv.querySelector(".edit-task-button");
    taskDiv.replaceChild(confirmarEdicionButton, editarButton);
}

function removerTarea(taskDiv) {
    // Eliminar completamente el div de la tarea
    taskDiv.remove();
    agregandoTarea = false;
}

// --------------------------- SALUDO, FECHA, RELOJ ---------------------------

// > SALUDO
// Obtenemos el nombre del usuario (para saludarlo/a)
function fetchUserInfo() {
    const sessionID = localStorage.getItem('sessionID');
    fetch(`http://127.0.0.1:5000/user_info?sessionID=${sessionID}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error(data.error);
                return;
            }
            displayGreetingMessage(data.user); // Si obtiene la información del usuario exitosamente, muestra el saludo personalizado.
        })
        .catch(error => {
            console.error('Error al obtener la información del usuario:', error);
        });
}

function displayGreetingMessage(user) {
    const usernameSpan = document.querySelector("#username");

    usernameSpan.textContent = user.username;

    const saludo = getSaludo();
    const greetingMessage = document.querySelector(".greeting-message");
    greetingMessage.textContent = `${saludo}, ${user.username}.`;
}

function getSaludo() {
    const hora = new Date().getHours(); // Obtenemos la hora actual
    let saludo;
    if (hora >= 5 && hora < 12) {
        saludo = "Buen día";
    } else if (hora >= 12 && hora < 19) {
        saludo = "Buenas tardes";
    } else {
        saludo = "Buenas noches";
    }
    return saludo;
}


// > RELOJ
// Función para actualizar el reloj
function updateClock() {
    var currentTime = new Date();
    var hours = currentTime.getHours();
    var minutes = currentTime.getMinutes();
    var period;

    // Determina si es AM o PM
    if (hours >= 12) { period = 'PM' } 
    else { period = 'AM' }

    // Convierte a formato de 12 horas
    hours = hours % 12;
    if (hours === 0) { hours = 12 } // La hora '0' debería ser '12' en formato 12 horas

    // Formatea los minutos para asegurar dos dígitos
    var minutesFormatted;
    if (minutes < 10) { minutesFormatted = '0' + minutes } 
    else { minutesFormatted = minutes.toString() }

    // Actualiza el contenido del span con ID 'clock'
    var clockElement = document.getElementById('clock');
    clockElement.textContent = `${hours}:${minutesFormatted} ${period}`;
}

// > FECHA
function updateDate() {
    var currentDate = new Date();
    var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    var formattedDate = currentDate.toLocaleDateString('es-ES', options);

    var dateElement = document.getElementById('current-date');
    if (dateElement) {
        dateElement.textContent = formattedDate;
    }
}

// Actualizar el reloj cada segundo
setInterval(function() {
    updateClock();
}, 1000);

// Actualizar la fecha cada hora. Para una mejor experiencia, de todas maneras se actualizará cuando el usuario recargue la página.
setInterval(function() {
    updateDate();
}, 3600000);