"""Health check API routes."""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Response
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import get_settings
from src.db.engine import get_db
from src.schemas import HealthResponse

router = APIRouter(tags=["health"])

settings = get_settings()


@router.get("/healthz", response_model=HealthResponse)
async def healthz() -> HealthResponse:
    """Liveness probe - always returns 200 if the service is running."""
    return HealthResponse(
        status="healthy",
        version=settings.APP_VERSION,
        timestamp=datetime.now(UTC),
    )


@router.get("/readyz", response_model=HealthResponse)
async def readyz(
    response: Response,
    session: AsyncSession = Depends(get_db),
) -> HealthResponse:
    """Readiness probe - checks database connectivity."""
    try:
        await session.execute(text("SELECT 1"))
        return HealthResponse(
            status="ready",
            version=settings.APP_VERSION,
            timestamp=datetime.now(UTC),
        )
    except Exception:
        response.status_code = 503
        return HealthResponse(
            status="not ready",
            version=settings.APP_VERSION,
            timestamp=datetime.now(UTC),
        )
