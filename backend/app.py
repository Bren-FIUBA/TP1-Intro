from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt

# Importo los modelos de tablas que hice en el archivo models.py
from models import db, User, Task, DailyGoal

# Creamos una instancia de Flask, que es nuestra aplicación web.
app = Flask(__name__)

# Hay que configurar CORS para permitir que el servidor front-end (que está en localhost:8000) pueda hacer peticiones al servidor Flask (que está en localhost:5000). Ésta línea aplica CORS a toda la aplicación Flask, permitiendo que cualquier origen (*) pueda realizar peticiones.
CORS(app)

bcrypt = Bcrypt(app)

# Configuramos la URI de la base de datos que SQLAlchemy usará para conectarse
app.config["SQLALCHEMY_DATABASE_URI"] = 'postgresql+psycopg2://postgres:1509199907@localhost:5432/pruebas'

# Desactivamos la funcionalidad de seguimiento de modificaciones ya que consume memoria y no suele ser necesaria.
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Creamos instancia de SQLAlchemy y la asociamos con la aplicación Flask que acabamos de crear. Esto inicializa SQLAlchemy con la configuración de la aplicación Flask, permitiendo que la aplicación interactúe con la base de datos de una manera más sencilla. Al crear esta instancia estamos creando un objeto de python que maneja la conexión a la base de datos y nos proporciona métodos para interactuar con ella directamente sin necesidad de escribir código en SQL.
# Permite que una instancia de SQLAlchemy creada previamente (db) se use con una aplicación Flask específica (app).
db.init_app(app)

# Para Aplicaciones Simples: db = SQLAlchemy(app) es más directo y fácil de usar.
# Para Aplicaciones Más Complejas o Modulares: db = SQLAlchemy() seguido de db.init_app(app) proporciona mayor flexibilidad y modularidad.

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json() # Obtengo el 'body' de la data que extraigo del formulario, la que 'postea' el usuario al hacer submit
    email = data.get('email') # 'Abro' data y le saco cada campo ya que es un json
    username = data.get('username')
    password = data.get('password')
    confirm_password = data.get('confirm_password')

    # existing_user guarda el resultado de hacer una query a la tabla User (users) cuyo email sea el que ingresó el usuario, así luego comparamos si ya hay una cuenta registrada con ese mail o no. Si devuelve none, sabremos que no. Si devuelve un usuario, entonces no se podrá registrar.
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

if __name__ == "__main__":
    with app.app_context(): # Para sólo crear las tablas si no existen.
        db.create_all()
    app.run(debug=True)