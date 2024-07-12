var daily_goals_fetched;

document.addEventListener("DOMContentLoaded", function() {
    const sessionID = localStorage.getItem('sessionID');

    let selectedDate = new Date();
    localStorage.setItem('selectedDate', selectedDate.toISOString().split('T')[0]);

    updateHeader(selectedDate);

    createDailyGoalRecords(sessionID);
    getDailyGoals(selectedDate);
    getDailyProgress(selectedDate); // Obtiene el progreso diario para la fecha actual
    getWeeklyProgress(selectedDate); // Obtiene el progreso semanal para la fecha actual
    getEvents(selectedDate);
    getTasks();
    daily_goals_fetched = true;
});

// Función de logout
function logout() {
    // Limpiar localStorage
    localStorage.clear();
    // Redirigir a la página de inicio de sesión u otra acción de cierre de sesión
    window.location.href = 'http://localhost:8000/login/';
}

// para que también se borre localstorage si cierra la ventana.
// Comprueba si la página se está recargando o cerrando
window.addEventListener('unload', function(event) {
    if (sessionStorage.getItem('reloading') === 'true') {
        // Si es una recarga, elimina la bandera
        sessionStorage.removeItem('reloading');
    } else {
        // Si no es una recarga, elimina los datos de localStorage
        localStorage.clear();
    }
});

// ---------------------------------- Handle Views ----------------------------------
// Función para mostrar el main-div y ocultar daily-goals-config-div
function showMainDiv() {
    const mainDiv = document.getElementById('main-div');
    const configDiv = document.getElementById('daily-goals-config-div');
    mainDiv.style.display = 'flex';
    configDiv.style.display = 'none';
    if (!daily_goals_fetched) { 
        location.reload()
        daily_goals_fetched = true;
    }
}

// Función para mostrar daily-goals-config-div y ocultar main-div
function showDailyGoalsConfig() {
    const mainDiv = document.getElementById('main-div');
    const configDiv = document.getElementById('daily-goals-config-div');
    mainDiv.style.display = 'none';
    configDiv.style.display = 'flex';
    configDiv.style.visibility = 'visible';
    configDiv.style.height = '100%';

    const goalsContainer = document.getElementById('daily-goals-config-card');
    goalsContainer.style.padding = '10px'; // Ajusta el padding según necesites
    goalsContainer.style.overflowY = 'auto'; // Añade overflow-y para la scrollbar si es necesario
    goalsContainer.style.scrollbarWidth = 'thin';
    goalsContainer.style.scrollbarColor = 'transparent transparent'
    goalsContainer.style.transition.scrollbarColor = '0.3s ease';
    getGoals();
}

// ---------------------------------- To-do's ----------------------------------
let agregandoTarea = false;

function getTasks() {
    const sessionID = localStorage.getItem('sessionID');
    fetch(`http://127.0.0.1:5000/get_tasks?sessionID=${sessionID}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error(data.error);
                return;
            }
            displayTasks(data.tasks); // Si obtiene las tareas exitosamente, las muestra. Este fetch devolvería un JSON con las tareas.
        })
        .catch(error => {
            console.error('Error al obtener las tareas:', error);
        });
}

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
            marcarCheckboxTarea(task.id, checkbox.checked);
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

function marcarCheckboxTarea(taskId, completed) {
    const tareaData = {
        task_id: taskId,
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

// ---------------------------------- Goals (config) ----------------------------------
let agregandoObjetivo = false;

function getGoals() {
    const sessionID = localStorage.getItem('sessionID');
    fetch(`http://127.0.0.1:5000/get_goals?sessionID=${sessionID}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error(data.error);
                return;
            }
            displayGoals(data.goals);
        })
        .catch(error => {
            console.error('Error al obtener los objetivos:', error);
        });
}

function displayGoals(goals) {
    const goalsContainer = document.querySelector("#goals-container");

    // Limpiar contenedor de objetivos antes de agregar nuevos elementos
    goalsContainer.innerHTML = "";

    goals.forEach(goal => {
        let goalDiv = document.createElement("div");
        goalDiv.setAttribute("class", "goal-div");
        goalDiv.setAttribute("data-goal-id", goal.id); // Almacenar el ID del objetivo

        let objetivoTexto = document.createElement("p");
        objetivoTexto.textContent = goal.goal;
        objetivoTexto.setAttribute("class", "goal-text");

        let editarObjetivoButton = crearEditarGoalButton(goalDiv, objetivoTexto);
        let removerObjetivoButton = crearRemoveGoalButton(goalDiv);

        goalDiv.append(objetivoTexto);
        goalDiv.append(editarObjetivoButton);
        goalDiv.append(removerObjetivoButton);

        goalsContainer.append(goalDiv);
    });
}

