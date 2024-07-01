// --------------------- login / sesión de usuarios ---------------------
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

// --------------------- main ---------------------
document.addEventListener("DOMContentLoaded", function() {
    fetchUserInfo(); // Llama a una función para obtener datos del usuario al cargar la página
    updateDate(); // actualiza la fecha al cargar la página
    updateClock(); // actualiza el reloj al cargar la página
    fetchTasks();
});

window.onload = function() {
    updateDate(); // Actualizar la fecha al recargar la página
};


// --------------------- to-do's ---------------------
let agregandoTarea = false;

function fetchTasks() {
    const sessionID = localStorage.getItem('sessionID');
    fetch(`http://127.0.0.1:5000/get_tasks?sessionID=${sessionID}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error(data.error);
                return;
            }
            displayTasks(data.tasks); // Si obtiene las tareas, las muestra. Devolvería un JSON con las tareas.
        })
        .catch(error => {
            console.error('Error al obtener las tareas:', error);
        });
}

// Función que muestra las tareas (recibe el contenido de las tareas al que el fetch hace request)
function displayTasks(tasks) {
    const tasksContainer = document.querySelector(".tasks-container");

    // Iteramos sobre cada tarea (recordemos que recibimos un JSON "tasks" que contiene todas las tareas del usuario) y las mostramos en pantalla.
    for (let i = 0; i < tasks.length; i++) {
        let task = tasks[i];
        let taskDiv = document.createElement("div");
        taskDiv.setAttribute("class", "task-div");
        taskDiv.setAttribute("data-task-id", task.id); // Almacenar el ID de la tarea

        // Crear un checkbox para marcar la tarea como completada
        let checkbox = crearCheckbox();
        checkbox.checked = task.completed; // cargar el estado de la tarea guardado en la base de datos
        checkbox.addEventListener('change', function() {
            marcarCheckbox(task.id, checkbox.checked);
        });

        // Crear un p para mostrar el texto de la tarea
        let tareaTexto = document.createElement("p");
        tareaTexto.textContent = task.task_text;
        tareaTexto.setAttribute("class", "task-text");

        // Crear el botón para editar la tarea
        let editarTareaButton = crearEditarButton(taskDiv, tareaTexto);

        // Crear el botón para eliminar la tarea
        let removerTareaButton = crearRemoveButton(taskDiv)

        // Appenddeamos todo al div
        taskDiv.append(checkbox);
        taskDiv.append(tareaTexto);
        taskDiv.append(editarTareaButton);
        taskDiv.append(removerTareaButton);

        // Appenddeamos el taskDiv que contiene todos los elementos al taskContainer
        tasksContainer.append(taskDiv);
    }
}

function crearInput() {
    let tarea = document.createElement("input");
    tarea.type = "text";
    tarea.placeholder = "Nueva tarea";
    tarea.setAttribute("class", "task-input");
    return tarea;
}

function crearConfirmButton(taskDiv) {
    let confirmarTareaButton = document.createElement("input");
    confirmarTareaButton.type = "button";
    confirmarTareaButton.value = "✔️";
    confirmarTareaButton.setAttribute("class", "confirm-task-button");
    confirmarTareaButton.onclick = function() {
        let tareaInput = taskDiv.querySelector(".task-input");
        confirmarTarea(taskDiv, tareaInput);
    };
    return confirmarTareaButton;
}

function crearConfirmEditButton(taskDiv) {
    let confirmarEdicionButton = document.createElement("input");
    confirmarEdicionButton.type = "button";
    confirmarEdicionButton.value = "✔️";
    confirmarEdicionButton.setAttribute("class", "confirm-edit-button");
    confirmarEdicionButton.onclick = function() {
        let tareaInput = taskDiv.querySelector(".task-input");
        confirmarEdit(taskDiv, tareaInput);
    };
    return confirmarEdicionButton;
}

function crearRemoveButton(taskDiv) {
    let removerTareaButton = document.createElement("input");
    removerTareaButton.type = "button";
    removerTareaButton.value = "❌";
    removerTareaButton.setAttribute("class", "remove-task-button");
    removerTareaButton.onclick = function() {
        removerTarea(taskDiv);
    };
    return removerTareaButton;
}

function crearCheckbox() {
    let tareaCheckbox = document.createElement("input");
    tareaCheckbox.type = "checkbox";
    tareaCheckbox.setAttribute("class", "task-checkbox");
    return tareaCheckbox;
}

function crearTextoTarea(tareaInput) {
    let tareaTexto = document.createElement("p");
    tareaTexto.textContent = tareaInput.value;
    tareaTexto.setAttribute("class", "task-text");
    return tareaTexto;
}

function crearEditarButton(taskDiv, tareaTexto) {
    let editarTareaButton = document.createElement("input");
    editarTareaButton.type = "button";
    editarTareaButton.value = "✏️";
    editarTareaButton.setAttribute("class", "edit-task-button");
    editarTareaButton.onclick = function() {
        editarTarea(taskDiv, tareaTexto);
    };
    return editarTareaButton;
}

function confirmarTarea(taskDiv, tareaInput) {
    // Verificar que el input no esté vacío
    if (!tareaInput.value.trim()) {
        return; // si el input está vacío, no hace nada.
    }

    agregandoTarea = false;

    //creo un objeto con los datos de la tarea que deben añadirse a la base de datos
    const tareaData = {
        task_text: tareaInput.value.trim(),     // Obtener el texto de la tarea
        completed: false, 
        user_id: localStorage.getItem('sessionID') // Obtener el ID de usuario del localStorage
    };

    // Acá se agrega a la base de datos (fetch)
    fetch('http://127.0.0.1:5000/add_task', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(tareaData),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Tarea agregada exitosamente:', data);
        // Agregar el ID de la tarea al div
        taskDiv.setAttribute('data-task-id', data.task_id);
        // Puedes actualizar el frontend si lo necesitas
    })
    .catch(error => {
        console.error('Error al agregar tarea:', error);
    });

    // Borramos y añadimos lo necesario
    taskDiv.innerHTML = ""; // Borramos todo el contenido del div de la tarea

    let checkbox = crearCheckbox();
    let tareaTexto = crearTextoTarea(tareaInput);
    let editarButton = crearEditarButton(taskDiv, tareaTexto);
    let removeButton = crearRemoveButton(taskDiv)
    
    taskDiv.append(checkbox); // Al div de la tarea, vacío, le agregamos el checkbox
    taskDiv.append(tareaTexto); // Ahora le agregamos el texto plano del input
    taskDiv.append(editarButton); // Agregamos el botón de editar tarea
    taskDiv.append(removeButton); // Agregamos el botón de eliminar tarea
}

function confirmarEdit(taskDiv, tareaInput) {
    // Verificar que el input no esté vacío
    if (!tareaInput.value.trim()) {
        return; // si el input está vacío, no hace nada.
    }

    agregandoTarea = false;

    // Obtener el ID de la tarea desde el atributo data-task-id
    const taskId = taskDiv.getAttribute('data-task-id');

    // Objeto con los datos actualizados de la tarea
    const tareaData = {
        task_id: taskId,
        task_text: tareaInput.value.trim()
    };

    // Hacer la solicitud PUT al servidor
    fetch(`http://127.0.0.1:5000/edit_task/${taskId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(tareaData),
    })
    .then(response => {
        if (response.ok) {
            console.log(`Tarea con ID ${taskId} editada correctamente.`);
            // Actualizar visualmente el texto de la tarea
            let tareaTexto = taskDiv.querySelector('.task-text');
            tareaTexto.textContent = tareaInput.value.trim();
        } else {
            console.error('Error al intentar editar la tarea desde el servidor.');
        }
    })
    .catch(error => {
        console.error('Error al editar tarea:', error);
    });

    // Borramos y añadimos lo necesario
    taskDiv.innerHTML = ""; // Borramos todo el contenido del div de la tarea

    let checkbox = crearCheckbox();
    let tareaTexto = crearTextoTarea(tareaInput);
    let editarButton = crearEditarButton(taskDiv, tareaTexto);
    let removeButton = crearRemoveButton(taskDiv)
    
    taskDiv.append(checkbox); // Al div de la tarea, vacío, le agregamos el checkbox
    taskDiv.append(tareaTexto); // Ahora le agregamos el texto plano del input
    taskDiv.append(editarButton); // Agregamos el botón de editar tarea
    taskDiv.append(removeButton); // Agregamos el botón de eliminar tarea

    agregandoTarea = false;
}

