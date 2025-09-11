from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

# Get connection string from .env
connection_string = os.environ.get("DATABASE_URI")
print(f"Connection string: {connection_string}")

try:
    engine = create_engine(connection_string)
    with engine.connect() as conn:
        # Test basic connection
        result = conn.execute(text("SELECT @@VERSION"))
        version = result.fetchone()[0]
        print("✅ Database connection successful!")
        print(f"SQL Server Version: {version[:100]}...")
        
        # Check current database
        result = conn.execute(text("SELECT DB_NAME()"))
        db_name = result.fetchone()[0]
        print(f"Connected to database: {db_name}")
        
        # Test if we can create a simple table
        conn.execute(text("CREATE TABLE test_table (id INT PRIMARY KEY, name VARCHAR(50))"))
        print("✅ Test table created successfully!")
        
        # Clean up test table
        conn.execute(text("DROP TABLE test_table"))
        print("✅ Test table dropped successfully!")
        
        conn.commit()
        
except Exception as e:
    print(f"❌ Connection failed: {e}")