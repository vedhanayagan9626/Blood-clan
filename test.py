# test_config.py
import sys
import os

# Add the app directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import Config

print(f"Model path: {Config.MODEL_PATH}")
print(f"Model file exists: {os.path.exists(Config.MODEL_PATH)}")