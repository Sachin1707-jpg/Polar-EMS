"""
POLAR-EMS Main Application
FastAPI backend for AI-Driven Smart Energy Management System
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import asyncio
from datetime import datetime
from typing import List

from .core.config import settings
from .core.database import init_db, engine
from .models import Base

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-Driven Smart Energy Management System for Polar Research Stations",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.API_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routers
from .api.v1 import (
    auth, dashboard, weather, forecasts, 
    recommendations, alerts, 
    ai, simulation
)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logger.info(f"WebSocket client disconnected. Total connections: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients"""
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to client: {e}")

manager = ConnectionManager()


@app.on_event("startup")
async def startup_event():
    """Initialize application on startup"""
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Simulation Mode: {settings.SIMULATION_MODE}")
    
    # Initialize database
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization error: {e}")
    
    # Start simulation service if in simulation mode
    if settings.SIMULATION_MODE:
        from .services.simulation_service import get_simulation_service
        
        # Pass broadcast callback to simulation service
        simulation_service = get_simulation_service(broadcast_callback=broadcast_system_update)
        asyncio.create_task(simulation_service.start())
        logger.info("Simulation service started with WebSocket broadcasting")
    
    logger.info("Application startup complete")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down application")
    
    # Stop simulation service
    if settings.SIMULATION_MODE:
        from .services.simulation_service import stop_simulation
        stop_simulation()
        logger.info("Simulation service stopped")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "environment": settings.ENVIRONMENT,
        "simulation_mode": settings.SIMULATION_MODE,
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await manager.connect(websocket)
    
    # Send initial connection confirmation
    await websocket.send_json({
        "type": "connected",
        "message": "WebSocket connection established",
        "timestamp": datetime.utcnow().isoformat()
    })
    
    try:
        while True:
            # Keep connection alive and listen for messages
            data = await websocket.receive_text()
            logger.debug(f"Received WebSocket message: {data}")
            
            # Echo back for heartbeat
            await websocket.send_json({
                "type": "pong",
                "timestamp": datetime.utcnow().isoformat()
            })
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)


async def broadcast_system_update(data: dict):
    """Broadcast system update to all connected WebSocket clients"""
    await manager.broadcast({
        "type": "system_update",
        "data": data,
        "timestamp": datetime.utcnow().isoformat()
    })


async def broadcast_alert(alert_data: dict):
    """Broadcast new alert to all connected clients"""
    await manager.broadcast({
        "type": "alert",
        "data": alert_data,
        "timestamp": datetime.utcnow().isoformat()
    })


async def broadcast_recommendation(recommendation_data: dict):
    """Broadcast new recommendation to all connected clients"""
    await manager.broadcast({
        "type": "recommendation",
        "data": recommendation_data,
        "timestamp": datetime.utcnow().isoformat()
    })


# Exception handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"detail": "Resource not found"}
    )


@app.exception_handler(500)
async def internal_error_handler(request, exc):
    logger.error(f"Internal server error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


# Import and include API routers
from .api.v1 import auth, dashboard, weather, forecasts, recommendations, alerts, ai, simulation

app.include_router(auth.router, prefix="/api/v1/auth", tags=["authentication"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["dashboard"])
app.include_router(weather.router, prefix="/api/v1/weather", tags=["weather"])
app.include_router(forecasts.router, prefix="/api/v1/forecasts", tags=["forecasts"])
app.include_router(recommendations.router, prefix="/api/v1/recommendations", tags=["recommendations"])
app.include_router(alerts.router, prefix="/api/v1/alerts", tags=["alerts"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["ai"])
app.include_router(simulation.router, prefix="/api/v1/simulation", tags=["simulation"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG
    )
