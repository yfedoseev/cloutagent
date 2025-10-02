# Claude Code Project Makefile
.PHONY: help install lint test format format-check clean all
.DEFAULT_GOAL := help

# Colors for output
RESET := \033[0m
BOLD := \033[1m
GREEN := \033[32m
YELLOW := \033[33m
BLUE := \033[34m

help: ## Show this help message
	@echo "$(BOLD)Available targets:$(RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(RESET) %s\n", $$1, $$2}'

install: ## Install all dependencies
	@echo "$(BLUE)Installing JavaScript dependencies...$(RESET)"
	npm install
	@echo "$(BLUE)Installing Python dependencies with uv...$(RESET)"
	uv sync --dev
	@echo "$(GREEN)✓ All dependencies installed$(RESET)"

# Python targets
py-lint: ## Run Python linting with ruff
	@echo "$(BLUE)Running Python linting...$(RESET)"
	@if find . -name "*.py" -not -path "./tests/*" -not -path "./.venv/*" -not -path "./node_modules/*" | grep -q .; then \
		uv run ruff check .; \
	else \
		echo "$(YELLOW)No Python source files found, skipping Python linting$(RESET)"; \
	fi

py-lint-fix: ## Run Python linting with auto-fix
	@echo "$(BLUE)Running Python linting with auto-fix...$(RESET)"
	uv run ruff check . --fix

py-format: ## Format Python code with black
	@echo "$(BLUE)Formatting Python code...$(RESET)"
	@if find . -name "*.py" -not -path "./.venv/*" -not -path "./node_modules/*" | grep -q .; then \
		uv run black .; \
	else \
		echo "$(YELLOW)No Python files found, skipping Python formatting$(RESET)"; \
	fi

py-format-check: ## Check Python code formatting
	@echo "$(BLUE)Checking Python code formatting...$(RESET)"
	@if find . -name "*.py" -not -path "./.venv/*" -not -path "./node_modules/*" | grep -q .; then \
		uv run black --check .; \
	else \
		echo "$(YELLOW)No Python files found, skipping Python format check$(RESET)"; \
	fi

py-typecheck: ## Run Python type checking with mypy
	@echo "$(BLUE)Running Python type checking...$(RESET)"
	@if find . -name "*.py" -not -path "./tests/*" -not -path "./.venv/*" -not -path "./node_modules/*" | grep -q .; then \
		uv run mypy .; \
	else \
		echo "$(YELLOW)No Python source files found, skipping Python type checking$(RESET)"; \
	fi

py-test: ## Run Python tests
	@echo "$(BLUE)Running Python tests...$(RESET)"
	@if find ./tests -name "*.py" 2>/dev/null | grep -q .; then \
		uv run pytest; \
	else \
		echo "$(YELLOW)No Python test files found, skipping Python tests$(RESET)"; \
	fi

py-test-fast: ## Run Python tests with minimal output
	@uv run pytest -q --tb=short

# JavaScript/TypeScript targets
js-lint: ## Run JavaScript/TypeScript linting
	@echo "$(BLUE)Running JavaScript/TypeScript linting...$(RESET)"
	@if [ -f "package.json" ] && [ -d "node_modules" ]; then \
		npm run lint; \
	else \
		echo "$(YELLOW)No Node.js project or dependencies not installed, skipping JS linting$(RESET)"; \
	fi

js-lint-fix: ## Run JavaScript/TypeScript linting with auto-fix
	@echo "$(BLUE)Running JavaScript/TypeScript linting with auto-fix...$(RESET)"
	npm run lint:fix

js-format: ## Format JavaScript/TypeScript code
	@echo "$(BLUE)Formatting JavaScript/TypeScript code...$(RESET)"
	npm run format

js-typecheck: ## Run TypeScript type checking
	@echo "$(BLUE)Running TypeScript type checking...$(RESET)"
	npm run typecheck

js-test: ## Run JavaScript/TypeScript tests
	@echo "$(BLUE)Running JavaScript/TypeScript tests...$(RESET)"
	@if [ -f "package.json" ] && [ -d "node_modules" ]; then \
		pnpm test; \
	else \
		echo "$(YELLOW)No Node.js project or dependencies not installed, skipping JS tests$(RESET)"; \
	fi

js-test-fast: ## Run JavaScript/TypeScript tests with minimal output
	@if [ -f "package.json" ] && [ -d "node_modules" ]; then \
		pnpm test:integration 2>&1 | tail -15; \
	else \
		echo "$(YELLOW)No Node.js project or dependencies not installed, skipping JS tests$(RESET)"; \
	fi

js-test-integration: ## Run integration tests only
	@echo "$(BLUE)Running integration tests...$(RESET)"
	@pnpm test:integration

js-build: ## Build the project
	@echo "$(BLUE)Building the project...$(RESET)"
	npm run build

js-dev: ## Start development server
	@echo "$(BLUE)Starting development server...$(RESET)"
	npm run dev

# Documentation formatting
format-json: ## Format JSON files
	@echo "$(BLUE)Formatting JSON files...$(RESET)"
	@find . -name "*.json" -not -path "./node_modules/*" -not -path "./.git/*" | xargs -I {} sh -c 'echo "Formatting {}" && npx prettier --write "{}"'

format-md: ## Format Markdown files
	@echo "$(BLUE)Formatting Markdown files...$(RESET)"
	@find . -name "*.md" -not -path "./node_modules/*" -not -path "./.git/*" | xargs -I {} sh -c 'echo "Formatting {}" && npx prettier --write "{}"'

# Combined targets
lint: py-lint js-lint ## Run all linting
	@echo "$(GREEN)✓ All linting completed$(RESET)"

lint-fix: py-lint-fix js-lint-fix ## Run all linting with auto-fix
	@echo "$(GREEN)✓ All linting with auto-fix completed$(RESET)"

format: py-format js-format format-json format-md ## Format all code and documentation
	@echo "$(GREEN)✓ All formatting completed$(RESET)"

format-check: py-format-check ## Check all code formatting
	@echo "$(BLUE)Checking JavaScript/TypeScript formatting...$(RESET)"
	@npx prettier --check .
	@echo "$(GREEN)✓ All format checking completed$(RESET)"

typecheck: py-typecheck js-typecheck ## Run all type checking
	@echo "$(GREEN)✓ All type checking completed$(RESET)"

test: py-test js-test ## Run all tests
	@echo "$(GREEN)✓ All tests completed$(RESET)"

# CI/Quality targets
check: lint typecheck test ## Run all quality checks (lint, typecheck, test)
	@echo "$(GREEN)✓ All quality checks completed$(RESET)"

test-fast: py-test-fast js-test-fast ## Run all tests with minimal output (fast)

quick-check: lint test-fast ## Quick quality check (lint + fast tests, skip typecheck)
	@echo "$(GREEN)✓ Quick quality checks completed$(RESET)"

ci: install check ## Full CI pipeline (install + check)
	@echo "$(GREEN)✓ CI pipeline completed$(RESET)"

dev-flow: format lint test ## Development flow (format, lint, test)
	@echo "$(GREEN)✓ Development flow completed$(RESET)"

all: format lint typecheck test ## Format, lint, typecheck, and test everything
	@echo "$(GREEN)✓ All tasks completed$(RESET)"

clean: ## Clean build artifacts and dependencies
	@echo "$(BLUE)Cleaning build artifacts...$(RESET)"
	rm -rf node_modules
	rm -rf dist
	rm -rf build
	rm -rf .venv
	rm -rf __pycache__
	rm -rf .pytest_cache
	rm -rf .mypy_cache
	rm -rf .ruff_cache
	@echo "$(GREEN)✓ Cleanup completed$(RESET)"