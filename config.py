import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-key-change-in-production")
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URI",
        "mssql+pymssql://hrmuser1:HRM%26%24LslWrA%23iPrUs4a%40%21GO@103.133.214.173:1433/BloodClan"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Model configuration
    MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models', 'model_blood_group_detection_resnet.h5')
    
    # Optional: Add model-related settings
    PREDICT_THRESHOLD = 0.65
    ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'bmp', 'tiff'}
    UPLOAD_FOLDER = 'uploads'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size

class DevelopmentConfig(Config):
    DEBUG = True
    # Override model path for development if needed
    MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models', 'dev_model.h5')

class ProductionConfig(Config):
    DEBUG = False
    # Production-specific model path
    MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models', 'prod_model.h5')

class TestingConfig(Config):
    TESTING = True
    MODEL_PATH = os.path.join(os.path.dirname(__file__), 'tests', 'test_model.h5')