function crearGoalsInput() {
    let objetivo = document.createElement("input");
    objetivo.type = "text";
    objetivo.setAttribute("class", "goal-input");
    return objetivo;
}

function crearConfirmGoalButton(goalDiv) {
    let confirmarObjetivoButton = document.createElement("input");
    confirmarObjetivoButton.type = "button";
    confirmarObjetivoButton.value = "✔️";
    confirmarObjetivoButton.setAttribute("class", "confirm-goal-button");
    confirmarObjetivoButton.onclick = function() {
        let objetivoInput = goalDiv.querySelector(".goal-input");
        confirmarObjetivo(goalDiv, objetivoInput);
    };
    return confirmarObjetivoButton;
}

function crearConfirmEditGoalButton(goalDiv) {
    let confirmarEdicionButton = document.createElement("input");
    confirmarEdicionButton.type = "button";
    confirmarEdicionButton.value = "✔️";
    confirmarEdicionButton.setAttribute("class", "confirm-goal-button");
    confirmarEdicionButton.onclick = function() {
        let objetivoInput = goalDiv.querySelector(".goal-input");
        confirmGoalEdit(goalDiv, objetivoInput);
    };
    return confirmarEdicionButton;
}

function crearRemoveGoalButton(goalDiv) {
    let removerObjetivoButton = document.createElement("input");
    removerObjetivoButton.type = "button";
    removerObjetivoButton.value = "❌";
    removerObjetivoButton.setAttribute("class", "remove-goal-button");
    removerObjetivoButton.onclick = function() {
        removerObjetivo(goalDiv);
    };
    return removerObjetivoButton;
}

function crearTextoObjetivo(objetivoInput) {
    let objetivoTexto = document.createElement("p");
    objetivoTexto.textContent = objetivoInput.value;
    objetivoTexto.setAttribute("class", "goal-text");
    return objetivoTexto;
}

function crearEditarGoalButton(goalDiv, objetivoTexto) {
    let editarObjetivoButton = document.createElement("input");
    editarObjetivoButton.type = "button";
    editarObjetivoButton.value = "✏️";
    editarObjetivoButton.setAttribute("class", "edit-goal-button");
    editarObjetivoButton.onclick = function() {
        editarObjetivo(goalDiv, objetivoTexto);
    };
    return editarObjetivoButton;
}

function confirmarObjetivo(goalDiv, objetivoInput) {
    if (!objetivoInput.value.trim()) {
        return;
    }

    agregandoObjetivo = false;

    const objetivoData = {
        goal: objetivoInput.value.trim(),
        user_id: localStorage.getItem('sessionID')
    };

    fetch('http://127.0.0.1:5000/add_goal', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(objetivoData),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Objetivo agregado exitosamente:', data);
        goalDiv.setAttribute('data-goal-id', data.goal_id);
    })
    .catch(error => {
        console.error('Error al agregar objetivo:', error);
    });

    goalDiv.innerHTML = "";

    let objetivoTexto = crearTextoObjetivo(objetivoInput);
    let editarButton = crearEditarGoalButton(goalDiv, objetivoTexto);
    let removeButton = crearRemoveGoalButton(goalDiv);

    goalDiv.append(objetivoTexto);
    goalDiv.append(editarButton);
    goalDiv.append(removeButton);

    daily_goals_fetched = false;
}

function confirmGoalEdit(goalDiv, objetivoInput) {
    if (!objetivoInput.value.trim()) {
        return;
    }

    const goalId = goalDiv.getAttribute('data-goal-id');
    const objetivoData = {
        goal_id: goalId,
        goal: objetivoInput.value.trim()
    };

    fetch(`http://127.0.0.1:5000/edit_goal`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(objetivoData),
    })
    .then(response => {
        if (response.ok) {
            console.log(`Objetivo con ID ${goalId} editado correctamente.`);
            let objetivoTexto = goalDiv.querySelector('.goal-text');
            objetivoTexto.textContent = objetivoInput.value.trim();
        } else {
            console.error('Error al intentar editar el objetivo desde el servidor.');
            response.json().then(data => {
                console.error('Detalles del error:', data);
            });
        }
    })
    .catch(error => {
        console.error('Error al editar objetivo:', error);
    });

    goalDiv.innerHTML = "";

    let objetivoTexto = crearTextoObjetivo(objetivoInput);
    let editarButton = crearEditarGoalButton(goalDiv, objetivoTexto);
    let removeButton = crearRemoveGoalButton(goalDiv);

    goalDiv.append(objetivoTexto);
    goalDiv.append(editarButton);
    goalDiv.append(removeButton);

    daily_goals_fetched = false;
}

