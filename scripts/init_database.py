"""
Initialize Database with Sample Data
Creates initial station, equipment, users, and historical data
"""
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent / 'backend'))

from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, init_db
from app.core.security import get_password_hash
from app.models import (
    User, Station, Equipment, EnergyData, 
    EquipmentStatus, WeatherData, Alert
)
from app.services.data_simulator import DataSimulator

def create_initial_station(db: Session) -> Station:
    """Create initial polar research station"""
    print("Creating station...")
    
    station = Station(
        name="Antarctic-Station-01",
        location="McMurdo Sound, Antarctica",
        latitude=-77.8419,
        longitude=166.6863,
        altitude=30,
        timezone="Antarctica/McMurdo",
        configuration={
            "diesel_capacity_kw": 100,
            "battery_capacity_kwh": 200,
            "wind_capacity_kw": 50,
            "critical_load_percent": 45
        },
        is_active=True
    )
    
    db.add(station)
    db.commit()
    db.refresh(station)
    
    print(f"✓ Created station: {station.name} (ID: {station.id})")
    return station

def create_equipment(db: Session, station_id: int):
    """Create equipment for the station"""
    print("Creating equipment...")
    
    equipment_list = [
        {
            "equipment_type": "diesel_generator",
            "equipment_id": "gen_01",
            "name": "Main Diesel Generator",
            "specifications": {
                "capacity_kw": 100,
                "fuel_consumption_l_per_kwh": 0.25,
                "min_load_kw": 20,
                "efficiency_percent": 85
            },
            "is_critical": True
        },
        {
            "equipment_type": "battery",
            "equipment_id": "battery_01",
            "name": "Main Battery Bank",
            "specifications": {
                "capacity_kwh": 200,
                "max_charge_kw": 50,
                "max_discharge_kw": 50,
                "efficiency_percent": 95,
                "chemistry": "Lithium-ion"
            },
            "is_critical": True
        },
        {
            "equipment_type": "wind_turbine",
            "equipment_id": "wind_01",
            "name": "Wind Turbine #1",
            "specifications": {
                "capacity_kw": 50,
                "cut_in_speed_ms": 3.0,
                "rated_speed_ms": 12.0,
                "cut_out_speed_ms": 25.0,
                "hub_height_m": 30
            },
            "is_critical": False
        }
    ]
    
    for eq in equipment_list:
        equipment = Equipment(
            station_id=station_id,
            **eq
        )
        db.add(equipment)
        print(f"  ✓ {eq['name']}")
    
    db.commit()
    print(f"✓ Created {len(equipment_list)} pieces of equipment")

def create_users(db: Session, station_id: int):
    """Create initial users"""
    print("Creating users...")
    
    users = [
        {
            "username": "admin",
            "email": "admin@polarstation.org",
            "password": "admin123",  # CHANGE IN PRODUCTION!
            "full_name": "System Administrator",
            "role": "admin"
        },
        {
            "username": "engineer",
            "email": "engineer@polarstation.org",
            "password": "engineer123",
            "full_name": "Station Engineer",
            "role": "engineer"
        },
        {
            "username": "viewer",
            "email": "viewer@polarstation.org",
            "password": "viewer123",
            "full_name": "Data Viewer",
            "role": "viewer"
        }
    ]
    
    for user_data in users:
        password = user_data.pop('password')
        user = User(
            **user_data,
            station_id=station_id,
            hashed_password=get_password_hash(password),
            is_active=True
        )
        db.add(user)
        print(f"  ✓ {user.username} ({user.role})")
    
    db.commit()
    print(f"✓ Created {len(users)} users")

