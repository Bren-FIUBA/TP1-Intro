var daily_goals_fetched;

document.addEventListener("DOMContentLoaded", function() {
    const sessionID = localStorage.getItem("sessionID");
    let selectedDate = new Date();
    localStorage.setItem("selectedDate", selectedDate.toISOString().split("T")[0]);

    updateHeader(selectedDate);
    createDailyGoalRecords(sessionID);
    getDailyGoals(selectedDate);
    getDailyProgress(selectedDate); // Obtiene el progreso diario para la fecha actual
    getWeeklyProgress(selectedDate); // Obtiene el progreso semanal para la fecha actual
    getEvents(selectedDate);
    getTasks();
    daily_goals_fetched = true;
});

function logout() {
    localStorage.clear(); // Limpiar localStorage
    window.location.href = "http://localhost:8000/";
}
function getCurrentDateInTimeZone() {
    const timezone = "America/Argentina/Buenos_Aires"; // Ajusta esto a tu zona horaria configurada
    const now = new Date();
    const dateString = now.toLocaleString("en-US", { timeZone: timezone });
    const currentDate = new Date(dateString);
    currentDate.setHours(0, 0, 0, 0);
    return currentDate;
}
function getData(endpoint, selectedDate = new Date()) {
    const sessionID = localStorage.getItem("sessionID");
    selectedDate.setHours(0, 0, 0, 0); // Normaliza la hora a medianoche
    const formattedDate = selectedDate.toISOString().split("T")[0];
    let url = "http://127.0.0.1:5000/" + endpoint + "?sessionID=" + sessionID;

    if (endpoint === "get_daily_goals" || endpoint === "get_events") {
        url += "&selectedDate=" + formattedDate;
    }

    fetch(url)
        .then(response => {
            return response.json();
        })
        .then(data => {
            if (data.error) {
                console.error(data.error);
                return;
            }
            switch (endpoint) {
                case "get_tasks":
                    displayTasks(data.tasks);
                    break;
                case "get_goals":
                    displayGoals(data.goals);
                    break;
                case "get_daily_goals":
                    displayDailyGoals(data);
                    break;
                case "get_events":
                    displayEvents(data.events);
                    break;
                default:
                    console.error("Endpoint no encontrado:", endpoint);
            }
        })
        .catch(error => {
            console.error(`Error al obtener ${endpoint}:`, error);
        });
}
function deleteData(endpoint, elementId, body = null) {
    let url = "http://127.0.0.1:5000/" + endpoint;
    if (endpoint === "delete_task" || endpoint === "delete_event") {
        url += "/" + elementId;
    }
    const options = {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
    };
    if (body) {
        options.body = JSON.stringify(body);
    }
    fetch(url, options)
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error("Error al intentar eliminar el recurso desde el servidor.");
            }
        })
        .then(data => {
            console.log("Elemento eliminado correctamente:", data);
        })
        .catch(error => {
            console.error(`Error al eliminar elemento:`, error);
        });
}
function createButton(type, value, onClickFunction, className) {
    let button = document.createElement("input");
    button.type = type;
    button.value = value;
    button.setAttribute("class", className);
    button.onclick = onClickFunction;
    return button;
}

// ---------------------------------- Handle Views ----------------------------------
function showMainDiv() {
    const mainDiv = document.getElementById("main-div");
    const configDiv = document.getElementById("daily-goals-config-div");
    mainDiv.style.display = "flex";
    configDiv.style.display = "none";
    if (!daily_goals_fetched) { 
        location.reload()
        daily_goals_fetched = true;
    }
}
function showDailyGoalsConfig() {
    const mainDiv = document.getElementById("main-div");
    const configDiv = document.getElementById("daily-goals-config-div");
    mainDiv.style.display = "none";
    configDiv.style.display = "flex";
    configDiv.style.visibility = "visible";
    configDiv.style.height = "100%";
    const goalsContainer = document.getElementById("daily-goals-config-card");
    goalsContainer.style.padding = "10px"; 
    goalsContainer.style.overflowY = "auto"; 
    goalsContainer.style.scrollbarWidth = "thin";
    goalsContainer.style.scrollbarColor = "transparent transparent"
    goalsContainer.style.transition.scrollbarColor = "0.3s ease";
    getGoals();
}

