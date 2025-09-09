from flask import Blueprint, request, jsonify, current_app
from app.services.model_service import predict_from_image
from app.models import FingerprintLog, db
import logging

bp = Blueprint("model_api", __name__, url_prefix="/api/model")

@bp.route("/predict", methods=["POST"])
def predict():
    # \"\"\"
    # Predict blood group from fingerprint image
    # Expects multipart form with 'fingerprint' file
    # Returns JSON: { predicted_group, confidence, allowed_to_donate }
    # \"\"\"
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
        
        # Make prediction
        prediction_result = predict_from_image(file_data)
        
        if 'error' in prediction_result:
            current_app.logger.error(f"Model prediction error: {prediction_result['error']}")
            return jsonify({'error': 'Failed to process image'}), 500
        
        predicted_group = prediction_result['predicted_group']
        confidence = prediction_result['confidence']
        
        # Check if confidence is above threshold
        threshold = current_app.config.get('PREDICT_THRESHOLD', 0.65)
        allowed_to_donate = confidence >= threshold
        
        # Log the prediction
        try:
            log_entry = FingerprintLog(
                image_path=None,  # We're not saving images for privacy
                predicted_group=predicted_group,
                confidence=confidence,
                ip_address=request.remote_addr
            )
            db.session.add(log_entry)
            db.session.commit()
        except Exception as log_error:
            current_app.logger.error(f"Failed to log prediction: {str(log_error)}")
            # Continue even if logging fails
        
        return jsonify({
            'predicted_group': predicted_group,
            'confidence': round(confidence, 4),
            'allowed_to_donate': allowed_to_donate,
            'threshold': threshold,
            'message': f'Predicted blood group: {predicted_group}' + 
                      (f' (Confidence too low to donate)' if not allowed_to_donate else '')
        })
        
    except Exception as e:
        current_app.logger.error(f"Error in prediction endpoint: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@bp.route("/health", methods=["GET"])
def health_check():
    # \"\"\"Health check endpoint for the model service\"\"\"
    try:
        # Try to load the model to ensure it's working
        from app.services.model_service import model_service
        model_service.load_model()
        return jsonify({'status': 'healthy', 'model_loaded': True})
    except Exception as e:
        return jsonify({'status': 'unhealthy', 'error': str(e)}), 500
