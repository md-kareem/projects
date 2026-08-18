from fastapi import APIRouter

# Import the individual route modules
from . import (
    routes_auth,
    routes_citizen,
    routes_department,
    routes_worker,
    routes_admin,
)

# Create the master API router
api_router = APIRouter()

# Include all sub-routers with specific prefixes and tags for the Swagger UI documentation
api_router.include_router(routes_auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(routes_citizen.router, prefix="/citizen", tags=["Citizen Module"])
api_router.include_router(routes_department.router, prefix="/department", tags=["Department Module"])
api_router.include_router(routes_worker.router, prefix="/worker", tags=["Field Worker Module"])
api_router.include_router(routes_admin.router, prefix="/admin", tags=["Admin Module"])