from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from datetime import date, datetime, timedelta
from sqlalchemy import func

# Importo los modelos de tablas que hice en el archivo models.py
from models import db, User, Task, DailyGoal

# Creamos una instancia de Flask, que es nuestra aplicación web.
app = Flask(__name__)

# Hay que configurar CORS para permitir que el servidor front-end (que está en localhost:8000) pueda hacer peticiones al servidor Flask (que está en localhost:5000). Ésta línea aplica CORS a toda la aplicación Flask, permitiendo que cualquier origen (*) pueda realizar peticiones.
CORS(app, resources={r"/*": {"origins": "http://localhost:8000"}})

bcrypt = Bcrypt(app)

# Configuramos la URI de la base de datos que SQLAlchemy usará para conectarse
app.config["SQLALCHEMY_DATABASE_URI"] = 'postgresql+psycopg2://postgres:1509199907@localhost:5432/pruebas'

# Desactivamos la funcionalidad de seguimiento de modificaciones ya que consume memoria y no suele ser necesaria.
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

app.config["SECRET_KEY"] = "bren"

# Creamos instancia de SQLAlchemy y la asociamos con la aplicación Flask que acabamos de crear. Esto inicializa SQLAlchemy con la configuración de la aplicación Flask, permitiendo que la aplicación interactúe con la base de datos de una manera más sencilla. Al crear esta instancia estamos creando un objeto de python que maneja la conexión a la base de datos y nos proporciona métodos para interactuar con ella directamente sin necesidad de escribir código en SQL.
# Permite que una instancia de SQLAlchemy creada previamente (db) se use con una aplicación Flask específica (app).
db.init_app(app)

# Para Aplicaciones Simples: db = SQLAlchemy(app) es más directo y fácil de usar.
# Para Aplicaciones Más Complejas o Modulares: db = SQLAlchemy() seguido de db.init_app(app) proporciona mayor flexibilidad y modularidad.

# --------------------------------- login-register ----------------------------------- #

# Variable global para almacenar el ID de sesión
global_session_id = None

@app.route("/register", methods=['POST'])
def register():
    data = request.get_json() # Obtengo el 'body' de la data que extraigo del formulario, la que 'postea' el usuario al hacer submit
    email = data.get('email') # 'Abro' data y le saco cada campo ya que es un json
    username = data.get('username')
    password = data.get('password')
    confirm_password = data.get('confirm_password')

    existing_user = User.query.filter_by(email=email).first()

    # Esta validación en el back es necesaria ya que no se debería confiar únicamente en la validación del frontend, los usuarios pueden deshabilitar JavaScript o manipular las solicitudes antes de que lleguen al servidor. La validación del backend garantiza que los datos que se procesan y almacenan en el servidor sean válidos.
    if not email or not username or not password or not confirm_password:
        return jsonify({'error': 'Por favor, completa todos los campos.'}), 400

    elif password != confirm_password:
        return jsonify({'error': 'Las contraseñas no coinciden.'}), 400

    elif existing_user:
        return jsonify({'error': 'Ya existe un usuario registrado con este email.'}), 400
    else: # registro exitoso!
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        new_user = User(email=email, username=username, password=hashed_password)
        db.session.add(new_user)
        db.session.commit()
        return jsonify({'message': 'Usuario registrado exitosamente.'}), 200

@app.route("/login", methods=['POST', 'GET'])
def login():
    global global_session_id
    if request.method == 'POST':
        data = request.get_json() # Obtengo el 'body' de la data que extraigo del formulario, la que 'postea' el usuario al hacer submit
        email = data.get('email') # 'Abro' data y le saco cada campo ya que es un json
        password = data.get('password')
    
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            if bcrypt.check_password_hash(existing_user.password, password):

                # Al iniciar sesión con éxito:

                # Ahora la variable global que tiene el id del usuario es la del usuario que acaba de iniciar sesión
                global_session_id = existing_user.id
                return jsonify({'message': 'Iniciando Sesión.', 'sessionID': existing_user.id}), 200
            else:
                return jsonify({'error': 'Contraseña incorrecta.'}), 400
        else:
            return jsonify({'error': 'No existe ningún usuario registrado con este email.'}), 400
        

