FROM registry1.dso.mil/ironbank/opensource/python/python312:3.12 AS base

USER 1001
WORKDIR /app

COPY --chown=1001:1001 pyproject.toml .
RUN pip install --no-cache-dir --user .

COPY --chown=1001:1001 src/ ./src/
COPY --chown=1001:1001 alembic/ ./alembic/
COPY --chown=1001:1001 alembic.ini .

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/healthz')"

CMD ["python", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
