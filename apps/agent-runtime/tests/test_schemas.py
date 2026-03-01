"""Tests for Pydantic schema validation."""

import uuid
from datetime import UTC, datetime

import pytest
from pydantic import ValidationError

from src.schemas import ScoreResponse, ScoreSubmission


def test_score_submission_valid() -> None:
    """Valid data should pass validation."""
    submission = ScoreSubmission(player_name="Player1", score=1000, level_reached=5)

    assert submission.player_name == "Player1"
    assert submission.score == 1000
    assert submission.level_reached == 5


def test_score_submission_name_boundaries() -> None:
    """Test 1-char and 50-char names pass validation."""
    # Minimum: 1 character
    short = ScoreSubmission(player_name="A", score=0, level_reached=1)
    assert short.player_name == "A"

    # Maximum: 50 characters
    long_name = "A" * 50
    long_sub = ScoreSubmission(player_name=long_name, score=0, level_reached=1)
    assert long_sub.player_name == long_name


def test_score_submission_invalid_pattern() -> None:
    """Names with special characters (@, #, etc.) should be rejected."""
    invalid_names = ["Player@Home", "Test#1", "Bad$Name", "No!Way", "Semi;colon"]
    for name in invalid_names:
        with pytest.raises(ValidationError):
            ScoreSubmission(player_name=name, score=100, level_reached=1)


def test_score_response_from_attributes() -> None:
    """ScoreResponse should be constructible from ORM-like attributes."""

    class FakeScore:
        def __init__(self) -> None:
            self.id = uuid.uuid4()
            self.player_name = "TestPlayer"
            self.score = 2000
            self.level_reached = 7
            self.created_at = datetime.now(UTC)

    fake = FakeScore()
    response = ScoreResponse.model_validate(fake, from_attributes=True)

    assert response.player_name == "TestPlayer"
    assert response.score == 2000
    assert response.level_reached == 7
    assert response.id == fake.id
    assert response.created_at == fake.created_at
