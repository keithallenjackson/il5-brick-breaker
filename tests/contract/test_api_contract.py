"""Contract tests verifying frontend API client expectations match backend API schema.

These tests validate that the OpenAPI schema produced by the FastAPI backend
matches the TypeScript types and expectations defined in the web-ui API client.
Run on a schedule (daily), not per-commit, per MinimumCD testing fundamentals.
"""

import pytest
from httpx import ASGITransport, AsyncClient

from src.main import create_app


@pytest.fixture()
async def openapi_schema():
    """Fetch the OpenAPI schema from the running FastAPI application."""
    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/openapi.json")
        assert response.status_code == 200
        return response.json()


# --- Endpoint existence contracts ---


@pytest.mark.asyncio
async def test_scores_endpoint_exists(openapi_schema: dict) -> None:
    """Frontend expects POST /api/v1/scores to exist."""
    paths = openapi_schema["paths"]
    assert "/api/v1/scores" in paths, "Missing endpoint: POST /api/v1/scores"
    assert "post" in paths["/api/v1/scores"], "POST method missing on /api/v1/scores"


@pytest.mark.asyncio
async def test_leaderboard_endpoint_exists(openapi_schema: dict) -> None:
    """Frontend expects GET /api/v1/leaderboard to exist."""
    paths = openapi_schema["paths"]
    assert "/api/v1/leaderboard" in paths, "Missing endpoint: GET /api/v1/leaderboard"
    assert "get" in paths["/api/v1/leaderboard"], (
        "GET method missing on /api/v1/leaderboard"
    )


# --- Request schema contracts ---


@pytest.mark.asyncio
async def test_score_submission_request_schema(openapi_schema: dict) -> None:
    """Frontend ScoreSubmission type must match backend ScoreSubmission schema.

    Frontend expects: { player_name: string, score: number, level_reached: number }
    """
    schemas = openapi_schema["components"]["schemas"]
    assert "ScoreSubmission" in schemas, "Missing schema: ScoreSubmission"

    score_schema = schemas["ScoreSubmission"]
    properties = score_schema["properties"]

    # Frontend expects these exact field names
    assert "player_name" in properties, "Missing field: player_name"
    assert "score" in properties, "Missing field: score"
    assert "level_reached" in properties, "Missing field: level_reached"

    # Frontend expects string type for player_name
    assert properties["player_name"]["type"] == "string"

    # Frontend expects number type for score and level_reached
    assert properties["score"]["type"] == "integer"
    assert properties["level_reached"]["type"] == "integer"

    # All three fields must be required
    required = score_schema.get("required", [])
    assert "player_name" in required
    assert "score" in required
    assert "level_reached" in required


# --- Response schema contracts ---


@pytest.mark.asyncio
async def test_score_response_schema(openapi_schema: dict) -> None:
    """Frontend ScoreResponse type must match backend ScoreResponse schema.

    Frontend expects: { id: string, player_name: string, score: number,
                        level_reached: number, created_at: string }
    """
    schemas = openapi_schema["components"]["schemas"]
    assert "ScoreResponse" in schemas, "Missing schema: ScoreResponse"

    response_schema = schemas["ScoreResponse"]
    properties = response_schema["properties"]

    # Frontend expects these exact field names
    expected_fields = ["id", "player_name", "score", "level_reached", "created_at"]
    for field in expected_fields:
        assert field in properties, f"Missing field in ScoreResponse: {field}"

    # Frontend treats id as string (UUID serialized)
    assert properties["id"]["type"] == "string"
    assert properties["id"]["format"] == "uuid"

    # Frontend treats created_at as string (ISO 8601)
    assert properties["created_at"]["type"] == "string"
    assert properties["created_at"]["format"] == "date-time"


@pytest.mark.asyncio
async def test_leaderboard_response_schema(openapi_schema: dict) -> None:
    """Frontend LeaderboardResponse type must match backend schema.

    Frontend expects: { scores: LeaderboardEntry[], total_count: number }
    """
    schemas = openapi_schema["components"]["schemas"]
    assert "LeaderboardResponse" in schemas, "Missing schema: LeaderboardResponse"

    response_schema = schemas["LeaderboardResponse"]
    properties = response_schema["properties"]

    # Frontend expects scores array and total_count
    assert "scores" in properties, "Missing field: scores"
    assert "total_count" in properties, "Missing field: total_count"

    # total_count must be integer
    assert properties["total_count"]["type"] == "integer"

    # scores must be an array of ScoreResponse
    assert properties["scores"]["type"] == "array"


# --- Status code contracts ---


@pytest.mark.asyncio
async def test_score_submission_returns_201(openapi_schema: dict) -> None:
    """Frontend expects POST /api/v1/scores to return 201 on success."""
    post_op = openapi_schema["paths"]["/api/v1/scores"]["post"]
    assert "201" in post_op["responses"], "POST /api/v1/scores must return 201"


@pytest.mark.asyncio
async def test_leaderboard_returns_200(openapi_schema: dict) -> None:
    """Frontend expects GET /api/v1/leaderboard to return 200 on success."""
    get_op = openapi_schema["paths"]["/api/v1/leaderboard"]["get"]
    assert "200" in get_op["responses"], "GET /api/v1/leaderboard must return 200"


# --- Error response contracts ---


@pytest.mark.asyncio
async def test_validation_error_returns_422(openapi_schema: dict) -> None:
    """Frontend ApiError expects 422 for validation errors with detail field."""
    post_op = openapi_schema["paths"]["/api/v1/scores"]["post"]
    assert "422" in post_op["responses"], (
        "POST /api/v1/scores must document 422 response"
    )


# --- Query parameter contracts ---


@pytest.mark.asyncio
async def test_leaderboard_accepts_limit_param(openapi_schema: dict) -> None:
    """Frontend passes limit query parameter (default 20) to leaderboard endpoint."""
    get_op = openapi_schema["paths"]["/api/v1/leaderboard"]["get"]
    params = get_op.get("parameters", [])
    param_names = [p["name"] for p in params]
    assert "limit" in param_names, (
        "GET /api/v1/leaderboard must accept 'limit' query parameter"
    )
