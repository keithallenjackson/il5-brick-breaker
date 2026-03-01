#!/usr/bin/env bash
# Set up local development environment
set -euo pipefail

echo "=== Local Development Setup ==="

# Check prerequisites
echo "Checking prerequisites..."
command -v python3 &> /dev/null || { echo "ERROR: Python 3 not found"; exit 1; }
command -v node &> /dev/null || { echo "ERROR: Node.js not found"; exit 1; }
command -v npm &> /dev/null || { echo "ERROR: npm not found"; exit 1; }

PYTHON_VERSION=$(python3 --version | grep -oP '\d+\.\d+')
NODE_VERSION=$(node --version | grep -oP '\d+')
echo "  Python: $(python3 --version)"
echo "  Node.js: $(node --version)"
echo "  npm: $(npm --version)"

# Set up Python backend
echo ""
echo "Setting up Python backend (apps/agent-runtime)..."
cd apps/agent-runtime

if [ ! -d ".venv" ]; then
    python3 -m venv .venv
    echo "  Created virtual environment"
fi

source .venv/bin/activate
pip install -e ".[dev]" --quiet
echo "  Installed Python dependencies"

cd ../..

# Set up TypeScript frontend
echo ""
echo "Setting up TypeScript frontend (apps/web-ui)..."
cd apps/web-ui
npm install --quiet
echo "  Installed Node.js dependencies"
cd ../..

# Set up pre-commit hooks
echo ""
echo "Setting up pre-commit hooks..."
if command -v pre-commit &> /dev/null; then
    pre-commit install
    echo "  Pre-commit hooks installed"
else
    echo "  WARNING: pre-commit not found. Install with: pip install pre-commit"
fi

# Create local environment file
if [ ! -f ".env" ]; then
    cat > .env << 'ENVEOF'
# Local development environment variables
DATABASE_URL=sqlite+aiosqlite:///./dev.db
CORS_ORIGINS=["http://localhost:5173"]
LOG_LEVEL=DEBUG
ENVEOF
    echo ""
    echo "Created .env file for local development"
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "To start development:"
echo "  Backend:  cd apps/agent-runtime && source .venv/bin/activate && uvicorn src.main:app --reload"
echo "  Frontend: cd apps/web-ui && npm run dev"
