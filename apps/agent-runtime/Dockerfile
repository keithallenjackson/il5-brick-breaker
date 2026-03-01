FROM registry1.dso.mil/ironbank/opensource/python/python312:3.12

WORKDIR /app

# Copy all project files before install so setuptools can find the src package
COPY pyproject.toml .
COPY src/ ./src/
COPY alembic/ ./alembic/
COPY alembic.ini .

# Install as root (system-level), then drop to non-root for runtime
RUN pip install --no-cache-dir .

USER 1001

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/healthz')"

CMD ["python", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
