# standalone_predictor.py
import sys
import json
import base64
import numpy as np
from PIL import Image
import io

def main():
    # Read image data from stdin (base64 encoded)
    image_data_base64 = sys.stdin.read().strip()
    image_bytes = base64.b64decode(image_data_base64)
    
    try:
        # This should work in your environment where the raw code works
        import tensorflow as tf
        from keras.models import load_model
        from keras.preprocessing import image
        from keras.applications.imagenet_utils import preprocess_input
        
        # Load the pre-trained model
        model = load_model('models/model_blood_group_detection_resnet.h5')
        
        # Define the class labels
        labels = {'A+': 0, 'A-': 1, 'AB+': 2, 'AB-': 3, 'B+': 4, 'B-': 5, 'O+': 6, 'O-': 7}
        labels_reverse = dict((v, k) for k, v in labels.items())
        
        # Convert bytes to image
        img = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if necessary
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resize to target size
        img = img.resize((256, 256))
        
        # Convert to array and preprocess
        x = image.img_to_array(img)
        x = np.expand_dims(x, axis=0)
        x = preprocess_input(x)
        
        # Predict using the model
        result = model.predict(x)
        predicted_class = np.argmax(result)
        
        # Map the predicted class to the label
        predicted_label = labels_reverse[predicted_class]
        confidence = float(result[0][predicted_class])
        
        # Return success result
        print(json.dumps({
            "success": True,
            "predicted_group": predicted_label,
            "confidence": confidence,
            "raw_prediction": result[0].tolist()
        }))
        
    except Exception as e:
        # Return error result
        print(json.dumps({
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__
        }))

if __name__ == "__main__":
    main()