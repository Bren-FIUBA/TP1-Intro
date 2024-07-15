from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from datetime import datetime, timedelta, time
from sqlalchemy import func
import pytz
from models import db, User, Task, DailyGoal, Event

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:8000"}})
bcrypt = Bcrypt(app)

app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql+psycopg2://postgres:1509199907@localhost:5432/pruebas"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = "bren"
app.config["TIMEZONE"] = "America/Buenos_Aires"  # Ajusta a la zona horaria deseada

timezone_app = pytz.timezone(app.config["TIMEZONE"])
db.init_app(app)

# --------------------------------- login-register ----------------------------------- #
# Variable global para almacenar el ID de sesión
global_session_id = None

def get_current_date():
    # Obtener la fecha y hora actual en la zona horaria configurada
    now = datetime.now(timezone_app)
    return now.date()

@app.route("/register", methods=["POST"])
def register():
    data = request.get_json() # Obtengo el "body" de la data que extraigo del formulario, la que "postea" el usuario al hacer submit
    email = data.get("email") # "Abro" data y le saco cada campo ya que es un json
    username = data.get("username")
    password = data.get("password")
    confirm_password = data.get("confirm_password")
    existing_user = User.query.filter_by(email=email).first()

    # Esta validación en el back es necesaria ya que no se debería confiar únicamente en la validación del frontend, los usuarios pueden deshabilitar JavaScript o manipular las solicitudes antes de que lleguen al servidor. La validación del backend garantiza que los datos que se procesan y almacenan en el servidor sean válidos.
    if not email or not username or not password or not confirm_password:
        return jsonify({"error": "Por favor, completa todos los campos."}), 400

    elif password != confirm_password:
        return jsonify({"error": "Las contraseñas no coinciden."}), 400

    elif existing_user:
        return jsonify({"error": "Ya existe un usuario registrado con este email."}), 400
    else: # registro exitoso!
        hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")
        new_user = User(email=email, username=username, password=hashed_password)
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "Usuario registrado exitosamente."}), 200

@app.route("/login", methods=["POST", "GET"])
def login():
    global global_session_id
    if request.method == "POST":
        data = request.get_json() # Obtengo el "body" de la data que extraigo del formulario, la que "postea" el usuario al hacer submit
        email = data.get("email") # "Abro" data y le saco cada campo ya que es un json
        password = data.get("password")
    
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            if bcrypt.check_password_hash(existing_user.password, password):

                # Al iniciar sesión con éxito:

                # Ahora la variable global que tiene el id del usuario es la del usuario que acaba de iniciar sesión
                global_session_id = existing_user.id
                return jsonify({"message": "Iniciando Sesión.", "sessionID": existing_user.id}), 200
            else:
                return jsonify({"error": "Contraseña incorrecta."}), 400
        else:
            return jsonify({"error": "No existe ningún usuario registrado con este email."}), 400
        
@app.route("/dashboard", methods=["GET"])
def dashboard():
    global global_session_id
    session_id = request.args.get("sessionID")

    # Si el usuario ingresa una ID manualmente en la URL o si no inició sesión aún
    if global_session_id is None or str(global_session_id) != session_id:
        return jsonify({"error": "No autorizado. Debes iniciar sesión para acceder a esta página. Redirigiendo a /login"}), 401

    user = User.query.filter_by(id=session_id).first()
    return jsonify({"message": "Bienvenido al dashboard.", "user_id": user.id, "username": user.username}), 200

# --------------------------------- greeting ----------------------------------- #
@app.route("/user_info", methods=["GET"])
def user_info():
    session_id = request.args.get("sessionID")
    user = User.query.filter_by(id=session_id).first()
    return jsonify({"user": {"username": user.username}}), 200

# ---------------------------------to-do div----------------------------------- #
@app.route("/add_task", methods=["POST"])
def add_task():
    data = request.get_json() # convertimos a tareaData en json

    nueva_tarea = Task( # se añade un registro con tareaData (data) a la tabla Task
        task_text=data.get("task_text"),
        completed=data.get("completed"),
        user_id=data.get("user_id")
    )
    db.session.add(nueva_tarea)
    db.session.commit()

    return jsonify({"message": "Tarea agregada exitosamente.", "task_id": nueva_tarea.id}), 200

