#!/usr/bin/env python3
"""
Script to test the API locally.
Run with: python test_api.py
"""

from src.app import app

if __name__ == '__main__':
    print("🚀 Starting Flask development server...")
    print("=" * 60)
    print("API will be available at: http://localhost:5000")
    print("=" * 60)
    print("\n📋 Available endpoints:\n")
    print("Health Check:")
    print("  GET  /health")
    print("\nAuthentication:")
    print("  POST /api/auth/register - Register new user")
    print("  POST /api/auth/login - Login")
    print("  GET  /api/auth/me - Get current user (requires auth)")
    print("  PUT  /api/auth/me - Update profile (requires auth)")
    print("  DEL  /api/auth/me - Delete account (requires auth)")
    print("\nGreenhouses:")
    print("  GET  /api/greenhouses - List user's greenhouses")
    print("  POST /api/greenhouses - Create greenhouse")
    print("  GET  /api/greenhouses/<id> - Get greenhouse by ID")
    print("  PUT  /api/greenhouses/<id> - Update greenhouse name")
    print("  DEL  /api/greenhouses/<id> - Delete greenhouse")
    print("\nSetpoints:")
    print("  GET  /api/greenhouses/<id>/setpoint - Get setpoint")
    print("  PUT  /api/greenhouses/<id>/setpoint - Update setpoint (publishes to MQTT)")
    print("\nTelemetry (read-only):")
    print("  GET  /api/greenhouses/<id>/telemetry?days=7&limit=1000")
    print("  GET  /api/greenhouses/<id>/telemetry?start_date=2025-01-01&end_date=2025-01-31")
    print("  GET  /api/greenhouses/<id>/telemetry/latest")
    print("\nConnection Events (read-only):")
    print("  GET  /api/greenhouses/<id>/connections?limit=50")
    print("\nPlants (read-only):")
    print("  GET  /api/plants - List all plant templates")
    print("  GET  /api/plants/<id> - Get plant by ID")
    print("\nTimezones:")
    print("  GET  /api/timezones - List all timezones (public)")
    print("\n" + "=" * 60)
    print("💡 Use Authorization header: Bearer <token>")
    print("=" * 60)
    print("\n🛑 Press Ctrl+C to stop the server\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
