from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class BloodRequest(db.Model):
    __tablename__ = "blood_requests"
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    blood_group = db.Column(db.String(5), nullable=False)  # e.g., A+, O-
    units_needed = db.Column(db.Integer, default=1)
    contact_name = db.Column(db.String(100))
    contact_phone = db.Column(db.String(30))
    contact_email = db.Column(db.String(120))
    address = db.Column(db.String(300))
    lat = db.Column(db.Float, nullable=True)
    lng = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=True)
    is_open = db.Column(db.Boolean, default=True)
    description = db.Column(db.Text)
    
    # Relationship
    donors = db.relationship("DonorOptIn", back_populates="request", lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'blood_group': self.blood_group,
            'units_needed': self.units_needed,
            'contact_name': self.contact_name,
            'contact_phone': self.contact_phone,
            'contact_email': self.contact_email,
            'address': self.address,
            'lat': self.lat,
            'lng': self.lng,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'is_open': self.is_open,
            'description': self.description,
            'donor_count': len(self.donors)
        }

class DonorOptIn(db.Model):
    __tablename__ = "donor_optin"
    
    id = db.Column(db.Integer, primary_key=True)
    request_id = db.Column(db.Integer, db.ForeignKey("blood_requests.id"), nullable=False)
    donor_name = db.Column(db.String(100))
    donor_contact = db.Column(db.String(30))
    donor_blood_group = db.Column(db.String(5))
    prediction_confidence = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    request = db.relationship("BloodRequest", back_populates="donors")
    
    def to_dict(self):
        return {
            'id': self.id,
            'request_id': self.request_id,
            'donor_name': self.donor_name,
            'donor_contact': self.donor_contact,
            'donor_blood_group': self.donor_blood_group,
            'prediction_confidence': self.prediction_confidence,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class FingerprintLog(db.Model):
    __tablename__ = "fingerprint_logs"
    
    id = db.Column(db.Integer, primary_key=True)
    image_path = db.Column(db.String(400))
    predicted_group = db.Column(db.String(5))
    confidence = db.Column(db.Float)
    ip_address = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'predicted_group': self.predicted_group,
            'confidence': self.confidence,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }