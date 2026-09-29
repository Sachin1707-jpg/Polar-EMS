# POLAR-EMS Quick Start Guide

Get POLAR-EMS up and running in minutes!

## 🚀 Quick Start (Recommended)

### Using Docker Compose

The fastest way to run POLAR-EMS:

```bash
# 1. Clone the repository
git clone https://github.com/your-org/polar-ems.git
cd polar-ems

# 2. Copy environment configuration
cp .env.example .env

# 3. Start all services
docker-compose up -d

# 4. Access the application
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
```

**Default Login Credentials:**
- Username: `admin`
- Password: `admin123`

⚠️ **Change these in production!**

---

## 💻 Manual Setup (Development)

### Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **Git**

### Step 1: Clone and Setup

```bash
git clone https://github.com/your-org/polar-ems.git
cd polar-ems
```

### Step 2: Run Setup Script

**On Linux/Mac:**
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

**On Windows (PowerShell):**
```powershell
.\scripts\setup.ps1
```

The setup script will:
- ✓ Create Python virtual environment
- ✓ Install backend dependencies
- ✓ Install frontend dependencies
- ✓ Initialize database with sample data
- ✓ Create .env configuration file

### Step 3: Start Backend

```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: http://localhost:8000

### Step 4: Start Frontend (in new terminal)

```bash
cd frontend
npm run dev
```

Frontend will be available at: http://localhost:5173

---

## 📊 Accessing the Application

### Web Interface

Open your browser and navigate to:
- **Development**: http://localhost:5173
- **Production (Docker)**: http://localhost:3000

### API Documentation

Interactive API documentation available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Default Users

| Username | Password | Role | Description |
|----------|----------|------|-------------|
| admin | admin123 | Administrator | Full system access |
| engineer | engineer123 | Station Engineer | Operations and control |
| viewer | viewer123 | Data Viewer | Read-only access |

---

## 🔍 Verifying Installation

### Check Backend Health

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-08-23T..."
}
```

### Check Frontend

Navigate to http://localhost:5173 and verify:
- ✓ Login page loads
- ✓ Can login with default credentials
- ✓ Dashboard displays simulated data

---

## 📱 Main Features Tour

### 1. Dashboard

**What you'll see:**
- Real-time system status
- Current load and generation
- Battery state of charge
- Active alerts
- KPI metrics

**Try this:**
- Watch real-time data updates (every 5 minutes in simulation mode)
- Check the "SIMULATED DATA" badge (shown during development)

### 2. AI Recommendations

**What you'll see:**
- Fuel-saving opportunities
- Battery management suggestions
- Load shifting recommendations
- Clear explanations for each recommendation

**Try this:**
- Review AI reasoning for each suggestion
- Check estimated fuel savings
- See impact predictions

### 3. Forecasts

**What you'll see:**
- 24-48 hour load predictions
- Wind power forecasts
- Confidence intervals
- Forecast accuracy metrics

**Try this:**
- Compare predicted vs actual values
- Check confidence bands
- Review model performance

### 4. Energy Optimization

**What you'll see:**
- Optimized dispatch schedules
- Fuel minimization results
- Renewable energy maximization
- Battery scheduling

**Try this:**
- Review optimization objectives
- Check fuel consumption estimates
- See renewable energy percentages

### 5. Alerts & Monitoring

**What you'll see:**
- Active system alerts
- Equipment warnings
- Performance notifications
- Alert history

**Try this:**
- Acknowledge alerts
- Filter by severity
- Review resolution status

---

## 🎮 Interactive Workflow

Follow this workflow to experience the intelligent energy management:

### Morning Operations

1. **Login** to the dashboard
2. **Check overnight alerts** in Alert Center
3. **Review AI recommendations** - What does the AI suggest?
4. **Check weather forecast** - What conditions are expected?
5. **Verify optimization schedule** - Is the dispatch plan optimal?

### Understanding AI Decisions

