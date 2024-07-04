document.addEventListener("DOMContentLoaded", function() {
    fetchUserInfo(); // Llama a una función para obtener datos del usuario al cargar la página
    updateDate();
    updateClock();
});

window.onload = function() {
    updateDate(); // Actualizar la fecha al cargar la página
};

// saludo
function fetchUserInfo() {
    const sessionID = localStorage.getItem('sessionID');
    fetch(`http://127.0.0.1:5000/user_info?sessionID=${sessionID}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error(data.error);
                return;
            }
            displayUserInfo(data.user); // Si obtiene la información del usuario exitosamente, muestra el saludo personalizado.
        })
        .catch(error => {
            console.error('Error al obtener la información del usuario:', error);
        });
}

function displayUserInfo(user) {
    const usernameSpan = document.querySelector("#username");
    if (!usernameSpan) return;

    usernameSpan.textContent = user.username;

    const saludo = getSaludo();
    const dateHeader = document.querySelector(".greeting-message");
    if (dateHeader) {
        dateHeader.textContent = `${saludo}, ${user.username}.`;
    }
}

function getSaludo() {
    const hora = new Date().getHours();
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


// RELOJ
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

// FECHA
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

// CALENDARIO
// Función para generar el calendario de un mes específico
function generateCalendar(year, month) {
    const calendarGrid = document.querySelector('.calendar-grid');
    calendarGrid.innerHTML = '';

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const today = currentDate.getDate();

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const daysOfWeek = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    
    document.getElementById('calendar-title').textContent = `${monthNames[month]} ${year}`;

    // Añadir los encabezados de los días de la semana
    daysOfWeek.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.textContent = day;
        dayHeader.classList.add('calendar-weekday');
        calendarGrid.appendChild(dayHeader);
    });

    // Crear casillas para los días del mes
    for (let i = 0; i < firstDayIndex-1; i++) {
        const dayElement = document.createElement('div');
        calendarGrid.appendChild(dayElement);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.textContent = day;
        dayElement.classList.add('calendar-day');
        
        dayElement.addEventListener('click', () => {
            const selectedDate = new Date(year, month, day);
            updateHeader(selectedDate);
        });

        // Resaltar el día actual
        if (day === today && month === currentMonth && year === currentYear) {
            dayElement.classList.add('today');
        }
        calendarGrid.appendChild(dayElement);
    }
}

function changeHeaderDate(date) {
    var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
}

// Función para actualizar el encabezado con la fecha seleccionada
function updateHeader(date) {
    const formattedDate = changeHeaderDate(date);
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        dateElement.textContent = formattedDate;
    }
}

// Obtener la fecha actual
const currentDate = new Date();
let currentYear = currentDate.getFullYear();
let currentMonth = currentDate.getMonth();

// Generar calendario inicial
generateCalendar(currentYear, currentMonth);

// Manejar la navegación entre meses
document.getElementById('prev-month').addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    generateCalendar(currentYear, currentMonth);
});

document.getElementById('next-month').addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    generateCalendar(currentYear, currentMonth);
});