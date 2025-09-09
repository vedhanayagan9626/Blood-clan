import os
import numpy as np
from PIL import Image
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
from tensorflow.keras.applications.imagenet_utils import preprocess_input
from flask import current_app
import io
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ModelService:
    def __init__(self):
        self.model = None
        self.labels = {0: 'A+', 1: 'A-', 2: 'AB+', 3: 'AB-', 4: 'B+', 5: 'B-', 6: 'O+', 7: 'O-'}
    
    def load_model(self):
        # \"\"\"Load the TensorFlow model if not already loaded\"\"\"
        if self.model is None:
            try:
                model_path = current_app.config["MODEL_PATH"]
                if not os.path.exists(model_path):
                    raise FileNotFoundError(f"Model file not found at {model_path}")
                
                logger.info(f"Loading model from {model_path}")
                self.model = load_model(model_path)
                logger.info("Model loaded successfully")
            except Exception as e:
                logger.error(f"Error loading model: {str(e)}")
                raise e
        return self.model
    
    def preprocess_image(self, image_bytes):
        # \"\"\"Preprocess image bytes for model prediction\"\"\"
        try:
            # Open image from bytes
            img = Image.open(io.BytesIO(image_bytes))
            
            # Convert to RGB if necessary
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Resize to model's expected input size
            img = img.resize((256, 256))
            
            # Convert to array
            img_array = image.img_to_array(img)
            
            # Expand dimensions to match model input
            img_array = np.expand_dims(img_array, axis=0)
            
            # Preprocess according to the model's requirements
            img_array = preprocess_input(img_array)
            
            return img_array
        except Exception as e:
            logger.error(f"Error preprocessing image: {str(e)}")
            raise e
    
    def predict_from_image(self, image_bytes):

        # Predict blood group from image bytes
        # Returns: dict with predicted_group and confidence
        
        try:
            # Load model
            model = self.load_model()
            
            # Preprocess image
            processed_image = self.preprocess_image(image_bytes)
            
            # Make prediction
            prediction = model.predict(processed_image)
            
            # Get predicted class and confidence
            predicted_class_index = np.argmax(prediction[0])
            confidence = float(prediction[0][predicted_class_index])
            
            # Map to blood group label
            predicted_group = self.labels[predicted_class_index]
            
            logger.info(f"Prediction: {predicted_group} with confidence: {confidence:.4f}")
            
            return {
                "predicted_group": predicted_group,
                "confidence": confidence
            }
            
        except Exception as e:
            logger.error(f"Error in prediction: {str(e)}")
            # Return a fallback response
            return {
                "predicted_group": "Unknown",
                "confidence": 0.0,
                "error": str(e)
            }

# Global instance
model_service = ModelService()

def predict_from_image(image_bytes):
    return model_service.predict_from_image(image_bytes)