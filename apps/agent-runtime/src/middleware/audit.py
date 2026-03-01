"""Audit logging middleware for structured request logging."""

import time
import uuid
from collections.abc import Callable
from datetime import UTC, datetime

import structlog
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = structlog.get_logger("audit")

# Paths to skip for audit logging to reduce noise
SKIP_PATHS = {"/healthz", "/readyz"}


class AuditMiddleware(BaseHTTPMiddleware):
    """ASGI middleware that logs every request as structured JSON."""

    async def dispatch(self, request: Request, call_next: Callable[..., Response]) -> Response:  # type: ignore[override]
        """Process the request and log audit information."""
        path = request.url.path

        # Skip health check endpoints
        if path in SKIP_PATHS:
            return await call_next(request)  # type: ignore[misc,no-any-return]

        request_id = str(uuid.uuid4())
        start_time = time.monotonic()

        # Extract client information
        source_ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
        if not source_ip and request.client:
            source_ip = request.client.host
        user_agent = request.headers.get("user-agent", "")

        try:
            response: Response = await call_next(request)  # type: ignore[misc]
            duration_ms = round((time.monotonic() - start_time) * 1000, 2)
            outcome = "success" if response.status_code < 400 else "error"  # noqa: PLR2004

            logger.info(
                "api_request",
                timestamp=datetime.now(UTC).isoformat(),
                user_identity="anonymous",
                action=request.method,
                resource=path,
                outcome=outcome,
                status_code=response.status_code,
                source_ip=source_ip,
                user_agent=user_agent,
                request_id=request_id,
                duration_ms=duration_ms,
            )

            return response
        except Exception:
            duration_ms = round((time.monotonic() - start_time) * 1000, 2)

            logger.error(
                "api_request",
                timestamp=datetime.now(UTC).isoformat(),
                user_identity="anonymous",
                action=request.method,
                resource=path,
                outcome="error",
                status_code=500,
                source_ip=source_ip,
                user_agent=user_agent,
                request_id=request_id,
                duration_ms=duration_ms,
            )
            raise