// ---------------------------------- To-do"s ----------------------------------
let agregandoTarea = false;

function getTasks() { getData("get_tasks") }

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
        checkbox.addEventListener("change", function() {
            marcarCheckboxTarea(task.id, checkbox.checked);
        });

        // Crear un p para mostrar el texto de la tarea
        let tareaTexto = document.createElement("p");
        tareaTexto.textContent = task.task_text;
        tareaTexto.setAttribute("class", "task-text");

        let editarTareaButton = crearEditarButton(taskDiv, tareaTexto);
        let removerTareaButton = createButton("button", "❌", function() { removerTarea(taskDiv) }, "remove-task-button");

        taskDiv.append(checkbox);
        taskDiv.append(tareaTexto);
        taskDiv.append(editarTareaButton);
        taskDiv.append(removerTareaButton);
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
    if (!tareaInput.value.trim()) { // Verificar que el input no esté vacío
        return; // si el input está vacío, no hace nada.
    }
    agregandoTarea = false;
    const tareaData = {
        task_text: tareaInput.value.trim(), // Obtener el texto de la tarea
        completed: false, 
        user_id: localStorage.getItem("sessionID") // Obtener el ID de usuario del localStorage
    };
    fetch("http://127.0.0.1:5000/add_task", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(tareaData),
    })
    .then(response => response.json())
    .then(data => {
        console.log("Tarea agregada exitosamente:", data);
        // Agregar el ID de la tarea al div
        taskDiv.setAttribute("data-task-id", data.task_id);
    })
    .catch(error => {
        console.error("Error al agregar tarea:", error);
    });

    taskDiv.innerHTML = ""; // Borramos todo el contenido del div de la tarea
    let checkbox = crearCheckbox();
    let tareaTexto = crearTextoTarea(tareaInput);
    let editarButton = crearEditarButton(taskDiv, tareaTexto);
    let removeButton = createButton("button", "❌", function() { removerTarea(taskDiv) }, "remove-task-button");
    
    taskDiv.append(checkbox); // Al div de la tarea, vacío, le agregamos el checkbox
    taskDiv.append(tareaTexto); // Ahora le agregamos el texto plano del input
    taskDiv.append(editarButton); // Agregamos el botón de editar tarea
    taskDiv.append(removeButton); // Agregamos el botón de eliminar tarea
}
function confirmarEdit(taskDiv, tareaInput) {
    if (!tareaInput.value.trim()) { // Verificar que el input no esté vacío
        return; // si el input está vacío, no hace nada.
    }

    agregandoTarea = false;
    const taskId = taskDiv.getAttribute("data-task-id");
    const tareaData = {
        task_id: taskId,
        task_text: tareaInput.value.trim()
    };
    fetch(`http://127.0.0.1:5000/edit_task/${taskId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(tareaData),
    })
    .then(response => {
        if (response.ok) {
            console.log(`Tarea con ID ${taskId} editada correctamente.`);
            let tareaTexto = taskDiv.querySelector(".task-text"); // Actualizar visualmente el texto de la tarea
            tareaTexto.textContent = tareaInput.value.trim();
        } else {
            console.error("Error al intentar editar la tarea desde el servidor.");
        }
    })
    .catch(error => {
        console.error("Error al editar tarea:", error);
    });

    taskDiv.innerHTML = ""; // Borramos todo el contenido del div de la tarea
    let checkbox = crearCheckbox();
    let tareaTexto = crearTextoTarea(tareaInput);
    let editarButton = crearEditarButton(taskDiv, tareaTexto);
    let removeButton = createButton("button", "❌", function() { removerTarea(taskDiv) }, "remove-task-button");
    
    taskDiv.append(checkbox); // Al div de la tarea, vacío, le agregamos el checkbox
    taskDiv.append(tareaTexto); // Ahora le agregamos el texto plano del input
    taskDiv.append(editarButton); // Agregamos el botón de editar tarea
    taskDiv.append(removeButton); // Agregamos el botón de eliminar tarea
}
function editarTarea(taskDiv, tareaTexto) {
    agregandoTarea = true;
    taskDiv.innerHTML = ""; 

    let checkbox = crearCheckbox();
    let nuevoInput = crearInput();
    nuevoInput.value = tareaTexto.textContent; // para no borrar el contenido a editar
    let confirmEditButton = createButton("button", "✔️", function() { let tareaInput = taskDiv.querySelector(".task-input"); confirmarEdit(taskDiv, tareaInput) }, "confirm-edit-button");
    let removeButton = createButton("button", "❌", function() { removerTarea(taskDiv) }, "remove-task-button");

    taskDiv.append(checkbox);
    taskDiv.append(nuevoInput); 
    taskDiv.append(confirmEditButton); // Agregamos el botón de editar tarea
    taskDiv.append(removeButton); // Agregamos el botón de eliminar tarea
}
function removerTarea(taskDiv) {
    const taskId = taskDiv.getAttribute("data-task-id");
    deleteData("delete_task", taskId);
    taskDiv.remove();
}
function marcarCheckboxTarea(taskId, completed) {
    const tareaData = {
        task_id: taskId,
        completed: completed
    };
    fetch(`http://127.0.0.1:5000/complete_task/${taskId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(tareaData),
    })
    .then(response => {
        if (response.ok) {
            console.log(`Estado de tarea con ID ${taskId} actualizado correctamente.`);
        } else {
            console.error("Error al actualizar estado de tarea desde el servidor.");
        }
    })
    .catch(error => {
        console.error("Error al actualizar estado de tarea:", error);
    });
}
function agregarDivTarea() {
    if(agregandoTarea) {
        return; // para no agregar más tareas hasta no terminar de ingresar una.
    }

    agregandoTarea = true; // hasta no terminar con todo lo de abajo (agregar la tarea o removerla), no se pueden agregar más tareas.
    const tasksContainer = document.querySelector(".tasks-container");
    let taskDiv = document.createElement("div");
    taskDiv.setAttribute("class", "task-div");
    let input = crearInput();
    let confirmButton = createButton("button", "✔️", function() { let tareaInput = taskDiv.querySelector(".task-input"); confirmarTarea(taskDiv, tareaInput) }, "remove-task-button");

    taskDiv.append(input);
    taskDiv.append(confirmButton);
    tasksContainer.append(taskDiv);
    // Para que al agregar una tarea, el div "scrollee" y lleve al usuario a la nueva tarea.
    taskDiv.scrollIntoView({ behavior: "smooth", block: "end" });
}

