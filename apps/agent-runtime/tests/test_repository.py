"""Tests for the ScoreRepository database operations."""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.repository import ScoreRepository


@pytest.mark.asyncio
async def test_create_score(async_session: AsyncSession) -> None:
    """Create a score and verify it is persisted correctly."""
    score = await ScoreRepository.create_score(
        session=async_session,
        player_name="RepoTest",
        score=3000,
        level_reached=10,
    )

    assert score.player_name == "RepoTest"
    assert score.score == 3000
    assert score.level_reached == 10
    assert score.id is not None
    assert score.created_at is not None


@pytest.mark.asyncio
async def test_get_leaderboard_ordering(async_session: AsyncSession) -> None:
    """Multiple scores should be returned in descending order by score."""
    await ScoreRepository.create_score(async_session, "Low", 100, 1)
    await ScoreRepository.create_score(async_session, "High", 5000, 8)
    await ScoreRepository.create_score(async_session, "Mid", 2500, 4)
    await async_session.commit()

    leaderboard = await ScoreRepository.get_leaderboard(async_session)

    assert len(leaderboard) == 3
    assert leaderboard[0].player_name == "High"
    assert leaderboard[1].player_name == "Mid"
    assert leaderboard[2].player_name == "Low"


@pytest.mark.asyncio
async def test_get_leaderboard_limit(async_session: AsyncSession) -> None:
    """Leaderboard should respect the limit parameter."""
    for i in range(5):
        await ScoreRepository.create_score(async_session, f"Player{i}", (i + 1) * 100, 1)
    await async_session.commit()

    leaderboard = await ScoreRepository.get_leaderboard(async_session, limit=3)

    assert len(leaderboard) == 3
