# POLAR-EMS Setup Script for Windows
# Initializes the complete development environment

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "POLAR-EMS Development Setup" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check for Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python 3 is required but not installed" -ForegroundColor Red
    exit 1
}

# Check for Node.js
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is required but not installed" -ForegroundColor Red
    exit 1
}

# Backend setup
Write-Host ""
Write-Host "Setting up backend..." -ForegroundColor Yellow
Set-Location backend

if (-not (Test-Path "venv")) {
    Write-Host "Creating Python virtual environment..."
    python -m venv venv
}

Write-Host "Activating virtual environment..."
.\venv\Scripts\Activate.ps1

Write-Host "Installing Python dependencies..."
python -m pip install --upgrade pip
pip install -r requirements.txt

Write-Host "✓ Backend setup complete" -ForegroundColor Green

# Frontend setup
Set-Location ../frontend
Write-Host ""
Write-Host "Setting up frontend..." -ForegroundColor Yellow

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing Node.js dependencies..."
    npm install
}

Write-Host "✓ Frontend setup complete" -ForegroundColor Green

# Initialize database
Set-Location ..
Write-Host ""
$response = Read-Host "Would you like to initialize the database with sample data? (y/n)"

if ($response -eq "y") {
    Write-Host "Initializing database..."
    Set-Location backend
    .\venv\Scripts\Activate.ps1
    python ..\scripts\init_database.py
    Set-Location ..
}

# Create .env file
if (-not (Test-Path ".env")) {
    Write-Host ""
    Write-Host "Creating .env file from template..."
    Copy-Item .env.example .env
    Write-Host "✓ Created .env file" -ForegroundColor Green
    Write-Host "⚠ Please edit .env file with your configuration" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "✓ Setup Complete!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start the application:"
Write-Host ""
Write-Host "Backend:" -ForegroundColor Yellow
Write-Host "  cd backend"
Write-Host "  .\venv\Scripts\Activate.ps1"
Write-Host "  uvicorn app.main:app --reload"
Write-Host ""
Write-Host "Frontend:" -ForegroundColor Yellow
Write-Host "  cd frontend"
Write-Host "  npm run dev"
Write-Host ""
Write-Host "Or use Docker Compose:" -ForegroundColor Yellow
Write-Host "  docker-compose up"
Write-Host ""
