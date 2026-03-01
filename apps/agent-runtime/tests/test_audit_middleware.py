"""Tests for audit logging middleware."""

from unittest.mock import patch

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_request_produces_audit_log(client: AsyncClient) -> None:
    """A request to a non-health endpoint should produce an audit log entry."""
    with patch("src.middleware.audit.logger") as mock_logger:
        await client.get("/api/v1/leaderboard")

        mock_logger.info.assert_called_once()


@pytest.mark.asyncio
async def test_audit_log_has_required_fields(client: AsyncClient) -> None:
    """Verify the audit log call includes all required fields."""
    with patch("src.middleware.audit.logger") as mock_logger:
        await client.get("/api/v1/leaderboard")

        mock_logger.info.assert_called_once()
        call_kwargs = mock_logger.info.call_args
        # The first positional argument is the event name
        assert call_kwargs[0][0] == "api_request"
        # Check all required keyword fields
        kw = call_kwargs[1]
        assert "timestamp" in kw
        assert "action" in kw
        assert kw["action"] == "GET"
        assert "resource" in kw
        assert kw["resource"] == "/api/v1/leaderboard"
        assert "outcome" in kw
        assert kw["outcome"] == "success"
        assert "status_code" in kw
        assert kw["status_code"] == 200
        assert "source_ip" in kw
        assert "request_id" in kw
        assert "duration_ms" in kw
        assert "user_agent" in kw


@pytest.mark.asyncio
async def test_healthz_not_audited(client: AsyncClient) -> None:
    """GET /healthz should NOT produce an audit log entry."""
    with patch("src.middleware.audit.logger") as mock_logger:
        await client.get("/healthz")

        mock_logger.info.assert_not_called()