def generate_historical_data(db: Session, station_id: int, days: int = 7):
    """Generate historical simulated data"""
    print(f"Generating {days} days of historical data...")
    
    simulator = DataSimulator()
    start_time = datetime.utcnow() - timedelta(days=days)
    hours = days * 24
    
    # Generate system data
    system_data = simulator.generate_energy_system_data(start_time, hours)
    
    print(f"  Inserting {len(system_data)} energy data records...")
    
    # Insert energy data
    for idx, row in system_data.iterrows():
        energy_record = EnergyData(
            station_id=station_id,
            timestamp=row['timestamp'],
            total_load_kw=row['total_load_kw'],
            critical_load_kw=row['critical_load_kw'],
            deferrable_load_kw=row['deferrable_load_kw'],
            diesel_generation_kw=row['diesel_generation_kw'],
            wind_generation_kw=row['wind_generation_kw'],
            total_generation_kw=row['total_generation_kw'],
            battery_charge_kw=row['battery_charge_kw'],
            battery_discharge_kw=row['battery_discharge_kw'],
            battery_soc_percent=row['battery_soc_percent'],
            fuel_consumption_liters=row['fuel_consumption_liters'],
            frequency_hz=row['frequency_hz'],
            voltage_v=row['voltage_v'],
            is_simulated=True
        )
        db.add(energy_record)
        
        # Insert weather data
        weather_record = WeatherData(
            station_id=station_id,
            timestamp=row['timestamp'],
            temperature_c=row['temperature_c'],
            wind_speed_ms=row['wind_speed_ms'],
            wind_direction_deg=0,
            humidity_percent=75,
            pressure_hpa=1013,
            condition='clear',
            source='simulated',
            is_forecast=False
        )
        db.add(weather_record)
        
        # Commit every 24 hours to avoid memory issues
        if idx % 24 == 0:
            db.commit()
            print(f"    Processed {idx}/{len(system_data)} records...")
    
    db.commit()
    print(f"✓ Generated {hours} hours of historical data")

def create_sample_alerts(db: Session, station_id: int):
    """Create some sample alerts"""
    print("Creating sample alerts...")
    
    alerts = [
        {
            "alert_type": "equipment_warning",
            "severity": "warning",
            "title": "Battery Temperature Elevated",
            "message": "Battery temperature reached 25°C, above normal operating range.",
            "source_type": "equipment",
            "source_id": "battery_01",
            "acknowledged": True,
            "resolved": True
        },
        {
            "alert_type": "low_renewable",
            "severity": "info",
            "title": "Low Wind Generation",
            "message": "Wind generation below 10 kW for extended period.",
            "source_type": "equipment",
            "source_id": "wind_01",
            "acknowledged": False,
            "resolved": False
        }
    ]
    
    for alert_data in alerts:
        alert = Alert(
            station_id=station_id,
            **alert_data,
            is_simulated=True
        )
        db.add(alert)
        print(f"  ✓ {alert.title}")
    
    db.commit()
    print(f"✓ Created {len(alerts)} sample alerts")

def main():
    """Main initialization function"""
    print("\n" + "="*60)
    print("POLAR-EMS Database Initialization")
    print("="*60 + "\n")
    
    # Initialize database schema
    print("Initializing database schema...")
    init_db()
    print("✓ Database schema created\n")
    
    # Create session
    db = SessionLocal()
    
    try:
        # Check if data already exists
        existing_station = db.query(Station).first()
        if existing_station:
            print("⚠ Database already contains data!")
            response = input("Do you want to continue and add more data? (yes/no): ")
            if response.lower() != 'yes':
                print("Initialization cancelled.")
                return
            station = existing_station
        else:
            # Create initial data
            station = create_initial_station(db)
            create_equipment(db, station.id)
            create_users(db, station.id)
        
        # Generate historical data
        print()
        response = input("Generate historical data? This may take a few minutes. (yes/no): ")
        if response.lower() == 'yes':
            days = int(input("How many days of data? (1-30): ") or "7")
            days = max(1, min(days, 30))
            generate_historical_data(db, station.id, days)
        
        # Create sample alerts
        print()
        create_sample_alerts(db, station.id)
        
        print("\n" + "="*60)
        print("✓ Database initialization complete!")
        print("="*60)
        print("\nDefault Users:")
        print("  admin:admin123 (Administrator)")
        print("  engineer:engineer123 (Station Engineer)")
        print("  viewer:viewer123 (Data Viewer)")
        print("\n⚠ IMPORTANT: Change these passwords in production!\n")
        
    except Exception as e:
        print(f"\n❌ Error during initialization: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()
