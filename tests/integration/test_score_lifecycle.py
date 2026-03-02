"""Functional tests for the complete score submission lifecycle.

Critical path: A player submits a score, then the score appears in the
leaderboard in the correct position. Tests verify the full journey through
HTTP → FastAPI → middleware → SQLAlchemy → database → response.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_submit_score_then_retrieve_in_leaderboard(client: AsyncClient) -> None:
    """Complete read-write journey: submit a score and verify it appears in the leaderboard."""
    # Submit a score
    submit_response = await client.post(
        "/api/v1/scores",
        json={"player_name": "Alice", "score": 5000, "level_reached": 5},
    )
    assert submit_response.status_code == 201
    submitted = submit_response.json()

    # Retrieve leaderboard and verify the score appears
    leaderboard_response = await client.get("/api/v1/leaderboard")
    assert leaderboard_response.status_code == 200
    leaderboard = leaderboard_response.json()

    assert leaderboard["total_count"] == 1
    assert len(leaderboard["scores"]) == 1
    assert leaderboard["scores"][0]["id"] == submitted["id"]
    assert leaderboard["scores"][0]["player_name"] == "Alice"
    assert leaderboard["scores"][0]["score"] == 5000
    assert leaderboard["scores"][0]["level_reached"] == 5


@pytest.mark.asyncio
async def test_multiple_scores_ranked_correctly(client: AsyncClient) -> None:
    """Submit 5 scores and verify leaderboard returns them in descending order."""
    players = [
        {"player_name": "Eve", "score": 200, "level_reached": 1},
        {"player_name": "Dave", "score": 8000, "level_reached": 8},
        {"player_name": "Charlie", "score": 3000, "level_reached": 3},
        {"player_name": "Alice", "score": 5000, "level_reached": 5},
        {"player_name": "Bob", "score": 1000, "level_reached": 2},
    ]
    for p in players:
        response = await client.post("/api/v1/scores", json=p)
        assert response.status_code == 201

    leaderboard = await client.get("/api/v1/leaderboard")
    data = leaderboard.json()

    assert data["total_count"] == 5
    assert len(data["scores"]) == 5

    # Verify descending order
    names_in_order = [s["player_name"] for s in data["scores"]]
    assert names_in_order == ["Dave", "Alice", "Charlie", "Bob", "Eve"]

    # Verify scores are monotonically decreasing
    scores = [s["score"] for s in data["scores"]]
    assert scores == sorted(scores, reverse=True)


@pytest.mark.asyncio
async def test_leaderboard_pagination_across_pages(client: AsyncClient) -> None:
    """Submit 15 scores, page through with offset/limit, verify all scores accounted for."""
    for i in range(15):
        await client.post(
            "/api/v1/scores",
            json={
                "player_name": f"Player{i:02d}",
                "score": (i + 1) * 100,
                "level_reached": 1,
            },
        )

    # Page 1: first 5
    page1 = await client.get("/api/v1/leaderboard", params={"limit": 5, "offset": 0})
    page1_data = page1.json()
    assert len(page1_data["scores"]) == 5
    assert page1_data["total_count"] == 15

    # Page 2: next 5
    page2 = await client.get("/api/v1/leaderboard", params={"limit": 5, "offset": 5})
    page2_data = page2.json()
    assert len(page2_data["scores"]) == 5

    # Page 3: last 5
    page3 = await client.get("/api/v1/leaderboard", params={"limit": 5, "offset": 10})
    page3_data = page3.json()
    assert len(page3_data["scores"]) == 5

    # Verify no duplicates across pages
    all_ids = {
        s["id"]
        for s in page1_data["scores"] + page2_data["scores"] + page3_data["scores"]
    }
    assert len(all_ids) == 15

    # Verify ordering is maintained across pages (page1 scores > page2 scores > page3 scores)
    assert page1_data["scores"][-1]["score"] >= page2_data["scores"][0]["score"]
    assert page2_data["scores"][-1]["score"] >= page3_data["scores"][0]["score"]
