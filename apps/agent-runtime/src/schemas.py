"""Pydantic v2 schemas for request/response validation."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ScoreSubmission(BaseModel):
    """Schema for submitting a new score."""

    player_name: str = Field(
        ...,
        min_length=1,
        max_length=50,
        pattern=r"^[a-zA-Z0-9_ -]+$",
        description="Player name (alphanumeric, spaces, underscores, hyphens)",
    )
    score: int = Field(
        ...,
        ge=0,
        le=999999999,
        description="Player score",
    )
    level_reached: int = Field(
        ...,
        ge=1,
        le=9999,
        description="Highest level reached",
    )


class ScoreResponse(BaseModel):
    """Schema for score response."""

    id: uuid.UUID
    player_name: str
    score: int
    level_reached: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LeaderboardResponse(BaseModel):
    """Schema for leaderboard response."""

    scores: list[ScoreResponse]
    total_count: int


class HealthResponse(BaseModel):
    """Schema for health check response."""

    status: str
    version: str
    timestamp: datetime
