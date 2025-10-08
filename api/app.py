from flask import Flask, jsonify
import os

def create_app():
    app = Flask(__name__)

    @app.get("/health")
    def health():
        return jsonify(status="ok", env=os.getenv("ENVIRONMENT","unknown"))

    return app

app = create_app()