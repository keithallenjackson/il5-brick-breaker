.PHONY: help test-python test-typescript test-functional test-contract test-smoke-local test test-all lint format-python validate-oscal generate-ssp generate-sbom compliance-all compliance-check build emass-sync

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# =============================================================================
# Testing
# =============================================================================

test-python: ## Run Python unit tests
	cd apps/agent-runtime && python -m pytest tests/ -v --cov=src --cov-report=term-missing --cov-fail-under=80

test-typescript: ## Run TypeScript unit tests
	cd apps/web-ui && npx vitest run --coverage

test-functional: ## Run functional tests (full service, stubbed deps)
	cd apps/agent-runtime && python -m pytest ../../tests/integration/ -v --tb=short -o asyncio_mode=auto

test-contract: ## Run contract tests (API schema compatibility)
	cd apps/agent-runtime && python -m pytest ../../tests/contract/ -v --tb=short -o asyncio_mode=auto

test-smoke-local: ## Run smoke tests against local stack (requires docker compose up)
	./tests/smoke/smoke-test.sh http://localhost:8000

test: test-python test-typescript test-functional ## Run all gating tests

test-all: test test-smoke-local ## Run all tests including smoke (requires local stack)

# =============================================================================
# Linting & Type Checking
# =============================================================================

lint-python: ## Lint all Python code
	ruff check apps/agent-runtime/src/ apps/agent-runtime/tests/ tests/integration/ tests/contract/ --fix
	ruff format apps/agent-runtime/src/ apps/agent-runtime/tests/ tests/integration/ tests/contract/ --check

format-python: ## Format all Python code
	ruff format apps/agent-runtime/src/ apps/agent-runtime/tests/ tests/integration/ tests/contract/

lint-typescript: ## Lint all TypeScript code
	cd apps/web-ui && npx eslint src/

typecheck-python: ## Type check Python code
	cd apps/agent-runtime && mypy --strict src/

typecheck-typescript: ## Type check TypeScript code
	cd apps/web-ui && npx tsc --noEmit

lint: lint-python lint-typescript ## Full lint pass

typecheck: typecheck-python typecheck-typescript ## Full type check

# =============================================================================
# Compliance
# =============================================================================

validate-oscal: ## Validate all OSCAL documents
	./scripts/compliance/validate-oscal.sh

generate-ssp: ## Generate SSP from all component definitions
	./scripts/compliance/generate-ssp.sh

generate-poam: ## Generate POA&M from scan results
	./scripts/compliance/generate-poam.sh

compliance-check: ## Validate OSCAL + check C2P mappings
	$(MAKE) validate-oscal
	@echo "Checking C2P mappings..."

compliance-all: validate-oscal generate-ssp generate-poam ## Full compliance pipeline
	./scripts/compliance/stig-check.sh

emass-sync: ## Push OSCAL artifacts to eMASS (REQUIRES PERMISSION)
	@echo "WARNING: This writes to a live government system."
	@echo "Press Ctrl+C to cancel or Enter to continue..."
	@read _confirm
	python scripts/compliance/sync-emass.py

# =============================================================================
# Security
# =============================================================================

scan-secrets: ## Scan for secrets in codebase
	./scripts/security/scan-secrets.sh

generate-sbom: ## Generate SBOM for all applications
	./scripts/security/generate-sbom.sh

sign-artifacts: ## Sign container images with Cosign
	./scripts/security/sign-artifact.sh

# =============================================================================
# Build
# =============================================================================

build-api: ## Build agent-runtime container
	docker build -t brick-breaker-api:latest apps/agent-runtime/

build-ui: ## Build web-ui container
	docker build -t brick-breaker-ui:latest apps/web-ui/

build: build-api build-ui ## Build all containers

# =============================================================================
# Development
# =============================================================================

setup: ## Set up local development environment
	./scripts/dev/setup-local.sh

dev-api: ## Start backend API in development mode
	cd apps/agent-runtime && uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

dev-ui: ## Start frontend in development mode
	cd apps/web-ui && npm run dev
