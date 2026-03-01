# Developer Onboarding

## Prerequisites

- Python 3.12+
- Node.js 22 LTS
- npm 10+
- Git with GPG signing configured
- Docker (for container builds)

## Quick Setup

```bash
# Clone the repository
git clone <repo-url>
cd agentic-ai-brick-breaker

# Run the setup script
./scripts/dev/setup-local.sh
```

## Development Workflow

### Backend (FastAPI)

```bash
cd apps/agent-runtime
source .venv/bin/activate
uvicorn src.main:app --reload --port 8000
```

API docs available at http://localhost:8000/docs

### Frontend (React + pixi.js)

```bash
cd apps/web-ui
npm run dev
```

Game available at http://localhost:5173

### Running Tests

```bash
# Per-file (fast — run frequently)
pytest apps/agent-runtime/tests/test_specific.py -x -v
npx vitest run apps/web-ui/tests/specific.test.ts

# Full suite (slow — only when needed)
make test
```

### Linting and Type Checking

```bash
# Per-file
ruff check apps/agent-runtime/src/path/to/file.py --fix
mypy --strict apps/agent-runtime/src/path/to/file.py
npx eslint apps/web-ui/src/path/to/file.ts --fix
npx tsc --noEmit

# Full project
make lint
make typecheck
```

## Key Files

| File | Purpose |
|------|---------|
| `AGENTS.md` | Authoritative development guide |
| `apps/agent-runtime/src/main.py` | Backend API entry point |
| `apps/web-ui/src/game/GameEngine.ts` | Game engine core |
| `apps/*/component-definition.yaml` | OSCAL compliance artifacts |
| `deploy/base/` | Kubernetes base manifests |

## Compliance

Read `AGENTS.md` fully before making changes. Key rules:

1. Update `component-definition.yaml` when changing security-relevant functionality
2. Use conventional commits with `OSCAL-CONTROL:` footer when applicable
3. All commits must be GPG signed
4. Run per-file lint + type check + test after every change