@app.route("/delete_task/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    tarea_a_eliminar = Task.query.get(task_id) # Buscar la tarea por ID en la base de datos
    db.session.delete(tarea_a_eliminar)
    db.session.commit()
    return jsonify({"message": "Tarea eliminada correctamente."}), 200

@app.route("/edit_task/<int:task_id>", methods=["PUT"])
def edit_task(task_id):
    data = request.get_json()
    tarea_a_editar = Task.query.get(task_id)
    tarea_a_editar.task_text = data.get("task_text") # Actualizar los datos de la tarea
    db.session.commit()
    return jsonify({"message": "Tarea editada correctamente."}), 200

@app.route("/complete_task/<int:task_id>", methods=["PUT"])
def complete_task(task_id):
    tarea_a_completar = Task.query.get(task_id) # buscamos la tarea
    tarea_a_completar.completed = request.json.get("completed") # obtiene el valor de la clave completed del cuerpo JSON de la solicitud (true o false). Este valor se asigna al atributo completed de la tarea (tarea_a_completar).
    db.session.commit()
    return jsonify({"message": "Estado de tarea actualizado correctamente."}), 200

@app.route("/get_tasks", methods=["GET"])
def get_tasks():
    session_id = request.args.get("sessionID")
    user = User.query.filter_by(id=session_id).first()
    tasks = Task.query.filter_by(user_id=user.id).all()
    tasks_list = [{"id": task.id, "task_text": task.task_text, "completed": task.completed} for task in tasks]

    return jsonify({"tasks": tasks_list}), 200

# --------------------------------- goals (config) --------------------------------- #
@app.route("/add_goal", methods=["POST"])
def add_goal():
    data = request.get_json()
    nuevo_objetivo = DailyGoal(
        goal=data.get("goal"),  # Asegúrate de que "goal" sea el nombre correcto del campo
        completed=False,  # Ajusta según tus necesidades o el valor enviado desde el frontend
        user_id=data.get("user_id")
    )
    db.session.add(nuevo_objetivo)
    db.session.commit()

    return jsonify({"message": "Objetivo agregado exitosamente.", "goal_id": nuevo_objetivo.id}), 200

@app.route("/delete_goal", methods=["DELETE"])
def delete_goal():
    goal_id = request.json.get("goal_id")
    original_goal = DailyGoal.query.get(goal_id) # Obtener el objetivo diario original
    user_id = original_goal.user_id
    original_goal_text = original_goal.goal

    # Eliminar todos los registros con el texto del objetivo original
    DailyGoal.query.filter_by(user_id=user_id, goal=original_goal_text).delete()
    db.session.commit()

    return jsonify({'message': 'Objetivo eliminado exitosamente'}), 200

@app.route("/edit_goal", methods=["PUT"])
def edit_goal():
    goal_id = request.json.get("goal_id")
    new_goal_text = request.json.get("goal")

    # Obtener el objetivo diario original
    original_goal = DailyGoal.query.get(goal_id)
    if not original_goal:
        return jsonify({"error": "Daily goal not found"}), 404

    user_id = original_goal.user_id
    original_goal_text = original_goal.goal

    # Actualizar todos los registros con el texto del objetivo original
    DailyGoal.query.filter_by(user_id=user_id, goal=original_goal_text).update({"goal": new_goal_text})
    db.session.commit()

    return jsonify({"message": "Objetivo editado correctamente"}), 200

@app.route("/get_goals", methods=["GET"])
def get_goals():
    session_id = request.args.get("sessionID")
    user = User.query.filter_by(id=session_id).first()

    if not user:
        return jsonify({"error": "Usuario no encontrado."}), 404

    # Subconsulta para obtener el objetivo más antiguo para cada (user_id, goal)
    subquery = db.session.query(
        DailyGoal.goal,
        DailyGoal.user_id,
        func.min(DailyGoal.date).label("min_date")
    ).filter_by(user_id=user.id).group_by(DailyGoal.goal, DailyGoal.user_id).subquery()

    # Consulta principal para obtener los registros completos
    goals = db.session.query(DailyGoal).join(
        subquery,
        (DailyGoal.goal == subquery.c.goal) &
        (DailyGoal.user_id == subquery.c.user_id) &
        (DailyGoal.date == subquery.c.min_date)
    ).all()

    goals_list = [{"id": goal.id, "goal": goal.goal, "completed": goal.completed} for goal in goals]

    return jsonify({"goals": goals_list}), 200

# --------------------------------- daily goals --------------------------------- #
@app.route("/create_daily_goal_records", methods=["POST"])
def create_daily_goal_records():
    session_id = request.json.get("sessionID")
    user = User.query.filter_by(id=session_id).first()

    # Obtener la última fecha de objetivos diarios del usuario
    last_goal = DailyGoal.query.filter_by(user_id=user.id).order_by(DailyGoal.date.desc()).first()
    last_date = last_goal.date if last_goal else get_current_date() - timedelta(days=1)

    # Crear registros diarios para cada día desde la última fecha de objetivos hasta hoy
    current_date = last_date + timedelta(days=1)  # Empezamos desde el día siguiente al último registrado

    # Este while es para crear todos los registros de cada día en el que el usuario no ingresó a la página
    while current_date <= get_current_date():
        existing_goals = DailyGoal.query.filter_by(user_id=user.id, date=current_date).all()

        if not existing_goals:
            # Subconsulta para obtener el objetivo más antiguo para cada (user_id, goal)
            subquery = db.session.query(
                DailyGoal.goal,
                DailyGoal.user_id,
                func.min(DailyGoal.date).label("min_date")
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

    return jsonify({"message": "Registros diarios creados."}), 200

@app.route("/get_daily_goals", methods=["GET"])
def get_daily_goals():
    session_id = request.args.get("sessionID")
    user = User.query.filter_by(id=session_id).first()

    # Obtener la fecha seleccionada desde el frontend (formato esperado: "YYYY-MM-DD")
    selected_date_str = request.args.get("selectedDate")
    if selected_date_str:
        selected_date = datetime.strptime(selected_date_str, "%Y-%m-%d").date()
    else:
        selected_date = get_current_date()

    # Obtener los objetivos diarios del usuario para la fecha seleccionada
    daily_goals = DailyGoal.query.filter_by(user_id=user.id, date=selected_date).order_by(DailyGoal.id).all()
    daily_goals_list = [{ "id": goal.id, "goal": goal.goal, "completed": goal.completed, "date": goal.date.strftime("%Y-%m-%d") } for goal in daily_goals]

    return jsonify(daily_goals_list), 200

# Endpoint para marcar un objetivo diario como completado
@app.route("/complete_daily_goal", methods=["PUT"])
def mark_daily_goal_completed():
    goal_id = request.json.get("goal_id")
    completed = request.json.get("completed")
    selected_date = request.json.get("date")

    if selected_date:
        selected_date = datetime.strptime(selected_date, "%Y-%m-%d").date()
    else:
        selected_date = get_current_date()

    daily_goal = DailyGoal.query.get(goal_id)
    if daily_goal:
        daily_goal.completed = completed 
        db.session.commit()
        return jsonify({"message": "Estado del objetivo diario actualizado correctamente."}), 200
    else:
        return jsonify({"error": "Daily goal not found"}), 404

# --------------------------------- gráficos --------------------------------- #
@app.route("/weekly-progress", methods=["GET"])
def get_weekly_progress():
    session_id = request.args.get("sessionID") 
    user = User.query.filter_by(id=session_id).first()
    selected_date = request.args.get("date")

    if selected_date:
        selected_date = datetime.strptime(selected_date, "%Y-%m-%d").date()
    else:
        selected_date = get_current_date()

    week_start = selected_date - timedelta(days=6)
    week_end = selected_date

    weekly_progress = db.session.query(
        func.date(DailyGoal.date),
        func.count(DailyGoal.id).label("completed_count")
    ).filter(
        DailyGoal.date.between(week_start, week_end),
        DailyGoal.user_id == user.id,
        DailyGoal.completed == True
    ).group_by(func.date(DailyGoal.date)).order_by(func.date(DailyGoal.date)).all()

    # Crear un diccionario con todas las fechas de la semana inicializadas a 0 completados
    progress_dict = { (week_start + timedelta(days=i)): 0 for i in range(7) }

    # Actualizar el diccionario con los datos obtenidos
    for date, completed_count in weekly_progress:
        progress_dict[date] = completed_count

    # Convertir el diccionario a la lista de datos que espera el frontend
    progress_data = [{
        "date": date.strftime("%Y-%m-%d"),
        "completed_count": completed_count,
        "total_count": db.session.query(func.count(DailyGoal.id)).filter_by(date=date, user_id=user.id).scalar()
    } for date, completed_count in progress_dict.items()]

    return jsonify(progress_data)

@app.route("/daily-progress", methods=["GET"])
def get_daily_progress():
    session_id = request.args.get("sessionID")  # Obtener sessionID del query string
    user = User.query.filter_by(id=session_id).first()

    selected_date = request.args.get("date")
    if selected_date:
        selected_date = datetime.strptime(selected_date, "%Y-%m-%d").date()
    else:
        selected_date = get_current_date()

    total_goals = db.session.query(func.count(DailyGoal.id)).filter_by(date=selected_date, user_id=user.id).scalar()
    completed_goals = db.session.query(func.count(DailyGoal.id)).filter_by(date=selected_date, user_id=user.id, completed=True).scalar()

    return jsonify({
        "total_goals": total_goals,
        "completed_goals": completed_goals
    })

# --------------------------------- agenda --------------------------------- #
@app.route("/add_event", methods=["POST"])
def add_event():  
    data = request.get_json()
    start_time = data.get("start_time")
    end_time = data.get("end_time")
    
    if not start_time or start_time=="":
        start_time = None
    else:
        start_time = time.fromisoformat(start_time)

    if not end_time or end_time=="":
        end_time = None
    else:
        end_time = time.fromisoformat(end_time)
        
    nuevo_evento = Event(
        user_id=data.get("user_id"),
        title=data.get("title"),
        description=data.get("description"),
        event_date=data.get("event_date"),
        start_time=start_time,
        end_time=end_time
    )
    db.session.add(nuevo_evento)
    db.session.commit()

    return jsonify({"message": "Evento agregado exitosamente.", "event_id": nuevo_evento.id}), 200

@app.route("/get_events", methods=["GET"])
def get_events():
    session_id = request.args.get("sessionID")
    user = User.query.filter_by(id=session_id).first()

    selected_date_str = request.args.get("selectedDate")
    if selected_date_str:
        selected_date = datetime.strptime(selected_date_str, "%Y-%m-%d").date()
    else:
        selected_date = get_current_date()

    eventos = Event.query.filter_by(user_id=user.id, event_date=selected_date).all()
    eventos_list = [{
        "id": evento.id,
        "title": evento.title,
        "description": evento.description,
        "event_date": evento.event_date.isoformat(),
        "start_time": evento.start_time.isoformat() if evento.start_time else None,
        "end_time": evento.end_time.isoformat() if evento.end_time else None,
    } for evento in eventos]

    return jsonify({"events": eventos_list}), 200

# Ruta para eliminar un evento específico por ID
@app.route("/delete_event/<int:event_id>", methods=["DELETE"])
def delete_event(event_id):
    evento = Event.query.filter_by(id=event_id).first()
    db.session.delete(evento)
    db.session.commit()

    return jsonify({"message": "Evento eliminado exitosamente."}), 200

if __name__ == "__main__":
    with app.app_context(): # Para sólo crear las tablas si no existen.
        db.create_all()
    app.run(debug=True)