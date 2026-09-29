"""
API v1 routes
"""
from fastapi import APIRouter
from . import auth, dashboard, forecasts, recommendations, weather, alerts, ai, simulation
from .auth import router as auth_router
from .dashboard import router as dashboard_router
from .forecasts import router as forecasts_router
from .recommendations import router as recommendations_router
from .weather import router as weather_router
from .alerts import router as alerts_router
from .ai import router as ai_router
from .simulation import router as simulation_router

api_router = APIRouter()

# Include all routers
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(dashboard_router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(forecasts_router, prefix="/forecasts", tags=["forecasts"])
api_router.include_router(recommendations_router, prefix="/recommendations", tags=["recommendations"])
api_router.include_router(weather_router, prefix="/weather", tags=["weather"])
api_router.include_router(alerts_router, prefix="/alerts", tags=["alerts"])
api_router.include_router(ai_router, prefix="/ai", tags=["ai"])
api_router.include_router(simulation_router, prefix="/simulation", tags=["simulation"])