function editarObjetivo(goalDiv, objetivoTexto) {
    let objetivoInput = crearGoalsInput();
    objetivoInput.value = objetivoTexto.textContent;

    goalDiv.innerHTML = "";

    let confirmarEdicionButton = crearConfirmEditGoalButton(goalDiv);
    let removerObjetivoButton = crearRemoveGoalButton(goalDiv);

    goalDiv.append(objetivoInput);
    goalDiv.append(confirmarEdicionButton);
    goalDiv.append(removerObjetivoButton);
}

function removerObjetivo(goalDiv) {
    const goalId = goalDiv.getAttribute('data-goal-id');

    fetch(`http://127.0.0.1:5000/delete_goal`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ goal_id: goalId }),
    })
    .then(response => {
        if (response.ok) {
            console.log(`Objetivo con ID ${goalId} eliminado correctamente.`);
            goalDiv.remove();
        } else {
            console.error('Error al intentar eliminar el objetivo desde el servidor.');
            response.json().then(data => {
                console.error('Detalles del error:', data);
            });
        }
    })
    .catch(error => {
        console.error('Error al eliminar objetivo:', error);
    });

    daily_goals_fetched = false;
}

// Función para agregar un nuevo div de objetivo
function agregarDivObjetivo() {
    if(agregandoObjetivo) {
        return; // para no agregar más tareas hasta no terminar de ingresar una.
    }
    agregandoObjetivo = true; // hasta no terminar con todo lo de abajo (agregar la tarea o removerla), no se pueden agregar más tareas.
    
    const goalsContainer = document.querySelector("#goals-container");

    // creamos div de cada tarea
    let objetivoDiv = document.createElement("div");
    objetivoDiv.setAttribute("class", "goal-div");

    let input = crearGoalsInput();
    let confirmarObjetivoButton = crearConfirmGoalButton(objetivoDiv);
    let removerObjetivoButton = crearRemoveGoalButton(objetivoDiv);

    objetivoDiv.append(input);
    objetivoDiv.append(confirmarObjetivoButton);
    objetivoDiv.append(removerObjetivoButton);

    goalsContainer.append(objetivoDiv);

    // Para que al agregar una tarea, el div "scrollee" y lleve al usuario a la nueva tarea.
    objetivoDiv.scrollIntoView({ behavior: "smooth", block: "end" });

    goalsContainer.appendChild(objetivoDiv);
    agregandoObjetivo = false;
}

// ---------------------------------- Daily Goals ----------------------------------
// Función para obtener y mostrar los objetivos diarios
function getDailyGoals(selectedDate = new Date()) {
    const sessionID = localStorage.getItem('sessionID');
    selectedDate.setHours(0, 0, 0, 0); // Normaliza la hora a medianoche
    const formattedDate = selectedDate.toISOString().split('T')[0];
    const url = `http://127.0.0.1:5000/get_daily_goals?sessionID=${sessionID}&selectedDate=${formattedDate}`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                console.error(data.error);
                return;
            }
            displayDailyGoals(data);
        })
        .catch(error => {
            console.error('getDailyGoals: Error al obtener los objetivos diarios:', error);
        });
}

