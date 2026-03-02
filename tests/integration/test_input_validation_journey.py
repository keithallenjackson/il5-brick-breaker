"""Functional tests for input validation across the full stack.

Critical path: The system rejects malicious or invalid input at every entry
point without leaking internal implementation details. Tests verify validation
works through the complete HTTP → Pydantic → response flow.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_xss_attempt_rejected(client: AsyncClient) -> None:
    """XSS payloads in player_name are rejected with 422."""
    xss_payloads = [
        "<script>alert(1)</script>",
        '"><img src=x onerror=alert(1)>',
        "javascript:alert(1)",
    ]
    for payload in xss_payloads:
        response = await client.post(
            "/api/v1/scores",
            json={"player_name": payload, "score": 100, "level_reached": 1},
        )
        assert response.status_code == 422, f"XSS payload not rejected: {payload}"
        # Verify structured error response, not a stack trace
        body = response.json()
        assert "detail" in body


@pytest.mark.asyncio
async def test_sql_injection_attempt_rejected(client: AsyncClient) -> None:
    """SQL injection payloads in player_name are rejected with 422."""
    sqli_payloads = [
        "'; DROP TABLE scores; --",
        "1' OR '1'='1",
        "admin'--",
    ]
    for payload in sqli_payloads:
        response = await client.post(
            "/api/v1/scores",
            json={"player_name": payload, "score": 100, "level_reached": 1},
        )
        assert response.status_code == 422, f"SQLi payload not rejected: {payload}"


@pytest.mark.asyncio
async def test_emoji_and_unicode_rejected(client: AsyncClient) -> None:
    """Non-ASCII characters in player_name are rejected."""
    response = await client.post(
        "/api/v1/scores",
        json={"player_name": "Player\U0001f600", "score": 100, "level_reached": 1},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_boundary_values_accepted(client: AsyncClient) -> None:
    """Maximum and minimum valid values are accepted and persisted."""
    # Max name length (50 chars)
    max_name = "A" * 50
    response = await client.post(
        "/api/v1/scores",
        json={"player_name": max_name, "score": 999999999, "level_reached": 9999},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["player_name"] == max_name
    assert data["score"] == 999999999
    assert data["level_reached"] == 9999

    # Minimum valid values
    response = await client.post(
        "/api/v1/scores",
        json={"player_name": "A", "score": 0, "level_reached": 1},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["player_name"] == "A"
    assert data["score"] == 0
    assert data["level_reached"] == 1

    # Verify both scores appear in leaderboard
    leaderboard = await client.get("/api/v1/leaderboard")
    assert leaderboard.json()["total_count"] == 2


@pytest.mark.asyncio
async def test_invalid_query_params_rejected(client: AsyncClient) -> None:
    """Invalid leaderboard query parameters are rejected with 422."""
    # Negative offset
    response = await client.get("/api/v1/leaderboard", params={"offset": -1})
    assert response.status_code == 422

    # Limit exceeds maximum
    response = await client.get("/api/v1/leaderboard", params={"limit": 101})
    assert response.status_code == 422

    # Limit below minimum
    response = await client.get("/api/v1/leaderboard", params={"limit": 0})
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_error_responses_hide_internals(client: AsyncClient) -> None:
    """Error responses contain structured detail but no stack traces."""
    response = await client.post(
        "/api/v1/scores",
        json={"player_name": "Valid", "score": "not_a_number", "level_reached": 1},
    )
    assert response.status_code == 422
    body = response.json()

    # Has structured error detail
    assert "detail" in body

    # Does not leak internal paths or stack traces
    body_str = str(body)
    assert "Traceback" not in body_str
    assert "/src/" not in body_str
