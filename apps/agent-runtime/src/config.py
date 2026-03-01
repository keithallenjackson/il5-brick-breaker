"""Application configuration using Pydantic Settings."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/brickbreaker"
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]
    LOG_LEVEL: str = "INFO"
    API_PREFIX: str = "/api/v1"
    APP_VERSION: str = "0.1.0"

    model_config = {"env_prefix": "", "case_sensitive": True}


def get_settings() -> Settings:
    """Return application settings singleton."""
    return Settings()
