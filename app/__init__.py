from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from config import Config
import os

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize extensions
    from app.models import db
    db.init_app(app)
    
    
    # Create upload directory
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])
    
    # Register blueprints
    from app.routes.main import bp as main_bp
    from app.routes.requests_api import bp as requests_bp
    from app.routes.model_api import bp as model_bp
    
    app.register_blueprint(main_bp)
    app.register_blueprint(requests_bp)
    app.register_blueprint(model_bp)
    
    return app