"""Score submission and leaderboard API routes."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.engine import get_db
from src.db.repository import ScoreRepository
from src.schemas import LeaderboardResponse, ScoreResponse, ScoreSubmission

router = APIRouter(tags=["scores"])


@router.post("/scores", response_model=ScoreResponse, status_code=201)
async def submit_score(
    submission: ScoreSubmission,
    session: AsyncSession = Depends(get_db),
) -> ScoreResponse:
    """Submit a new game score."""
    score = await ScoreRepository.create_score(
        session=session,
        player_name=submission.player_name,
        score=submission.score,
        level_reached=submission.level_reached,
    )
    return ScoreResponse.model_validate(score)


@router.get("/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard(
    limit: int = Query(default=10, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    session: AsyncSession = Depends(get_db),
) -> LeaderboardResponse:
    """Get the leaderboard with top scores."""
    scores = await ScoreRepository.get_leaderboard(session=session, limit=limit, offset=offset)
    total_count = await ScoreRepository.get_total_count(session=session)
    return LeaderboardResponse(
        scores=[ScoreResponse.model_validate(s) for s in scores],
        total_count=total_count,
    )