Click on any recommendation to see:
- **Situation**: What's happening right now?
- **Recommendation**: What should you do?
- **Reasoning**: Why is AI recommending this?
- **Impact**: What will be the result?

### Example Scenario

**Scenario**: High wind expected

1. Dashboard shows: Wind forecast 15 m/s (high)
2. AI recommends: "Reduce diesel generation, charge batteries"
3. Reasoning shows:
   - Current: 5 kW wind, 40 kW diesel
   - Forecast: 50 kW wind in 2 hours
   - Impact: Save 15 liters of fuel
4. Optimization schedule updates automatically
5. System adjusts dispatch plan

---

## 🔧 Configuration

### Environment Variables

Edit `.env` file to customize:

```bash
# Simulation Mode (set false for real hardware)
SIMULATION_MODE=true

# Update intervals
AI_MODEL_UPDATE_INTERVAL=3600
OPTIMIZATION_INTERVAL=900

# Database
DATABASE_URL=sqlite:///./polar_ems.db

# Weather API (optional)
WEATHER_API_KEY=your-key-here
```

### Station Configuration

Edit `config/stations/station_config.json`:

```json
{
  "station_id": "Antarctic-Station-01",
  "equipment": {
    "diesel_capacity_kw": 100,
    "battery_capacity_kwh": 200,
    "wind_capacity_kw": 50
  }
}
```

---

## 🧪 Development Mode

### Enable Debug Logging

```bash
# Backend
LOG_LEVEL=DEBUG uvicorn app.main:app --reload

# Frontend
npm run dev
```

### Access Database

```bash
# SQLite (default)
sqlite3 polar_ems.db

# View tables
.tables

# Query data
SELECT * FROM energy_data LIMIT 10;
```

### Generate More Sample Data

```bash
cd backend
source venv/bin/activate
python ../scripts/init_database.py
# Choose number of days when prompted
```

---

## 🐛 Troubleshooting

### Backend won't start

**Issue**: ModuleNotFoundError
```bash
# Solution: Activate virtual environment
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Issue**: Database errors
```bash
# Solution: Reinitialize database
rm polar_ems.db  # Delete old database
python ../scripts/init_database.py
```

### Frontend won't start

**Issue**: npm errors
```bash
# Solution: Clean install
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Issue**: API connection errors
```bash
# Solution: Check backend is running
curl http://localhost:8000/health

# Check CORS settings in .env
API_CORS_ORIGINS=["http://localhost:5173"]
```

### No data showing

**Issue**: Empty dashboard
```bash
# Solution 1: Wait for simulation (runs every 5 min)
# Solution 2: Generate historical data
python scripts/init_database.py

# Solution 3: Check SIMULATION_MODE=true in .env
```

---

## 📚 Next Steps

### Learn More

- **Full Documentation**: See [docs/](./docs/) folder
- **API Reference**: http://localhost:8000/docs
- **Architecture**: Read [docs/TECHNICAL_DESIGN.md](./docs/TECHNICAL_DESIGN.md)

### Customize

- Add your station equipment
- Configure alert thresholds
- Adjust optimization parameters
- Integrate real sensors

### Deploy

- Set up production database
- Configure SSL/TLS
- Set strong passwords
- Enable monitoring

---

## 🆘 Getting Help

- **Documentation**: Check [docs/](./docs/) folder
- **Issues**: [GitHub Issues](https://github.com/your-org/polar-ems/issues)
- **Email**: support@polar-ems.org

---

## 🎯 Success Checklist

- [ ] Backend running on port 8000
- [ ] Frontend running on port 5173
- [ ] Can login with default credentials
- [ ] Dashboard shows simulated data
- [ ] Real-time updates working (watch for changes)
- [ ] AI recommendations appearing
- [ ] Alerts showing in Alert Center
- [ ] Can navigate between pages

**If all checked: Congratulations! 🎉 POLAR-EMS is running successfully!**

---

*Built with ❄️ for polar research stations worldwide*
