"""Repository layer for database operations."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models import Score


class ScoreRepository:
    """Repository for Score CRUD operations."""

    @staticmethod
    async def create_score(
        session: AsyncSession,
        player_name: str,
        score: int,
        level_reached: int,
    ) -> Score:
        """Create a new score record."""
        db_score = Score(
            player_name=player_name,
            score=score,
            level_reached=level_reached,
        )
        session.add(db_score)
        await session.flush()
        await session.refresh(db_score)
        return db_score

    @staticmethod
    async def get_leaderboard(
        session: AsyncSession,
        limit: int = 10,
        offset: int = 0,
    ) -> list[Score]:
        """Get scores ordered by score descending."""
        stmt = select(Score).order_by(Score.score.desc()).limit(limit).offset(offset)
        result = await session.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def get_total_count(session: AsyncSession) -> int:
        """Get total count of scores."""
        stmt = select(func.count()).select_from(Score)
        result = await session.execute(stmt)
        count = result.scalar()
        return count if count is not None else 0
