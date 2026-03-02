# Stage 1: Build — install dependencies using dev variant with pip
FROM cgr.dev/chainguard/python:latest-dev AS builder

WORKDIR /app

COPY pyproject.toml .
COPY src/ ./src/
COPY alembic/ ./alembic/
COPY alembic.ini .

RUN pip install --no-cache-dir --user .

# Stage 2: Runtime — minimal distroless image
FROM cgr.dev/chainguard/python:latest

WORKDIR /app

COPY --from=builder /home/nonroot/.local /home/nonroot/.local
COPY --from=builder /app/alembic/ ./alembic/
COPY --from=builder /app/alembic.ini .
COPY --from=builder /app/src/ ./src/

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PATH="/home/nonroot/.local/bin:$PATH"

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
