import click
from flask.cli import with_appcontext
from app.models import db
from sqlalchemy import text

@click.command()
@with_appcontext
def init_db():
    """Initialize database with tables."""
    try:
        db.create_all()
        print("✅ Database tables created successfully!")
        
        # List created tables
        result = db.engine.execute(text("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'"))
        tables = [row[0] for row in result]
        print(f"Created tables: {', '.join(tables)}")
        
    except Exception as e:
        print(f"❌ Error creating tables: {e}")

# Add to your app
def register_commands(app):
    app.cli.add_command(init_db)