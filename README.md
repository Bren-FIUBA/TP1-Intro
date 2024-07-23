# Dashboard personal 
Esta aplicación web permite gestionar tareas y objetivos diarios. Los usuarios pueden añadir, editar, eliminar y marcar tareas como completadas, así como gestionar objetivos diarios que se reinician cada día. También incluye una funcionalidad de calendario para visualizar y gestionar eventos, y gráficos que permiten visualizar el progreso semanal del usuario. 

## Características 

- **Gestión de Tareas**: Añadir, editar, eliminar y marcar tareas como completadas.
- **Objetivos Diarios**: Visualizar progreso semanal, y gestionar objetivos diarios que se reinician cada día (agregar, editar eliminar, marcar como completado).
- **Eventos**: Añadir y/o eliminar eventos en el calendario.
- **Calendario**: Visualización de objetivos diarios y eventos, basados en la fecha seleccionada, permitiendole al usuario navegar entre diferentes fechas.
- **Gráficos**: Visualización del progreso semanal de los objetivos diarios.

## Instalación 
Para instalar y ejecutar esta aplicación localmente, sigue estos pasos:

1. Clona el repositorio:
  https://github.com/Bren-FIUBA/TP1-Intro.git

2. Navega al directorio donde quieras clonar el repositorio: 
  cd tu-directorio

3. Crea un entorno virtual: 
  python -m venv venv

4. Activa el entorno virtual: 
    - En Windows: venv\Scripts\activate 
    - En macOS/Linux: source venv/bin/activate

5. Instala las dependencias: 
  pip install -r requirements.txt

6. Configura la base de datos PostgreSQL y ajusta las variables de entorno necesarias en tu entorno local. (Revisa los archivos de configuración para detalles específicos).

7. Inicializa la base de datos.

8. Levanta los servidores (el que crea la aplicación flask creada en app.py, y el que sirve los archivos estáticos (html y css) desde el frontend) ejeutando estos comandos (necesitarás abrir 2 terminales y ejecutarlos simultáneamente en ambas): 
    - Para el servidor frontend: Dirígete al repositorio principal desde la terminal, ingresa a la carpeta "frontend" y ejecuta este comando: python -m http.server 8000 
    - Para el servidor backend: Sólo debes ejecutar el archivo app.py. Puedes hacerlo desde Visual Studio Code abriendo el archivo y ejecutándolo desde la terminal integrada, o desde otra terminal. Como prefieras. 

9. Una vez que la aplicación esté en funcionamiento, prueba acceder a ella desde tu navegador web en localhost:8000

ACLARACIONES DE USO
- Los objetivos diarios solo podrán crearse, desde la interfaz, para el día actual. Desde la terminal, sin embargo, se pueden cargar registros para cualquier fecha sin problema, y al iniciar sesión se crearán los registros para cada día, desde el primer registro encontrado hasta el día actual (yo creé datos con fecha del 01/07, y automáticamente se crearon registros para cada día desde el 01 hasta el 22, y manualmente fui marcando y desmarcando objetivos para que los gráficos muestren algo).
- Si el usuario no entra a la página por, por ejemplo, una semana, al volver a iniciar sesión, los registros de cada día en el que no entró se crean igual. Obviamente todos, por defecto, incompletos.
- Si ya hay objetivos creados, y el usuario quiere agregar uno nuevo, podrá hacerlo, pero tendrá, por ejemplo, 3 objetivos cuyo progeso viene registrándose desde que los creó, y un objetivo que tendrá seguimiento sólo de hoy en adelante. Pero de ahí en adelante, cada día se crearán los 4 juntos sin problema.
- Editar/Eliminar un objetivo desde la vista de administrador de objetivos editará/borrará TODOS los registros de dicho objetivo