// Función para mostrar los objetivos diarios en el contenedor correspondiente
function displayDailyGoals(daily_goals) {
    const dailyGoalsContainer = document.querySelector(".daily-goals-container");
    dailyGoalsContainer.innerHTML = ""; // Limpiar el contenedor antes de agregar nuevos objetivos

    // Iteramos sobre cada objetivo diario y los mostramos en pantalla
    for (let i = 0; i < daily_goals.length; i++) {
        let dailyGoal = daily_goals[i];
        let dailyGoalDiv = document.createElement("div");
        dailyGoalDiv.setAttribute("class", "daily-goal-div");
        dailyGoalDiv.setAttribute("data-daily-goal-id", dailyGoal.id); // Almacenar el ID del objetivo

        // Crear un checkbox para marcar la tarea como completada
        let checkbox = crearCheckbox();
        checkbox.checked = dailyGoal.completed; // cargar el estado de la tarea guardado en la base de datos
        checkbox.addEventListener('change', function() {
            marcarCheckboxDailyGoal(dailyGoal.id, checkbox.checked);
        });

        // Crear un p para mostrar el texto del objetivo diario
        let objetivoTexto = document.createElement("p");
        objetivoTexto.textContent = dailyGoal.goal;
        objetivoTexto.setAttribute("class", "daily-goal-text");

        dailyGoalDiv.append(checkbox);
        dailyGoalDiv.append(objetivoTexto);
        dailyGoalsContainer.append(dailyGoalDiv);
    }
}

function marcarCheckboxDailyGoal(dailyGoalId, completed) {
    let selectedDate = new Date(localStorage.getItem('selectedDate'));
    const dailyGoalData = {
        goal_id: dailyGoalId,
        completed: completed,
        date: selectedDate.toISOString().split('T')[0]
    };

    const url = `http://127.0.0.1:5000/complete_daily_goal`;

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(dailyGoalData),
    })
    .then(response => {
        if (response.ok) {
            selectedDate = new Date(localStorage.getItem('selectedDate'));
            getDailyProgress(selectedDate);
            getWeeklyProgress(selectedDate);
        } else {
            console.error('Error al actualizar estado del objetivo desde el servidor.');
        }
    })
    .catch(error => {
        console.error('Error al actualizar estado del objetivo:', error);
    });
}

function createDailyGoalRecords(sessionID) {
    fetch('http://127.0.0.1:5000/create_daily_goal_records', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionID: sessionID }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al crear registros diarios: ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        console.log(data.message);
        getDailyGoals(new Date()); // Actualiza la lista de objetivos diarios después de crear los registros
    })
    .catch(error => {
        console.error('Error en la solicitud para crear registros diarios:', error);
    });
}

// ---------------------------------- Gráficos ----------------------------------
// Función para obtener el progreso semanal desde el backend y renderizar el gráfico
function getWeeklyProgress(selectedDate = new Date()) {
    const sessionID = localStorage.getItem('sessionID');
    const formattedDate = selectedDate.toISOString().split('T')[0];
    const url = `http://127.0.0.1:5000/weekly-progress?sessionID=${sessionID}&date=${formattedDate}`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            console.log("url a la que apunta getweeklyprogress: " + url)
            return response.json();
        })
        .then(data => {
            const maxYValue = data.length > 0 ? Math.max(...data.map(item => item.total_count)) : 0;
            renderWeeklyProgressChart(data, maxYValue);
        })
        .catch(error => {
            console.error('Error al obtener el progreso semanal:', error);
        });
}

function renderWeeklyProgressChart(data, maxYValue) {
    const ctx = document.getElementById('weekly-progress-chart').getContext('2d');

    if (window.myChart) {
        window.myChart.destroy();
    }

    // Configuración del gráfico usando Chart.js
    window.myChart = new Chart(ctx, {
        type: 'bar', // Tipo de gráfico (por ejemplo, barra)
        data: {
            labels: data.map(item => item.date), // Etiquetas del eje X (fechas)
            datasets: [{
                label: 'Objetivos Completados',
                data: data.map(item => item.completed_count), // Datos del eje Y (cantidad)
                backgroundColor: data.map(() => 'rgba(141, 92, 255, 0.6)'), // Color de fondo de las barras
                borderColor: data.map(() => 'rgba(141, 92, 255, 1)'), // Color del borde de las barras
                borderWidth: 1,
            }]
        },
        options: {
            responsive: true, // Hacer el gráfico responsivo
            scales: {
                y: {
                    beginAtZero: true, // Empezar el eje Y en cero
                    suggestedMax: maxYValue,
                    stepSize: 1
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        display: false // Mostrar las etiquetas del eje X
                    }
                }
            },
            plugins: {
                legend: {
                    display: false // Ocultar la leyenda
                }
            }
        }
    });
}

function getDailyProgress(selectedDate = new Date()) {
    const sessionID = localStorage.getItem('sessionID');
    const formattedDate = selectedDate.toISOString().split('T')[0];
    const url = `http://127.0.0.1:5000/daily-progress?sessionID=${sessionID}&date=${formattedDate}`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            console.log("url a la que apunta getdailyprogress: " + url)
            return response.json();
        })
        .then(data => {
            renderDailyProgressChart(data);
        })
        .catch(error => {
            console.error('Error al obtener el progreso diario:', error);
        });
}