@app.route("/dashboard", methods=['GET'])
def dashboard():
    global global_session_id
    session_id = request.args.get('sessionID')

    # Si el usuario ingresa una ID manualmente en la URL o si no inició sesión aún
    if global_session_id is None or str(global_session_id) != session_id:
        return jsonify({'error': 'No autorizado. Debes iniciar sesión para acceder a esta página. Redirigiendo a /login'}), 401

    user = User.query.filter_by(id=session_id).first()
    return jsonify({'message': 'Bienvenido al dashboard.', 'user_id': user.id, 'username': user.username}), 200

# ----------------------------------------------------------------------------- #

# --------------------------------- greeting ----------------------------------- #
@app.route("/user_info", methods=['GET'])
def user_info():
    session_id = request.args.get('sessionID')
    user = User.query.filter_by(id=session_id).first()

    if not user:
        return jsonify({'error': 'Usuario no encontrado.'}), 404

    return jsonify({'user': {'username': user.username}}), 200

# ----------------------------------------------------------------------------- #

# ---------------------------------to-do div----------------------------------- #
@app.route("/add_task", methods=['POST'])
def add_task():
    data = request.get_json() # convertimos a tareaDara en json

    # Crear una nueva tarea
    nueva_tarea = Task( # se añade un registro con tareaData (data) a la tabla Task
        task_text=data.get('task_text'),
        completed=data.get('completed'),
        user_id=data.get('user_id')
    )

    db.session.add(nueva_tarea)
    db.session.commit()

    return jsonify({'message': 'Tarea agregada exitosamente.', 'task_id': nueva_tarea.id}), 200

@app.route("/delete_task/<int:task_id>", methods=['DELETE'])
def delete_task(task_id):
    # Buscar la tarea por ID en la base de datos
    tarea_a_eliminar = Task.query.get(task_id)

    # Eliminar la tarea de la base de datos
    db.session.delete(tarea_a_eliminar)
    db.session.commit()
    return jsonify({'message': 'Tarea eliminada correctamente.'}), 200

@app.route("/edit_task/<int:task_id>", methods=['PUT'])
def edit_task(task_id):
    data = request.get_json()

    # Buscar la tarea por ID en la base de datos
    tarea_a_editar = Task.query.get(task_id)

    # Actualizar los datos de la tarea
    tarea_a_editar.task_text = data.get('task_text')
    db.session.commit()
    return jsonify({'message': 'Tarea editada correctamente.'}), 200

@app.route("/complete_task/<int:task_id>", methods=['PUT'])
def complete_task(task_id):
    tarea_a_completar = Task.query.get(task_id) # buscamos la tarea

    tarea_a_completar.completed = request.json.get('completed') # obtiene el valor de la clave completed del cuerpo JSON de la solicitud (true o false). Este valor se asigna al atributo completed de la tarea (tarea_a_completar).
    db.session.commit()
    return jsonify({'message': 'Estado de tarea actualizado correctamente.'}), 200

@app.route("/get_tasks", methods=['GET'])
def get_tasks():
    session_id = request.args.get('sessionID')
    user = User.query.filter_by(id=session_id).first()

    tasks = Task.query.filter_by(user_id=user.id).all()
    tasks_list = [{'id': task.id, 'task_text': task.task_text, 'completed': task.completed} for task in tasks]

    return jsonify({'tasks': tasks_list}), 200

# --------------------------------- goals (config) --------------------------------- #
@app.route("/add_goal", methods=['POST'])
def add_goal():
    data = request.get_json()

    # Crear un nuevo objetivo diario
    nuevo_objetivo = DailyGoal(
        goal=data.get('goal'),  # Asegúrate de que 'goal_text' sea el nombre correcto del campo
        completed=False,  # Ajusta según tus necesidades o el valor enviado desde el frontend
        user_id=data.get('user_id')
    )

    db.session.add(nuevo_objetivo)
    db.session.commit()

    return jsonify({'message': 'Objetivo agregado exitosamente.', 'goal_id': nuevo_objetivo.id}), 200


@app.route("/delete_goal/<int:goal_id>", methods=['DELETE'])
def delete_goal(goal_id):
    # Buscar el objetivo por ID en la base de datos
    objetivo_a_eliminar = DailyGoal.query.get(goal_id)

    # Eliminar el objetivo de la base de datos
    db.session.delete(objetivo_a_eliminar)
    db.session.commit()
    return jsonify({'message': 'Objetivo eliminado correctamente.'}), 200