// ---------------------------------- Goals (config) ----------------------------------
let agregandoObjetivo = false;

function getGoals() { getData("get_goals") }
function displayGoals(goals) {
    const goalsContainer = document.querySelector("#goals-container");
    goalsContainer.innerHTML = "";
    for (let i = 0; i < goals.length; i++) {
        let goalDiv = document.createElement("div");
        goalDiv.setAttribute("class", "goal-div");
        goalDiv.setAttribute("data-goal-id", goal.id); // Almacenar el ID del objetivo

        let objetivoTexto = document.createElement("p");
        objetivoTexto.textContent = goal.goal;
        objetivoTexto.setAttribute("class", "goal-text");
        let editarObjetivoButton = crearEditarGoalButton(goalDiv, objetivoTexto);
        let removerObjetivoButton = createButton("button", "❌", function() { removerObjetivo(goalDiv) }, "remove-goal-button");

        goalDiv.append(objetivoTexto);
        goalDiv.append(editarObjetivoButton);
        goalDiv.append(removerObjetivoButton);
        goalsContainer.append(goalDiv);
    };
}
function crearGoalsInput() {
    let objetivo = document.createElement("input");
    objetivo.type = "text";
    objetivo.setAttribute("class", "goal-input");
    return objetivo;
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
        user_id: localStorage.getItem("sessionID")
    };
    fetch("http://127.0.0.1:5000/add_goal", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(objetivoData),
    })
    .then(response => response.json())
    .then(data => {
        console.log("Objetivo agregado exitosamente:", data);
        goalDiv.setAttribute("data-goal-id", data.goal_id);
    })
    .catch(error => {
        console.error("Error al agregar objetivo:", error);
    });
    goalDiv.innerHTML = "";
    let objetivoTexto = crearTextoObjetivo(objetivoInput);
    let editarButton = crearEditarGoalButton(goalDiv, objetivoTexto);
    let removeButton = createButton("button", "❌", function() { removerObjetivo(goalDiv) }, "remove-goal-button");

    goalDiv.append(objetivoTexto);
    goalDiv.append(editarButton);
    goalDiv.append(removeButton);
    daily_goals_fetched = false;
}
function confirmGoalEdit(goalDiv, objetivoInput) {
    if (!objetivoInput.value.trim()) {
        return;
    }
    const goalId = goalDiv.getAttribute("data-goal-id");
    const objetivoData = {
        goal_id: goalId,
        goal: objetivoInput.value.trim()
    };
    fetch(`http://127.0.0.1:5000/edit_goal`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(objetivoData),
    })
    .then(response => {
        if (response.ok) {
            console.log(`Objetivo con ID ${goalId} editado correctamente.`);
            let objetivoTexto = goalDiv.querySelector(".goal-text");
            objetivoTexto.textContent = objetivoInput.value.trim();
        } else {
            console.error("Error al intentar editar el objetivo desde el servidor.");
            response.json().then(data => {
                console.error("Detalles del error:", data);
            });
        }
    })
    .catch(error => {
        console.error("Error al editar objetivo:", error);
    });
    goalDiv.innerHTML = "";
    let objetivoTexto = crearTextoObjetivo(objetivoInput);
    let editarButton = crearEditarGoalButton(goalDiv, objetivoTexto);
    let removeButton = crearButton("button", "❌", function() { removerObjetivo(goalDiv) }, "remove-goal-button");

    goalDiv.append(objetivoTexto);
    goalDiv.append(editarButton);
    goalDiv.append(removeButton);
    agregandoObjetivo = false;
    daily_goals_fetched = false;
}
function editarObjetivo(goalDiv, objetivoTexto) {
    let objetivoInput = crearGoalsInput();
    objetivoInput.value = objetivoTexto.textContent;
    agregandoObjetivo = true;
    goalDiv.innerHTML = "";
    let confirmarEdicionButton = createButton("button", "✔️", function() { let objetivoInput = goalDiv.querySelector(".goal-input"); confirmGoalEdit(goalDiv, objetivoInput); }, "confirm-goal-button");
    let removerObjetivoButton = createButton("button", "❌", function() { removerObjetivo(goalDiv) }, "remove-goal-button");

    goalDiv.append(objetivoInput);
    goalDiv.append(confirmarEdicionButton);
    goalDiv.append(removerObjetivoButton);
}
function removerObjetivo(goalDiv) {
    const goalId = goalDiv.getAttribute("data-goal-id");
    deleteData("delete_goal", null, { goal_id: goalId });
    goalDiv.remove();
    daily_goals_fetched = false;
}
function agregarDivObjetivo() {
    if(agregandoObjetivo) {
        return; // para no agregar más tareas hasta no terminar de ingresar una.
    }
    agregandoObjetivo = true; // hasta no terminar con todo lo de abajo (agregar la tarea o removerla), no se pueden agregar más tareas.
    const goalsContainer = document.querySelector("#goals-container");
    let objetivoDiv = document.createElement("div");
    objetivoDiv.setAttribute("class", "goal-div");

    let input = crearGoalsInput();
    let confirmarObjetivoButton = crearButton("button", "✔️", function() { let objetivoInput = objetivoDiv.querySelector(".goal-input")
        confirmarObjetivo(objetivoDiv, objetivoInput) }, "confirm-goal-button");

    objetivoDiv.append(input);
    objetivoDiv.append(confirmarObjetivoButton);
    goalsContainer.append(objetivoDiv);

    // Para que al agregar una tarea, el div "scrollee" y lleve al usuario a la nueva tarea.
    objetivoDiv.scrollIntoView({ behavior: "smooth", block: "end" });
    goalsContainer.appendChild(objetivoDiv);
}

