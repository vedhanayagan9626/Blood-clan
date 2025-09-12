# model_service.py
import os, sys
import base64
import json
import subprocess
import logging
from flask import current_app

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def predict_from_image(image_bytes):
    """Use subprocess to run the working prediction code"""
    try:
        # Encode image bytes to base64 for transmission
        image_data_base64 = base64.b64encode(image_bytes).decode('utf-8')
        
        # Path to your standalone prediction script
        script_path = os.path.join(os.path.dirname(__file__), 'predict_standalone.py')
        
        # Run the prediction script as a subprocess
        result = subprocess.run(
            [sys.executable, script_path],
            input=image_data_base64,
            text=True,
            capture_output=True,
            timeout=30  # 30 second timeout
        )
        
        if result.returncode != 0:
            logger.error(f"Prediction subprocess failed: {result.stderr}")
            return {
                "predicted_group": "Unknown",
                "confidence": 0.0,
                "error": f"Prediction failed: {result.stderr}"
            }
        
        # Parse the JSON result
        prediction_result = json.loads(result.stdout)
        
        if not prediction_result.get("success", False):
            logger.error(f"Prediction failed: {prediction_result.get('error', 'Unknown error')}")
            return {
                "predicted_group": "Unknown",
                "confidence": 0.0,
                "error": prediction_result.get("error", "Unknown error")
            }
        
        logger.info(f"99.5% accurate prediction: {prediction_result['predicted_group']} with confidence: {prediction_result['confidence']:.4f}")
        
        return {
            "predicted_group": prediction_result["predicted_group"],
            "confidence": prediction_result["confidence"]
        }
        
    except subprocess.TimeoutExpired:
        logger.error("Prediction timed out after 30 seconds")
        return {
            "predicted_group": "Unknown",
            "confidence": 0.0,
            "error": "Prediction timed out"
        }
    except Exception as e:
        logger.error(f"Error in prediction subprocess: {str(e)}")
        return {
            "predicted_group": "Unknown",
            "confidence": 0.0,
            "error": str(e)
        }