function editarTarea(taskDiv, tareaTexto) {
    agregandoTarea = true;

    taskDiv.innerHTML = ""; // Borramos todo el contenido del div de la tarea

    let checkbox = crearCheckbox();

    // Volvemos a crear un input para editar tarea
    let nuevoInput = crearInput();
    nuevoInput.value = tareaTexto.textContent; // para no borrar el contenido a editar
    let confirmEditButton = crearConfirmEditButton(taskDiv, nuevoInput);
    let removeButton = crearRemoveButton(taskDiv);

    taskDiv.append(checkbox);
    taskDiv.append(nuevoInput); 
    taskDiv.append(confirmEditButton); // Agregamos el botón de editar tarea
    taskDiv.append(removeButton); // Agregamos el botón de eliminar tarea
}

function removerTarea(taskDiv) {
    // Obtener el ID de la tarea desde el atributo data-task-id
    const taskId = taskDiv.getAttribute('data-task-id');

    // Hacer la solicitud DELETE al servidor
    fetch(`http://127.0.0.1:5000/delete_task/${taskId}`, {
        method: 'DELETE',
    })
    .then(response => {
        if (response.ok) {
            console.log(`Tarea con ID ${taskId} eliminada correctamente.`);
            // Eliminar visualmente el div de la tarea
            taskDiv.remove();
        } else {
            console.error('Error al intentar eliminar la tarea desde el servidor.');
        }
    })
    .catch(error => {
        console.error('Error al eliminar tarea:', error);
    });

    agregandoTarea = false;
}

function marcarCheckbox(taskId, completed) {
    const tareaData = {
        completed: completed
    };

    fetch(`http://127.0.0.1:5000/complete_task/${taskId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(tareaData),
    })
    .then(response => {
        if (response.ok) {
            console.log(`Estado de tarea con ID ${taskId} actualizado correctamente.`);
        } else {
            console.error('Error al actualizar estado de tarea desde el servidor.');
        }
    })
    .catch(error => {
        console.error('Error al actualizar estado de tarea:', error);
    });
}

function agregarDivTarea() {
    if(agregandoTarea) {
        return; // para no agregar más tareas hasta no terminar de ingresar una.
    }

    agregandoTarea = true; // hasta no terminar con todo lo de abajo (agregar la tarea o removerla), no se pueden agregar más tareas.

    const tasksContainer = document.querySelector(".tasks-container");

    // creamos div de cada tarea
    let taskDiv = document.createElement("div");
    taskDiv.setAttribute("class", "task-div");

    let input = crearInput()
    let confirmButton = crearConfirmButton(taskDiv)
    let removeButton = crearRemoveButton(taskDiv)

    taskDiv.append(input);
    taskDiv.append(confirmButton);
    taskDiv.append(removeButton);
    
    tasksContainer.append(taskDiv);

    // Para que al agregar una tarea, el div "scrollee" y lleve al usuario a la nueva tarea.
    taskDiv.scrollIntoView({ behavior: "smooth", block: "end" });
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