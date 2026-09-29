"""
Real-time Simulation Service
Continuously generates simulated data and updates the system
"""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional, Callable
from sqlalchemy.orm import Session

from ..core.database import SessionLocal
from ..models import EnergyData, EquipmentStatus, WeatherData, Station, Alert
from .data_simulator import DataSimulator

logger = logging.getLogger(__name__)


class SimulationService:
    """
    Background service for real-time data simulation
    
    Generates:
    - Energy data every 5 minutes
    - Weather updates every 15 minutes
    - Equipment status updates
    - Random events and alerts
    """
    
    def __init__(self, station_id: int = 1, broadcast_callback: Optional[Callable] = None):
        """Initialize simulation service"""
        self.station_id = station_id
        self.simulator = DataSimulator()
        self.is_running = False
        self.update_interval = 300  # 5 minutes in seconds
        self.last_update = None
        self.broadcast_callback = broadcast_callback
        
    async def start(self):
        """Start the simulation service"""
        if self.is_running:
            logger.warning("Simulation service already running")
            return
        
        self.is_running = True
        logger.info(f"Starting simulation service for station {self.station_id}")
        
        # Run simulation loop
        while self.is_running:
            try:
                await self._simulation_step()
                await asyncio.sleep(self.update_interval)
            except Exception as e:
                logger.error(f"Error in simulation step: {e}", exc_info=True)
                await asyncio.sleep(10)  # Wait before retrying
    
    def stop(self):
        """Stop the simulation service"""
        logger.info("Stopping simulation service")
        self.is_running = False
    
    async def _simulation_step(self):
        """Execute one simulation step"""
        db = SessionLocal()
        try:
            current_time = datetime.utcnow()
            
            # Generate data for the next hour
            system_data = self.simulator.generate_energy_system_data(
                current_time,
                hours=1
            )
            
            # Get the first row (current state)
            current_state = system_data.iloc[0]
            
            # Store energy data
            energy_record = EnergyData(
                station_id=self.station_id,
                timestamp=current_time,
                total_load_kw=float(current_state['total_load_kw']),
                critical_load_kw=float(current_state['critical_load_kw']),
                deferrable_load_kw=float(current_state['deferrable_load_kw']),
                diesel_generation_kw=float(current_state['diesel_generation_kw']),
                wind_generation_kw=float(current_state['wind_generation_kw']),
                total_generation_kw=float(current_state['total_generation_kw']),
                battery_charge_kw=float(current_state['battery_charge_kw']),
                battery_discharge_kw=float(current_state['battery_discharge_kw']),
                battery_soc_percent=float(current_state['battery_soc_percent']),
                fuel_consumption_liters=float(current_state['fuel_consumption_liters']),
                frequency_hz=50.0,
                voltage_v=230.0,
                is_simulated=True
            )
            db.add(energy_record)
            
            # Store weather data
            weather_record = WeatherData(
                station_id=self.station_id,
                timestamp=current_time,
                temperature_c=float(current_state['temperature_c']),
                wind_speed_ms=float(current_state['wind_speed_ms']),
                wind_direction_deg=0.0,
                humidity_percent=75.0,
                pressure_hpa=1013.0,
                condition='clear',
                source='simulated',
                is_forecast=False
            )
            db.add(weather_record)
            
            # Generate equipment statuses
            equipment_statuses = self.simulator.generate_equipment_status(
                current_time,
                system_data,
                0
            )
            
            for eq_status in equipment_statuses:
                # Find equipment ID
                # In a real system, you'd query the Equipment table
                # For now, use dummy IDs
                status_record = EquipmentStatus(
                    station_id=self.station_id,
                    equipment_id=1,  # Simplified
                    timestamp=current_time,
                    status=eq_status['status'],
                    power_output_kw=eq_status['power_output_kw'],
                    efficiency_percent=eq_status.get('efficiency_percent'),
                    temperature_c=eq_status.get('temperature_c'),
                    is_simulated=True
                )
                db.add(status_record)
            
            # Randomly generate alerts
            failure = self.simulator.simulate_failure(probability=0.05)
            if failure:
                alert = Alert(
                    station_id=self.station_id,
                    alert_type=failure['type'],
                    severity=failure['severity'],
                    title=f"{failure['equipment'].replace('_', ' ').title()} Alert",
                    message=failure['message'],
                    source_type='equipment',
                    source_id=failure['equipment'],
                    acknowledged=False,
                    resolved=False,
                    is_simulated=True
                )
                db.add(alert)
                logger.info(f"Generated alert: {failure['type']}")
            
            db.commit()
            self.last_update = current_time
            
            # Broadcast update via WebSocket if callback provided
            if self.broadcast_callback:
                await self.broadcast_callback({
                    "timestamp": current_time.isoformat(),
                    "current_load_kw": float(current_state['total_load_kw']),
                    "diesel_generation_kw": float(current_state['diesel_generation_kw']),
                    "wind_generation_kw": float(current_state['wind_generation_kw']),
                    "battery_soc_percent": float(current_state['battery_soc_percent']),
                    "temperature_c": float(current_state['temperature_c']),
                    "wind_speed_ms": float(current_state['wind_speed_ms']),
                })
            
            logger.info(f"Simulation step completed at {current_time}")
            
        except Exception as e:
            logger.error(f"Error in simulation step: {e}", exc_info=True)
            db.rollback()
        finally:
            db.close()
    
    def get_status(self) -> dict:
        """Get simulation service status"""
        return {
            'is_running': self.is_running,
            'station_id': self.station_id,
            'last_update': self.last_update.isoformat() if self.last_update else None,
            'update_interval_seconds': self.update_interval
        }


# Global simulation service instance
_simulation_service: Optional[SimulationService] = None


def get_simulation_service(station_id: int = 1, broadcast_callback: Optional[Callable] = None) -> SimulationService:
    """Get or create simulation service instance"""
    global _simulation_service
    if _simulation_service is None:
        _simulation_service = SimulationService(station_id, broadcast_callback)
    elif broadcast_callback and not _simulation_service.broadcast_callback:
        _simulation_service.broadcast_callback = broadcast_callback
    return _simulation_service


async def start_simulation():
    """Start the simulation service"""
    service = get_simulation_service()
    await service.start()


def stop_simulation():
    """Stop the simulation service"""
    service = get_simulation_service()
    service.stop()
