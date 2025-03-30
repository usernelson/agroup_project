from flask import Flask
from flask_cors import CORS
from app.config import Config
from app.routes import routes

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, origins=["https://ia.agroup.app"])

    app.register_blueprint(routes)

    return app

