"""Tests for score submission and leaderboard API endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_submit_score_success(client: AsyncClient) -> None:
    """POST a valid score and verify 201 response with correct fields."""
    payload = {"player_name": "TestPlayer", "score": 1500, "level_reached": 3}
    response = await client.post("/api/v1/scores", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert data["player_name"] == "TestPlayer"
    assert data["score"] == 1500
    assert data["level_reached"] == 3
    assert "id" in data
    assert "created_at" in data


@pytest.mark.asyncio
async def test_submit_score_invalid_name_empty(client: AsyncClient) -> None:
    """POST with empty name should return 422."""
    payload = {"player_name": "", "score": 100, "level_reached": 1}
    response = await client.post("/api/v1/scores", json=payload)

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_submit_score_invalid_name_special_chars(client: AsyncClient) -> None:
    """POST with special characters in name should return 422."""
    payload = {"player_name": "Player@#$!", "score": 100, "level_reached": 1}
    response = await client.post("/api/v1/scores", json=payload)

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_submit_score_invalid_name_too_long(client: AsyncClient) -> None:
    """POST with a 51-character name should return 422."""
    payload = {"player_name": "A" * 51, "score": 100, "level_reached": 1}
    response = await client.post("/api/v1/scores", json=payload)

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_submit_score_negative(client: AsyncClient) -> None:
    """POST with a negative score should return 422."""
    payload = {"player_name": "TestPlayer", "score": -1, "level_reached": 1}
    response = await client.post("/api/v1/scores", json=payload)

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_submit_score_too_large(client: AsyncClient) -> None:
    """POST with score exceeding 999999999 should return 422."""
    payload = {"player_name": "TestPlayer", "score": 1000000000, "level_reached": 1}
    response = await client.post("/api/v1/scores", json=payload)

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_leaderboard_empty(client: AsyncClient) -> None:
    """GET leaderboard with no scores should return empty list."""
    response = await client.get("/api/v1/leaderboard")

    assert response.status_code == 200
    data = response.json()
    assert data["scores"] == []
    assert data["total_count"] == 0


@pytest.mark.asyncio
async def test_get_leaderboard_ordered(client: AsyncClient) -> None:
    """POST multiple scores and verify leaderboard returns them in descending order."""
    scores = [
        {"player_name": "Alice", "score": 500, "level_reached": 2},
        {"player_name": "Bob", "score": 1500, "level_reached": 5},
        {"player_name": "Charlie", "score": 1000, "level_reached": 3},
    ]
    for s in scores:
        await client.post("/api/v1/scores", json=s)

    response = await client.get("/api/v1/leaderboard")

    assert response.status_code == 200
    data = response.json()
    assert len(data["scores"]) == 3
    assert data["scores"][0]["player_name"] == "Bob"
    assert data["scores"][1]["player_name"] == "Charlie"
    assert data["scores"][2]["player_name"] == "Alice"
    assert data["scores"][0]["score"] >= data["scores"][1]["score"] >= data["scores"][2]["score"]


@pytest.mark.asyncio
async def test_get_leaderboard_limit(client: AsyncClient) -> None:
    """POST 5 scores, GET with limit=3, verify only 3 returned."""
    for i in range(5):
        payload = {"player_name": f"Player{i}", "score": (i + 1) * 100, "level_reached": 1}
        await client.post("/api/v1/scores", json=payload)

    response = await client.get("/api/v1/leaderboard", params={"limit": 3})

    assert response.status_code == 200
    data = response.json()
    assert len(data["scores"]) == 3
    assert data["total_count"] == 5


@pytest.mark.asyncio
async def test_get_leaderboard_max_limit(client: AsyncClient) -> None:
    """GET with limit=200 should be capped at 100 (validated by FastAPI query param)."""
    response = await client.get("/api/v1/leaderboard", params={"limit": 200})

    assert response.status_code == 422
