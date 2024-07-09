var daily_goals_fetched;

document.addEventListener("DOMContentLoaded", function() {
    const sessionID = localStorage.getItem('sessionID');

    let selectedDate = new Date();
    localStorage.setItem('selectedDate', selectedDate.toISOString().split('T')[0]);

    updateHeader(selectedDate);

    createDailyGoalRecords(sessionID);
    getDailyGoals(selectedDate);
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
            displayGoals(data.goals); // Si obtiene los objetivos exitosamente, los muestra. Este fetch devolvería un JSON con los objetivos.
        })
        .catch(error => {
            console.error('Error al obtener los objetivos:', error);
        });
}

function displayGoals(goals) {
    const goalsContainer = document.querySelector("#goals-container");

    // Limpiar contenedor de objetivos antes de agregar nuevos elementos
    goalsContainer.innerHTML = "";

    // Iteramos sobre cada objetivo y los mostramos en pantalla.
    for (let i = 0; i < goals.length; i++) {
        let goal = goals[i];
        let goalDiv = document.createElement("div");
        goalDiv.setAttribute("class", "goal-div");
        goalDiv.setAttribute("data-goal-id", goal.id); // Almacenar el ID del objetivo

        // Crear un p para mostrar el texto del objetivo
        let objetivoTexto = document.createElement("p");
        objetivoTexto.textContent = goal.goal;
        objetivoTexto.setAttribute("class", "goal-text");

        // Crear el botón para editar el objetivo
        let editarObjetivoButton = crearEditarGoalButton(goalDiv, objetivoTexto);

        // Crear el botón para eliminar el objetivo
        let removerObjetivoButton = crearRemoveGoalButton(goalDiv);

        // Appenddeamos todo al div
        goalDiv.append(objetivoTexto);
        goalDiv.append(editarObjetivoButton);
        goalDiv.append(removerObjetivoButton);

        // Appenddeamos el goalDiv que contiene todos los elementos al goalsContainer
        goalsContainer.append(goalDiv);
    }
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
    // Verificar que el input no esté vacío
    if (!objetivoInput.value.trim()) {
        return; // si el input está vacío, no hace nada.
    }

    agregandoObjetivo = false;

    //creo un objeto con los datos del objetivo que deben añadirse a la base de datos
    const objetivoData = {
        goal: objetivoInput.value.trim(), // Obtener el texto del objetivo
        user_id: localStorage.getItem('sessionID') // Obtener el ID de usuario del localStorage
    };

    // Acá se agrega a la base de datos (fetch)
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

    // Borramos y añadimos lo necesario
    goalDiv.innerHTML = ""; // Borramos todo el contenido del div del objetivo

    let objetivoTexto = crearTextoObjetivo(objetivoInput);
    let editarButton = crearEditarGoalButton(goalDiv, objetivoTexto);
    let removeButton = crearRemoveGoalButton(goalDiv);
    
    goalDiv.append(objetivoTexto); // Ahora le agregamos el texto plano del input
    goalDiv.append(editarButton); // Agregamos el botón de editar objetivo
    goalDiv.append(removeButton); // Agregamos el botón de eliminar objetivo
    daily_goals_fetched = false;
}

function confirmGoalEdit(goalDiv, objetivoInput) {
    if (!objetivoInput.value.trim()) {
        return;
    }

    const goalId = goalDiv.getAttribute('data-goal-id');
    const objetivoData = {
        goal: objetivoInput.value.trim()  // Asegúrate de que el campo sea 'goal' para coincidir con el backend
    };

    fetch(`http://127.0.0.1:5000/edit_goal/${goalId}`, {
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

    goalDiv.innerHTML = ""; // Borramos todo el contenido del div del objetivo

    let objetivoTexto = crearTextoObjetivo(objetivoInput);
    let editarButton = crearEditarGoalButton(goalDiv, objetivoTexto);
    let removeButton = crearRemoveGoalButton(goalDiv);

    goalDiv.append(objetivoTexto);
    goalDiv.append(editarButton);
    goalDiv.append(removeButton);
    daily_goals_fetched = false;
}

function editarObjetivo(goalDiv, objetivoTexto) {
    if (agregandoObjetivo) return 
    agregandoObjetivo = true;

    goalDiv.innerHTML = ""; // Borramos todo el contenido del div del objetivo

    // Volvemos a crear un input para editar objetivo
    let nuevoInput = crearGoalsInput();
    nuevoInput.value = objetivoTexto.textContent; // para no borrar el contenido a editar
    let confirmEditButton = crearConfirmEditGoalButton(goalDiv, nuevoInput);
    let removeButton = crearRemoveGoalButton(goalDiv);

    goalDiv.append(nuevoInput);
    goalDiv.append(confirmEditButton); // Agregamos el botón de editar objetivo
    goalDiv.append(removeButton); // Agregamos el botón de eliminar objetivo

    agregandoObjetivo = false;
}

function removerObjetivo(goalDiv) {
    let goalId = goalDiv.getAttribute('data-goal-id');

    fetch(`http://127.0.0.1:5000/delete_goal/${goalId}`, {
        method: 'DELETE'
    })
    .then(response => response.ok && goalDiv.remove())
    .catch(error => console.error('Error al eliminar objetivo:', error));
    daily_goals_fetched = false;
}

function agregarDivObjetivo() {
    if(agregandoObjetivo) {
        return; // para no agregar más tareas hasta no terminar de ingresar una.
    }
    agregandoObjetivo = true; // hasta no terminar con todo lo de abajo (agregar la tarea o removerla), no se pueden agregar más tareas.
    
    const goalsContainer = document.querySelector("#goals-container");

    // creamos div de cada tarea
    let objetivoDiv = document.createElement("div");
    objetivoDiv.setAttribute("class", "goal-div");

    let input = crearGoalsInput()
    let confirmarObjetivoButton = crearConfirmGoalButton(objetivoDiv)
    let removerObjetivoButton = crearRemoveGoalButton(objetivoDiv)

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
    const year = selectedDate.getFullYear();
    const month = ('0' + (selectedDate.getMonth() + 1)).slice(-2);
    const day = ('0' + selectedDate.getDate()).slice(-2);
    const formattedDate = `${year}-${month}-${day}`;
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