// ---------------------------------- Daily Goals ----------------------------------
function getDailyGoals(selectedDate) { getData("get_daily_goals", selectedDate) }
function displayDailyGoals(daily_goals) {
    const dailyGoalsContainer = document.querySelector(".daily-goals-container");
    dailyGoalsContainer.innerHTML = ""; // Limpiar el contenedor antes de agregar nuevos objetivos

    // Iteramos sobre cada objetivo diario y los mostramos en pantalla
    for (let i = 0; i < daily_goals.length; i++) {
        let dailyGoal = daily_goals[i];
        let dailyGoalDiv = document.createElement("div");
        dailyGoalDiv.setAttribute("class", "daily-goal-div");
        dailyGoalDiv.setAttribute("data-daily-goal-id", dailyGoal.id); // Almacenar el ID del objetivo

        let checkbox = crearCheckbox();
        checkbox.checked = dailyGoal.completed;
        checkbox.addEventListener("change", function() {
            marcarCheckboxDailyGoal(dailyGoal.id, checkbox.checked);
        });

        let objetivoTexto = document.createElement("p");
        objetivoTexto.textContent = dailyGoal.goal;
        objetivoTexto.setAttribute("class", "daily-goal-text");

        dailyGoalDiv.append(checkbox);
        dailyGoalDiv.append(objetivoTexto);
        dailyGoalsContainer.append(dailyGoalDiv);
    }
}
function marcarCheckboxDailyGoal(dailyGoalId, completed, selectedDate = new Date()) {
    const sessionID = localStorage.getItem("sessionID");
    selectedDate.setHours(0, 0, 0, 0); // Normaliza la hora a medianoche en la zona horaria configurada
    const formattedDate = selectedDate.toISOString().split("T")[0];
    const url = `http://127.0.0.1:5000/complete_daily_goal?sessionID=${sessionID}&selectedDate=${formattedDate}`;
    const dailyGoalData = {
        goal_id: dailyGoalId,
        completed: completed,
        date: formattedDate  // Usa la fecha formateada
    };
    fetch(url, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(dailyGoalData),
    })
    .then(response => {
        if (response.ok) {
            selectedDate = new Date(localStorage.getItem("selectedDate"));
            getDailyProgress(selectedDate);
            getWeeklyProgress(selectedDate);
        } else {
            console.error("Error al actualizar estado del objetivo desde el servidor.");
        }
    })
    .catch(error => {
        console.error("Error al actualizar estado del objetivo:", error);
    });
}
function createDailyGoalRecords(sessionID) {
    fetch("http://127.0.0.1:5000/create_daily_goal_records", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionID: sessionID }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Error al crear registros diarios: " + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        console.log(data.message);
        getDailyGoals(new Date()); // Actualiza la lista de objetivos diarios después de crear los registros
    })
    .catch(error => {
        console.error("Error en la solicitud para crear registros diarios:", error);
    });
}

