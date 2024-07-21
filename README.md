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
