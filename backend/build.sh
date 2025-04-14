#!/bin/bash
set -e

echo "Starting build process..."

# Activate virtual environment if it exists (adjust path as needed)
if [ -f "./venv/bin/activate" ]; then
    source ./venv/bin/activate
fi

echo "Installing Python dependencies..."
pip install -r backend/requirements.txt

echo "Applying database migrations..."
python backend/manage.py migrate --noinput

echo "Collecting static files..."
python backend/manage.py collectstatic --noinput

# Optionally, you can also build your React frontend here:
echo "Building React frontend..."
cd frontend && npm install && npm run build && cd ..

echo "Build process complete."