// ---------------------------------- Gráficos ----------------------------------
function getWeeklyProgress(selectedDate = new Date()) {
    const sessionID = localStorage.getItem("sessionID");
    const formattedDate = selectedDate.toISOString().split("T")[0];
    const url = `http://127.0.0.1:5000/weekly-progress?sessionID=${sessionID}&date=${formattedDate}`;
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            console.log("url a la que apunta getweeklyprogress: " + url)
            return response.json();
        })
        .then(data => {
            const maxYValue = data.length > 0 ? Math.max(...data.map(item => item.total_count)) : 0;
            renderWeeklyProgressChart(data, maxYValue);
        })
        .catch(error => {
            console.error("Error al obtener el progreso semanal:", error);
        });
}
function renderWeeklyProgressChart(data, maxYValue) {
    const ctx = document.getElementById("weekly-progress-chart").getContext("2d");
    if (window.myChart) { // para actualizar
        window.myChart.destroy();
    }
    window.myChart = new Chart(ctx, {
        type: "bar", // Tipo de gráfico (por ejemplo, barra)
        data: {
            labels: data.map(item => item.date), // Etiquetas del eje X (fechas)
            datasets: [{
                label: "Objetivos Completados",
                data: data.map(item => item.completed_count), // Datos del eje Y (cantidad)
                backgroundColor: "rgba(94, 25, 255, 0.5)", // Color de fondo de las barras
                borderColor: "rgb(94, 25, 255)", // Color del borde de las barras
                borderWidth: 1,
                barPercentage: 0.85,
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
                },
            },
        }
    });
}
function getDailyProgress(selectedDate = new Date()) {
    const sessionID = localStorage.getItem("sessionID");
    const formattedDate = selectedDate.toISOString().split("T")[0];
    const url = `http://127.0.0.1:5000/daily-progress?sessionID=${sessionID}&date=${formattedDate}`;
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            console.log("url a la que apunta getdailyprogress: " + url)
            return response.json();
        })
        .then(data => {
            renderDailyProgressChart(data);
        })
        .catch(error => {
            console.error("Error al obtener el progreso diario:", error);
        });
}
function renderDailyProgressChart(data) {
    const ctx = document.getElementById("daily-progress-chart").getContext("2d");
    const totalGoals = data.total_goals || 1; // Evitar división por 0
    const completedGoals = data.completed_goals;
    if (window.myChart2) {
        window.myChart2.destroy();
    }
    window.myChart2 = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Completados", "Incompletos"],
            datasets: [{
                data: [completedGoals, totalGoals - completedGoals],
                backgroundColor: ["rgba(94, 25, 255, 0.5)", "rgba(21, 16, 46, 0.5)"],
                borderColor: "rgb(94, 25, 255)",
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
    const eventTitle = document.getElementById("eventTitle").value.trim();
    const eventDescription = document.getElementById("eventDescription").value.trim();
    const eventDate = new Date(document.getElementById("eventDate").value);
    const eventStartTime = document.getElementById("eventStartTime").value;
    const eventEndTime = document.getElementById("eventEndTime").value;

    const selectedDateString = localStorage.getItem("selectedDate");
    const selectedDate = new Date(selectedDateString + "T00:00:00"); // Convertir a objeto Date con la hora a medianoche

    const formattedEventDate = eventDate.toISOString().split("T")[0];
    if (!eventTitle || !eventDate) { return }
    const eventData = {
        user_id: localStorage.getItem("sessionID"),
        title: eventTitle,
        description: eventDescription,
        event_date: formattedEventDate,
        start_time: eventStartTime,
        end_time: eventEndTime
    };
    fetch("http://127.0.0.1:5000/add_event", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
        })
    .then(response => response.json())
    .then(data => {
        console.log(selectedDate);
        getEvents(selectedDate);
        closeForm();
    })
    .catch(error => {
        console.error("Error al agregar evento:", error);
    });
}
function showForm() {
    const formBackground = document.getElementById("form-bg");
    const formDiv = document.getElementById("form-div");
    formBackground.style.display = "flex";
    formDiv.style.display = "block";
    document.getElementById("eventForm").reset();
}
function closeForm() {
    const formDiv = document.getElementById("form-div");
    const formBackground = document.getElementById("form-bg");
    formBackground.style.display = "none";
    formDiv.style.display = "none";
    document.getElementById("eventForm").reset();
    const eventSubmitButton = document.getElementById("eventSubmitButton");
    eventSubmitButton.value = "Agregar Evento";
    eventSubmitButton.onclick = agregarEvento;
}
function getEvents(selectedDate) { getData("get_events", selectedDate) }
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
            
            let infoDiv = document.createElement("div");
            infoDiv.classList.add("info-div")

            let time = document.createElement("h6");

            let deleteButton = createButton("button", "❌", function() { deleteEvent(event.id) }, "delete-button");

            function formatTime(timeStr) { // Función para formatear las horas
                if (!timeStr) return null;
                let [hours, minutes, seconds] = timeStr.split(":");
                if (minutes === "00" && seconds === "00") {
                    return `${hours}hs`;
                } else {
                    return `${hours}:${minutes}hs`;
                }
            }
            // Comprobar si start_time y end_time no son nulos ni vacíos
            const startTime = formatTime(event.start_time);
            const endTime = formatTime(event.end_time);

            if (startTime || endTime) { // Mostrar hora solo si está disponible
                if (startTime && endTime) {
                    time.textContent = `${startTime}\n${endTime}`;
                } else if (startTime) {
                    time.textContent = `${startTime}`;
                } else if (endTime) {
                    time.textContent = `${endTime}`;
                }
            } else {
                time.textContent = "";
            }

            title.textContent = `${event.title}`;
            title.classList.add("event-title");
            time.classList.add("event-time");
            eventTitle.classList.add("event-title-div");

            let eventDesc = document.createElement("p");
            eventDesc.textContent = event.description;
            eventDesc.classList.add("event-desc");

            eventDiv.appendChild(time);
            eventTitle.appendChild(title);
            infoDiv.appendChild(eventTitle);
            infoDiv.appendChild(eventDesc);
            eventDiv.appendChild(infoDiv);
            eventDiv.appendChild(deleteButton);
        
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
    deleteData("delete_event", eventId);
    let eventDiv = document.querySelector(`div[event-id="${eventId}"]`);
    eventDiv.remove();
}