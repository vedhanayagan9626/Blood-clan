from app import create_app
from flask_migrate import Migrate
from app.models import db, BloodRequest, DonorOptIn, FingerprintLog
import click
from flask.cli import with_appcontext
from sqlalchemy import text

app = create_app()
migrate = Migrate(app, db)

# Add custom Flask commands
@click.command()
@with_appcontext
def init_db():
    """Initialize database with tables."""
    try:
        print("🚀 Creating database tables...")
        db.create_all()
        print("✅ Database tables created successfully!")
        
        # List created tables to verify
        result = db.engine.execute(text("""
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE' 
            AND TABLE_CATALOG = 'BloodClan'
            ORDER BY TABLE_NAME
        """))
        
        tables = [row[0] for row in result]
        if tables:
            print(f"📋 Created tables: {', '.join(tables)}")
        else:
            print("⚠️  No tables found. There might be an issue.")
            
        # Test basic functionality
        print("🧪 Testing database connection...")
        test_result = db.engine.execute(text("SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES"))
        count = test_result.fetchone()[0]
        print(f"📊 Total tables in database: {count}")
        
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        return False
    
    return True

@click.command()
@with_appcontext
def reset_db():
    """Reset database (WARNING: Deletes all data!)."""
    if click.confirm('⚠️  This will DELETE ALL DATA. Are you sure?'):
        try:
            print("🗑️  Dropping all tables...")
            db.drop_all()
            print("🚀 Creating fresh tables...")
            db.create_all()
            print("✅ Database reset complete!")
            
        except Exception as e:
            print(f"❌ Error resetting database: {e}")

@click.command()
@with_appcontext
def check_db():
    """Check database connection and tables."""
    try:
        print("🔍 Checking database connection...")
        
        # Test connection
        result = db.engine.execute(text("SELECT @@VERSION"))
        version = result.fetchone()[0]
        print(f"✅ Connected to: {version[:50]}...")
        
        # Check current database
        result = db.engine.execute(text("SELECT DB_NAME()"))
        db_name = result.fetchone()[0]
        print(f"📂 Current database: {db_name}")
        
        # List all tables
        result = db.engine.execute(text("""
            SELECT TABLE_NAME, 
                   (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_NAME = t.TABLE_NAME) as COLUMN_COUNT
            FROM INFORMATION_SCHEMA.TABLES t
            WHERE TABLE_TYPE = 'BASE TABLE' 
            ORDER BY TABLE_NAME
        """))
        
        tables = result.fetchall()
        if tables:
            print("📋 Existing tables:")
            for table_name, col_count in tables:
                print(f"   - {table_name} ({col_count} columns)")
        else:
            print("⚠️  No tables found in database")
            
        # Check our specific tables
        expected_tables = ['blood_requests', 'donor_optin', 'fingerprint_logs']
        print(f"\n🎯 Checking for BloodClan tables:")
        for table in expected_tables:
            try:
                result = db.engine.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = result.fetchone()[0]
                print(f"   ✅ {table}: {count} records")
            except Exception as e:
                print(f"   ❌ {table}: Not found or error - {e}")
                
    except Exception as e:
        print(f"❌ Database check failed: {e}")

@click.command()
@with_appcontext  
def seed_db():
    """Add sample data to database."""
    try:
        print("🌱 Adding sample data...")
        
        # Add sample blood request
        sample_request = BloodRequest(
            title="Urgent: Need O- Blood",
            blood_group="O-",
            units_needed=2,
            contact_name="John Doe",
            contact_phone="+1234567890",
            contact_email="john@example.com",
            address="123 Hospital St, City",
            description="Emergency surgery requires O- blood urgently"
        )
        
        db.session.add(sample_request)
        db.session.commit()
        
        print("✅ Sample data added successfully!")
        
        # Verify data
        count = BloodRequest.query.count()
        print(f"📊 Total blood requests: {count}")
        
    except Exception as e:
        print(f"❌ Error adding sample data: {e}")

# Register commands with Flask app
app.cli.add_command(init_db)
app.cli.add_command(reset_db)
app.cli.add_command(check_db)
app.cli.add_command(seed_db)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)