#!/bin/bash

# POLAR-EMS Setup Script
# Initializes the complete development environment

set -e

echo "======================================"
echo "POLAR-EMS Development Setup"
echo "======================================"
echo ""

# Check for Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed"
    exit 1
fi

echo "✓ Python found: $(python3 --version)"

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed"
    exit 1
fi

echo "✓ Node.js found: $(node --version)"

# Backend setup
echo ""
echo "Setting up backend..."
cd backend

if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "✓ Backend setup complete"

# Frontend setup
cd ../frontend
echo ""
echo "Setting up frontend..."

if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install
fi

echo "✓ Frontend setup complete"

# Initialize database
cd ..
echo ""
echo "Would you like to initialize the database with sample data? (y/n)"
read -r response

if [ "$response" = "y" ]; then
    echo "Initializing database..."
    cd backend
    source venv/bin/activate
    python ../scripts/init_database.py
    cd ..
fi

# Create .env file
if [ ! -f ".env" ]; then
    echo ""
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "✓ Created .env file"
    echo "⚠ Please edit .env file with your configuration"
fi

echo ""
echo "======================================"
echo "✓ Setup Complete!"
echo "======================================"
echo ""
echo "To start the application:"
echo ""
echo "Backend:"
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  uvicorn app.main:app --reload"
echo ""
echo "Frontend:"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "Or use Docker Compose:"
echo "  docker-compose up"
echo ""
