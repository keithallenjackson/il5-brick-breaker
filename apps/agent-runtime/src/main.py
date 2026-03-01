"""FastAPI application factory and entrypoint."""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from src.config import get_settings
from src.db.engine import engine
from src.db.models import Base
from src.middleware.audit import AuditMiddleware
from src.middleware.security_headers import SecurityHeadersMiddleware
from src.routes.health import router as health_router
from src.routes.scores import router as scores_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan handler: create tables on startup for dev."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    application = FastAPI(
        title="Brick Breaker API",
        version=settings.APP_VERSION,
        lifespan=lifespan,
    )

    # Add CORS middleware
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Add custom middleware
    application.add_middleware(AuditMiddleware)
    application.add_middleware(SecurityHeadersMiddleware)

    # Include routers
    application.include_router(health_router)
    application.include_router(scores_router, prefix=settings.API_PREFIX)

    @application.get("/", include_in_schema=False)
    async def root() -> RedirectResponse:
        """Redirect root to API documentation."""
        return RedirectResponse(url="/docs")

    return application


app = create_app()
