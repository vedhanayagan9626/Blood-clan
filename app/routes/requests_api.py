from flask import Blueprint, request, jsonify, current_app
from app.models import BloodRequest, DonorOptIn, db
from app.services.geo_service import calculate_distance, filter_by_distance
from datetime import datetime
import logging

bp = Blueprint("requests_api", __name__, url_prefix="/api/requests")

@bp.route("", methods=["GET"])
def list_requests():
    """List blood requests with optional filters"""
    try:
        # Get query parameters
        blood_group = request.args.get('blood_group', '')
        lat = request.args.get('lat', type=float)
        lng = request.args.get('lng', type=float)
        radius_km = request.args.get('radius_km', 15, type=float)
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        # Base query - only open requests that haven't expired
        query = BloodRequest.query.filter_by(is_open=True)
        
        # Filter out expired requests
        current_time = datetime.utcnow()
        query = query.filter(
            (BloodRequest.expires_at.is_(None)) | 
            (BloodRequest.expires_at > current_time)
        )
        
        # Filter by blood group if specified
        if blood_group:
            query = query.filter_by(blood_group=blood_group)
        
        # Get all requests
        all_requests = query.all()
        
        # Convert to dict and add distance if location provided
        requests_data = []
        for req in all_requests:
            req_dict = req.to_dict()
            
            # Calculate distance if user location provided
            if lat and lng and req.lat and req.lng:
                distance = calculate_distance(lat, lng, req.lat, req.lng)
                req_dict['distance_km'] = round(distance, 2)
                
                # Skip if outside radius
                if distance > radius_km:
                    continue
            
            requests_data.append(req_dict)
        
        # Sort by distance if location provided, otherwise by creation date (newest first)
        if lat and lng:
            requests_data.sort(key=lambda x: x.get('distance_km', float('inf')))
        else:
            requests_data.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        # Paginate manually
        start = (page - 1) * per_page
        end = start + per_page
        paginated_requests = requests_data[start:end]
        
        return jsonify({
            'requests': paginated_requests,
            'total': len(requests_data),
            'page': page,
            'per_page': per_page
        })
        
    except Exception as e:
        current_app.logger.error(f"Error listing requests: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@bp.route("/cleanup-expired", methods=["POST"])
def cleanup_expired_requests():
    """Mark expired requests as closed (can be called by a cron job)"""
    try:
        current_time = datetime.utcnow()
        expired_requests = BloodRequest.query.filter(
            BloodRequest.is_open == True,
            BloodRequest.expires_at.isnot(None),
            BloodRequest.expires_at <= current_time
        ).all()
        
        for request in expired_requests:
            request.is_open = False
        
        db.session.commit()
        
        return jsonify({
            'message': f'Marked {len(expired_requests)} requests as expired',
            'expired_count': len(expired_requests)
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error cleaning up expired requests: {str(e)}")
        return jsonify({'error': 'Failed to cleanup expired requests'}), 500
    
@bp.route("", methods=["POST"])
def create_request():
    # \"\"\"Create a new blood request\"\"\"
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'blood_group', 'contact_name', 'contact_phone']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Create new request
        new_request = BloodRequest(
            title=data['title'],
            blood_group=data['blood_group'],
            units_needed=data.get('units_needed', 1),
            contact_name=data['contact_name'],
            contact_phone=data['contact_phone'],
            contact_email=data.get('contact_email', ''),
            address=data.get('address', ''),
            lat=data.get('lat'),
            lng=data.get('lng'),
            description=data.get('description', ''),
            expires_at=datetime.fromisoformat(data['expires_at']) if data.get('expires_at') else None
        )
        
        db.session.add(new_request)
        db.session.commit()
        
        return jsonify({
            'message': 'Request created successfully',
            'id': new_request.id,
            'request': new_request.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating request: {str(e)}")
        return jsonify({'error': 'Failed to create request'}), 500

@bp.route("/<int:req_id>", methods=["GET"])
def get_request(req_id):
    # \"\"\"Get a specific blood request\"\"\"
    try:
        req = BloodRequest.query.get_or_404(req_id)
        return jsonify(req.to_dict())
    except Exception as e:
        current_app.logger.error(f"Error getting request {req_id}: {str(e)}")
        return jsonify({'error': 'Request not found'}), 404

@bp.route("/<int:req_id>/optin", methods=["POST"])
def donor_optin(req_id):
    # \"\"\"Allow a donor to opt-in for a specific request\"\"\"
    try:
        data = request.get_json()
        
        # Validate request exists
        blood_request = BloodRequest.query.get_or_404(req_id)
        
        if not blood_request.is_open:
            return jsonify({'error': 'This request is no longer open'}), 400
        
        # Validate required fields
        required_fields = ['donor_name', 'donor_contact', 'donor_blood_group']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Create donor opt-in record
        donor_optin = DonorOptIn(
            request_id=req_id,
            donor_name=data['donor_name'],
            donor_contact=data['donor_contact'],
            donor_blood_group=data['donor_blood_group'],
            prediction_confidence=data.get('confidence', 0.0)
        )
        
        db.session.add(donor_optin)
        db.session.commit()
        
        return jsonify({
            'message': 'Successfully registered as donor',
            'donor_id': donor_optin.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error in donor opt-in for request {req_id}: {str(e)}")
        return jsonify({'error': 'Failed to register as donor'}), 500
    
@bp.route("/<int:req_id>/donors", methods=["GET"])
def get_request_donors(req_id):
    """Get all donors who opted in for a specific request"""
    try:
        # Validate request exists
        blood_request = BloodRequest.query.get_or_404(req_id)
        
        # Get all donors for this request
        donors = DonorOptIn.query.filter_by(request_id=req_id).order_by(DonorOptIn.created_at.desc()).all()
        
        return jsonify({
            'donors': [donor.to_dict() for donor in donors]
        })
        
    except Exception as e:
        current_app.logger.error(f"Error getting donors for request {req_id}: {str(e)}")
        return jsonify({'error': 'Failed to retrieve donors'}), 500