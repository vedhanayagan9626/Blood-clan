import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-key-change-in-production")
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URI",
        "mssql+pyodbc://hrmuser1:HRM%26%24LslWrA%23iPrUs4a%40%21GO@103.133.214.173:1433/BloodClan?driver=ODBC+Driver+17+for+SQL+Server"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    MODEL_PATH = os.environ.get("MODEL_PATH", "models/model_blood_group_detection_resnet.h5")
    PREDICT_THRESHOLD = float(os.environ.get("PREDICT_THRESHOLD", "0.65"))
    UPLOAD_FOLDER = 'uploads'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size