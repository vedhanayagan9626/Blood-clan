from flask import Blueprint, request, jsonify, current_app
from app.models import FingerprintLog, db
import base64
import json
import subprocess
import os, sys
import tempfile
import logging

bp = Blueprint("model_api", __name__, url_prefix="/api/model")

def run_standalone_predictor(image_bytes):
    """Run the standalone predictor script with the given image bytes"""
    try:
        # Encode image bytes to base64 for transmission
        image_data_base64 = base64.b64encode(image_bytes).decode('utf-8')
        
        # Get the path to the standalone predictor script
        script_path = os.path.join(os.path.dirname(__file__), 'standalone_predictor.py')
        
        # Run the prediction script as a subprocess
        result = subprocess.run(
            [sys.executable, script_path],
            input=image_data_base64,
            text=True,
            capture_output=True,
            timeout=30  # 30 second timeout
        )
        
        if result.returncode != 0:
            return {
                "success": False,
                "error": f"Subprocess failed: {result.stderr}"
            }
        
        # Parse the JSON result
        return json.loads(result.stdout)
        
    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "error": "Prediction timed out after 30 seconds"
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Subprocess error: {str(e)}"
        }

@bp.route("/predict", methods=["POST"])
def predict():
    """Predict blood group from fingerprint image"""
    try:
        # Check if file is present
        if 'fingerprint' not in request.files:
            return jsonify({'error': 'No fingerprint file provided'}), 400
        
        file = request.files['fingerprint']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Validate file type
        allowed_extensions = {'png', 'jpg', 'jpeg', 'bmp', 'tiff'}
        file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
        if file_ext not in allowed_extensions:
            return jsonify({'error': 'Invalid file type. Please upload an image.'}), 400
        
        # Read file data
        file_data = file.read()
        if len(file_data) == 0:
            return jsonify({'error': 'Empty file'}), 400
        
        # Use standalone predictor
        prediction_result = run_standalone_predictor(file_data)
        
        if not prediction_result.get("success", False):
            error_msg = prediction_result.get("error", "Unknown prediction error")
            current_app.logger.error(f"Model prediction error: {error_msg}")
            return jsonify({'error': f'Failed to process image: {error_msg}'}), 500
        
        predicted_group = prediction_result['predicted_group']
        confidence = prediction_result['confidence']
        
        # Check if confidence is above threshold
        threshold = current_app.config.get('PREDICT_THRESHOLD', 0.65)
        allowed_to_donate = confidence >= threshold
        
        # Log the prediction
        try:
            log_entry = FingerprintLog(
                image_path=None,
                predicted_group=predicted_group,
                confidence=confidence,
                ip_address=request.remote_addr
            )
            db.session.add(log_entry)
            db.session.commit()
        except Exception as log_error:
            current_app.logger.error(f"Failed to log prediction: {str(log_error)}")
        
        return jsonify({
            'predicted_group': predicted_group,
            'confidence': round(confidence, 4),
            'allowed_to_donate': allowed_to_donate,
            'threshold': threshold,
            'model_accuracy': '99.5%',
            'confidence_percentage': round(confidence * 100, 2),
            'message': f'Predicted blood group: {predicted_group} with {confidence*100:.2f}% confidence'
        })
        
    except Exception as e:
        current_app.logger.error(f"Error in prediction endpoint: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@bp.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    try:
        # Test with a small image to check if predictor works
        test_image = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\x07tIME\x07\xe5\t\x0c\x081\x0b\x93\xe8\xf7\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x00\x00\x01\x00\x01\x00\x00\r\n\xa5\x00\x00\x00\x00IEND\xaeB`\x82'
        
        result = run_standalone_predictor(test_image)
        
        if result.get("success", False):
            return jsonify({
                'status': 'healthy', 
                'model_loaded': True,
                'accuracy': '99.5%'
            })
        else:
            return jsonify({
                'status': 'unhealthy', 
                'error': result.get("error", "Unknown error"),
                'model_loaded': False
            }), 500
            
    except Exception as e:
        return jsonify({
            'status': 'unhealthy', 
            'error': str(e)
        }), 500