@app.route("/edit_goal/<int:goal_id>", methods=['PUT'])
def edit_goal(goal_id):
    data = request.get_json()

    # Buscar el objetivo por ID en la base de datos
    objetivo_a_editar = DailyGoal.query.get(goal_id)
    if not objetivo_a_editar:
        return jsonify({'error': 'Objetivo no encontrado.'}), 404

    # Actualizar los datos del objetivo
    objetivo_a_editar.goal = data.get('goal')
    db.session.commit()
    return jsonify({'message': 'Objetivo editado correctamente.'}), 200

@app.route("/get_goals", methods=['GET'])
def get_goals():
    session_id = request.args.get('sessionID')
    user = User.query.filter_by(id=session_id).first()

    goals = DailyGoal.query.filter_by(user_id=user.id).order_by(DailyGoal.id).all()
    goals_list = [{'id': goal.id, 'goal': goal.goal, 'completed': goal.completed} for goal in goals]

    return jsonify({'goals': goals_list}), 200

# --------------------------------- daily goals --------------------------------- #
@app.route("/create_daily_goal_records", methods=['POST'])
def create_daily_goal_records():
    session_id = request.json.get('sessionID')
    user = User.query.filter_by(id=session_id).first()

    # Obtener la última fecha de objetivos diarios del usuario
    last_goal = DailyGoal.query.filter_by(user_id=user.id).order_by(DailyGoal.date.desc()).first()
    last_date = last_goal.date if last_goal else date.today() - timedelta(days=1)

    print(f'Última fecha de objetivos diarios: {last_date}')

    # Crear registros diarios para cada día desde la última fecha de objetivos hasta hoy
    current_date = last_date + timedelta(days=1)  # Empezamos desde el día siguiente al último registrado
    while current_date <= date.today():
        existing_goals = DailyGoal.query.filter_by(user_id=user.id, date=current_date).all()

        if not existing_goals:
            # Subconsulta para obtener el objetivo más antiguo para cada (user_id, goal)
            subquery = db.session.query(
                DailyGoal.goal,
                DailyGoal.user_id,
                func.min(DailyGoal.date).label('min_date')
            ).filter_by(user_id=user.id).group_by(DailyGoal.goal, DailyGoal.user_id).subquery()

            # Consulta principal para obtener los registros completos para el día actual
            goals = db.session.query(DailyGoal).join(
                subquery,
                (DailyGoal.goal == subquery.c.goal) &
                (DailyGoal.user_id == subquery.c.user_id) &
                (DailyGoal.date == subquery.c.min_date)
            ).all()

            # Crear registros solo para los objetivos que aún no existen para el día actual
            for goal in goals:
                new_record = DailyGoal(
                    goal=goal.goal,
                    completed=False,
                    user_id=user.id,
                    date=current_date
                )
                db.session.add(new_record)

        current_date += timedelta(days=1)

    db.session.commit()

    return jsonify({'message': 'Registros diarios creados.'}), 200

@app.route("/get_daily_goals", methods=['GET'])
def get_daily_goals():
    session_id = request.args.get('sessionID')
    user = User.query.filter_by(id=session_id).first()

    # Obtener la fecha seleccionada desde el frontend (formato esperado: 'YYYY-MM-DD')
    selected_date_str = request.args.get('selectedDate')
    if selected_date_str:
        selected_date = datetime.strptime(selected_date_str, '%Y-%m-%d').date()
    else:
        selected_date = datetime.today().date()

    # Obtener los objetivos diarios del usuario para la fecha seleccionada
    daily_goals = DailyGoal.query.filter_by(user_id=user.id, date=selected_date).order_by(DailyGoal.id).all()

    daily_goals_list = [{
        'id': goal.id,
        'goal': goal.goal,
        'completed': goal.completed,
        'date': goal.date.strftime('%Y-%m-%d')
    } for goal in daily_goals]

    return jsonify(daily_goals_list), 200


# Endpoint para marcar un objetivo diario como completado
@app.route("/complete_daily_goal", methods=['POST'])
def mark_daily_goal_completed():
    goal_id = request.json.get('goal_id')
    completed = request.json.get('completed')
    selected_date = request.json.get('date')

    if selected_date:
        selected_date = datetime.strptime(selected_date, '%Y-%m-%d').date()
    else:
        selected_date = datetime.now().date()

    daily_goal = DailyGoal.query.get(goal_id)
    if daily_goal:
        daily_goal.completed = completed
        db.session.commit()
        return jsonify({'message': 'Daily goal updated successfully'}), 200
    else:
        return jsonify({'error': 'Daily goal not found'}), 404


if __name__ == "__main__":
    with app.app_context(): # Para sólo crear las tablas si no existen.
        db.create_all()
    app.run(debug=True)