// Función para renderizar el gráfico de progreso diario usando Chart.js
function renderDailyProgressChart(data) {
    const ctx = document.getElementById('daily-progress-chart').getContext('2d');

    const totalGoals = data.total_goals || 1; // Evitar división por 0
    const completedGoals = data.completed_goals;

    if (window.myChart2) {
        window.myChart2.destroy();
    }

    window.myChart2 = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completados', 'Incompletos'],
            datasets: [{
                data: [completedGoals, totalGoals - completedGoals],
                backgroundColor: ['rgba(141, 92, 255, 0.6)', 'rgba(14, 7, 31, 0.6)'],
                borderColor: 'rgb(141, 92, 255)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// ---------------------------------- Agenda ----------------------------------
function agregarEvento() {
    event.preventDefault(); // Prevenir el comportamiento por defecto del formulario

    const selectedDate = localStorage.getItem('selectedDate');

    const eventTitle = document.getElementById('eventTitle').value.trim();
    const eventDescription = document.getElementById('eventDescription').value.trim();
    const eventDate = document.getElementById('eventDate').value;
    const eventStartTime = document.getElementById('eventStartTime').value;
    const eventEndTime = document.getElementById('eventEndTime').value;

    if (!eventTitle || !eventDate) {
        alert('Por favor completa todos los campos obligatorios.');
        return;
    }

    const eventData = {
        user_id: localStorage.getItem('sessionID'),
        title: eventTitle,
        description: eventDescription,
        event_date: eventDate,
        start_time: eventStartTime,
        end_time: eventEndTime
    };

    fetch('http://127.0.0.1:5000/add_event', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
        })
    .then(response => response.json())
    .then(data => {
        console.log('Evento agregado exitosamente:', data);
        closeForm();
        getEvents(selectedDate);
    })
    .catch(error => {
        console.error('Error al agregar evento:', error);
    });
}

function showForm() {
    const formBackground = document.getElementById("form-bg");
    const formDiv = document.getElementById("form-div");

    formBackground.style.display = 'flex';
    formDiv.style.display = 'block';
    document.getElementById("eventForm").reset();
}

function closeForm() {
    const formDiv = document.getElementById("form-div");
    const formBackground = document.getElementById("form-bg");
    formBackground.style.display = 'none';
    formDiv.style.display = 'none';
    document.getElementById("eventForm").reset();

    const eventSubmitButton = document.getElementById('eventSubmitButton');
    eventSubmitButton.value = 'Agregar Evento';
    eventSubmitButton.onclick = agregarEvento;
}

function getEvents(selectedDate = new Date()) {
    const sessionID = localStorage.getItem('sessionID');
    let url = `http://127.0.0.1:5000/get_events?sessionID=${sessionID}`;

    let storedDate = localStorage.getItem("selectedDate");

    if (storedDate) {
        selectedDate = new Date(storedDate);
    } else {
        selectedDate = new Date(); // o cualquier valor por defecto
    }
    
    if (selectedDate) {
        const formattedDate = selectedDate.toISOString().slice(0, 10);
        url += `&selectedDate=${formattedDate}`;
    }

    fetch(url)
        .then(response => response.json())
        .then(data => {
            displayEvents(data.events);
        })
        .catch(error => {
            console.error('Error al obtener los eventos:', error);
        });
}

function displayEvents(events) {
    const eventsContainer = document.querySelector(".schedule");
    eventsContainer.innerHTML = "";

    if (events.length > 0) {
        events.forEach(event => {
            let eventDiv = document.createElement("div");
            eventDiv.classList.add("event-div");
            eventDiv.setAttribute("event-id", event.id);

            let eventTitle = document.createElement("div");
            let title = document.createElement("h6");
            
            let buttonsAndTimeDiv = document.createElement("div");
            let buttonsDiv = document.createElement("div");

            buttonsAndTimeDiv.setAttribute("class", "buttons-time-div");
            buttonsDiv.setAttribute("class", "buttons-div");

            let time = document.createElement("h6");
            
            // Botón Editar
            let editButton = document.createElement("button");
            editButton.textContent = "✏️";
            editButton.classList.add("edit-button");
            editButton.addEventListener("click", () => showEditForm(event));    

            // Botón Eliminar
            let deleteButton = document.createElement("button");
            deleteButton.textContent = "❌";
            deleteButton.classList.add("delete-button");
            deleteButton.addEventListener("click", () => deleteEvent(event.id));

            // Función para formatear las horas
            function formatTime(timeStr) {
                if (!timeStr) return null;
                let [hours, minutes, seconds] = timeStr.split(':');
                if (minutes === '00' && seconds === '00') {
                    return `${hours}hs`;
                } else {
                    return `${hours}:${minutes}hs`;
                }
            }

            // Comprobar si start_time y end_time no son nulos ni vacíos
            const startTime = formatTime(event.start_time);
            const endTime = formatTime(event.end_time);

            // Mostrar hora solo si está disponible
            if (startTime || endTime) {
                if (startTime && endTime) {
                    time.textContent = `${startTime} - ${endTime}`;
                } else if (startTime) {
                    time.textContent = `${startTime}`;
                } else if (endTime) {
                    time.textContent = `${endTime}`;
                }
            } else {
                time.textContent = "--";
            }

            title.textContent = `• ${event.title}`;

            title.classList.add("event-title");
            time.classList.add("event-time");
            eventTitle.classList.add("event-title-div");

            let eventDesc = document.createElement("p");
            eventDesc.textContent = event.description;
            eventDesc.classList.add("event-desc");

            eventTitle.appendChild(title);
            buttonsDiv.appendChild(editButton);
            buttonsDiv.appendChild(deleteButton);

            buttonsAndTimeDiv.appendChild(buttonsDiv);
            buttonsAndTimeDiv.appendChild(time); // Agregar botón Editar al título

            eventTitle.appendChild(buttonsAndTimeDiv);

            eventDiv.appendChild(eventTitle);
            eventDiv.appendChild(eventDesc);
            eventsContainer.appendChild(eventDiv);
        });
    } else {
        let noEventsMessage = document.createElement("p");
        noEventsMessage.classList.add("event-desc")
        noEventsMessage.textContent = "No tienes ningún evento agendado para hoy.";
        eventsContainer.appendChild(noEventsMessage);
    }
}

function deleteEvent(eventId) {
    fetch(`http://127.0.0.1:5000/delete_event/${eventId}`, {
        method: 'DELETE',
    })
    .then(response => response.json())
    .then(data => {
        console.log('Evento eliminado exitosamente:', data);
        
        // Aquí necesitas remover el div del evento eliminado
        let eventDiv = document.querySelector(`div[event-id="${eventId}"]`);
        if (eventDiv) {
            eventDiv.remove(); // Remueve el div del DOM
        } else {
            console.error('Error: No se encontró el div del evento para eliminar.');
        }
    })
    .catch(error => {
        console.error('Error al eliminar evento:', error);
    });
}

function showEditForm(event) {
    const formDiv = document.getElementById("form-div");
    formDiv.style.display = 'block';

    document.getElementById('eventTitle').value = event.title;
    document.getElementById('eventDescription').value = event.description;
    document.getElementById('eventDate').value = event.event_date;
    document.getElementById('eventStartTime').value = event.start_time;
    document.getElementById('eventEndTime').value = event.end_time;

    const eventSubmitButton = document.getElementById('eventSubmitButton');
    eventSubmitButton.value = 'Guardar Cambios';
    eventSubmitButton.onclick = function() {
        editarEvento(event.id);
    }
}

function editarEvento(eventId) {
    event.preventDefault(); // Prevenir el comportamiento por defecto del formulario

    const eventTitle = document.getElementById('eventTitle').value.trim();
    const eventDescription = document.getElementById('eventDescription').value.trim();
    const eventDate = document.getElementById('eventDate').value;
    const eventStartTime = document.getElementById('eventStartTime').value;
    const eventEndTime = document.getElementById('eventEndTime').value;

    if (!eventTitle || !eventDate) {
        alert('Por favor completa todos los campos obligatorios.');
        return;
    }

    const eventData = {
        title: eventTitle,
        description: eventDescription,
        event_date: eventDate,
        start_time: eventStartTime,
        end_time: eventEndTime
    };

    fetch(`http://127.0.0.1:5000/edit_event/${eventId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Evento actualizado exitosamente:', data);
        closeForm();
        getEvents();
    })
    .catch(error => {
        console.error('Error al actualizar evento:', error);
    });
}