"""WSGI entry point for production (gunicorn)"""

from src.app import app

if __name__ == "__main__":
    app.run()