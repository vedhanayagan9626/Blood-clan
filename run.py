from app import create_app
from app.models import db, BloodRequest, DonorOptIn, FingerprintLog

app = create_app()

# Create tables automatically on startup
with app.app_context():
    db.create_all()
    print("✅ Database tables created successfully!")

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
