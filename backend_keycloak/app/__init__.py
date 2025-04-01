from flask import Flask
from flask_cors import CORS
from app.config import Config
from app.routes import routes

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app,
     origins=["https://ia.agroup.app", "https://dev.ia.agroup.app"],
     supports_credentials=True,
     methods=["GET", "POST", "OPTIONS", "PUT", "DELETE"],
     allow_headers=["Content-Type", "Authorization"]
)

    app.register_blueprint(routes)

    return app

