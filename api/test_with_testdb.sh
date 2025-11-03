#!/bin/bash

# Script to test the API with the test database
# Usage: ./test_with_testdb.sh

echo "🧪 Starting API with TEST database..."
echo "================================================"

# Set environment variable to use test database
export USE_TEST_DB=true

# Activate virtual environment
source ../.venv/bin/activate

# Run the API
python -m src.app
