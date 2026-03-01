"""Tests for health check endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_healthz_returns_200(client: AsyncClient) -> None:
    """GET /healthz should always return 200."""
    response = await client.get("/healthz")

    assert response.status_code == 200


@pytest.mark.asyncio
async def test_readyz_returns_200(client: AsyncClient) -> None:
    """GET /readyz should return 200 when the database is available."""
    response = await client.get("/readyz")

    assert response.status_code == 200


@pytest.mark.asyncio
async def test_healthz_response_format(client: AsyncClient) -> None:
    """GET /healthz response should contain status, version, and timestamp fields."""
    response = await client.get("/healthz")

    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"] == "healthy"
    assert "version" in data
    assert data["version"] == "0.1.0"
    assert "timestamp" in data
