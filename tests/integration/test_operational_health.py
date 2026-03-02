"""Functional tests for operational health and system behavior.

Critical path: The system accurately reports its health, applies security
headers to all responses, and handles concurrent requests without errors.
"""

import asyncio

import pytest
from httpx import ASGITransport, AsyncClient

SECURITY_HEADERS = [
    "X-Content-Type-Options",
    "X-Frame-Options",
    "Strict-Transport-Security",
    "Content-Security-Policy",
    "X-XSS-Protection",
    "Referrer-Policy",
]


@pytest.mark.asyncio
async def test_healthz_always_responds(client: AsyncClient) -> None:
    """Liveness probe returns 200 with expected fields."""
    response = await client.get("/healthz")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "timestamp" in data


@pytest.mark.asyncio
async def test_readyz_reflects_database_state(client: AsyncClient) -> None:
    """Readiness probe returns 200 when database is available."""
    response = await client.get("/readyz")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"


@pytest.mark.asyncio
async def test_security_headers_on_success_response(client: AsyncClient) -> None:
    """All 6 security headers are present on 200 responses."""
    response = await client.get("/healthz")
    assert response.status_code == 200
    for header in SECURITY_HEADERS:
        assert header.lower() in {k.lower() for k in response.headers}, (
            f"Missing header: {header}"
        )


@pytest.mark.asyncio
async def test_security_headers_on_created_response(client: AsyncClient) -> None:
    """All 6 security headers are present on 201 responses."""
    response = await client.post(
        "/api/v1/scores",
        json={"player_name": "HeaderTest", "score": 100, "level_reached": 1},
    )
    assert response.status_code == 201
    for header in SECURITY_HEADERS:
        assert header.lower() in {k.lower() for k in response.headers}, (
            f"Missing header: {header}"
        )


@pytest.mark.asyncio
async def test_security_headers_on_validation_error(client: AsyncClient) -> None:
    """All 6 security headers are present on 422 responses."""
    response = await client.post(
        "/api/v1/scores",
        json={"player_name": "", "score": 100, "level_reached": 1},
    )
    assert response.status_code == 422
    for header in SECURITY_HEADERS:
        assert header.lower() in {k.lower() for k in response.headers}, (
            f"Missing header: {header}"
        )


@pytest.mark.asyncio
async def test_security_headers_on_not_found(client: AsyncClient) -> None:
    """All 6 security headers are present on 404 responses."""
    response = await client.get("/nonexistent-path")
    assert response.status_code == 404
    for header in SECURITY_HEADERS:
        assert header.lower() in {k.lower() for k in response.headers}, (
            f"Missing header: {header}"
        )


@pytest.mark.asyncio
async def test_concurrent_score_submissions(app) -> None:
    """10 simultaneous submissions all succeed and appear in the leaderboard."""

    async def submit_score(i: int) -> int:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
            response = await ac.post(
                "/api/v1/scores",
                json={
                    "player_name": f"Concurrent{i:02d}",
                    "score": (i + 1) * 100,
                    "level_reached": 1,
                },
            )
            return response.status_code

    # Submit 10 scores concurrently
    results = await asyncio.gather(*[submit_score(i) for i in range(10)])
    assert all(status == 201 for status in results), (
        f"Some submissions failed: {results}"
    )

    # Verify all 10 appear in the leaderboard
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        leaderboard = await ac.get("/api/v1/leaderboard", params={"limit": 100})
        data = leaderboard.json()
        assert data["total_count"] == 10
        assert len(data["scores"]) == 10
