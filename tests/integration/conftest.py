"""Functional test fixtures for full-service testing with stubbed dependencies.

Uses SQLite in-memory as the database stub (zero external dependencies)
to test complete user journeys through the FastAPI application with all
middleware active.
"""

from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.db.engine import get_db
from src.db.models import Base
from src.main import create_app

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def anyio_backend() -> str:
    """Use asyncio as the async backend for tests."""
    return "asyncio"


@pytest.fixture(scope="session")
def async_engine():
    """Create a session-scoped async SQLite engine for functional testing."""
    return create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        connect_args={"check_same_thread": False},
    )


@pytest.fixture(scope="session", autouse=True)
async def _create_tables(async_engine):
    """Create database tables once at session start."""
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await async_engine.dispose()


@pytest.fixture(autouse=True)
async def _clean_tables(async_engine):
    """Truncate all tables between tests for isolation."""
    yield
    async with async_engine.begin() as conn:
        await conn.execute(text("DELETE FROM scores"))


@pytest.fixture()
async def app(async_engine):
    """Create a FastAPI test application with overridden database dependency."""
    test_app = create_app()

    session_factory = async_sessionmaker(
        async_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        async with session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    test_app.dependency_overrides[get_db] = override_get_db
    return test_app


@pytest.fixture()
async def client(app) -> AsyncGenerator[AsyncClient, None]:
    """Provide an async HTTP client for functional tests."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac
