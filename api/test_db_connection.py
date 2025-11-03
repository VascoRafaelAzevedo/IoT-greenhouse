#!/usr/bin/env python3
"""
Script to test database connection
"""

from src.database import engine, Config
from sqlalchemy import text

def test_connection():
    print("Testing database connection...")
    print(f"Database URI: {Config.SQLALCHEMY_DATABASE_URI}")
    
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT version();"))
            version = result.fetchone()[0]
            print(f"✓ Connected successfully!")
            print(f"PostgreSQL version: {version}")
            
            # Test TimescaleDB
            result = connection.execute(text("SELECT extversion FROM pg_extension WHERE extname='timescaledb';"))
            ts_version = result.fetchone()
            if ts_version:
                print(f"✓ TimescaleDB version: {ts_version[0]}")
            
            # List databases
            result = connection.execute(text("SELECT datname FROM pg_database WHERE datistemplate = false;"))
            databases = [row[0] for row in result.fetchall()]
            print(f"✓ Available databases: {', '.join(databases)}")
            
            # List tables in current database
            result = connection.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name;
            """))
            tables = [row[0] for row in result.fetchall()]
            if tables:
                print(f"✓ Tables in database: {', '.join(tables)}")
            else:
                print("⚠ No tables found in database")
            
            return True
    except Exception as e:
        print(f"✗ Connection failed: {e}")
        return False

if __name__ == '__main__':
    test_connection()
