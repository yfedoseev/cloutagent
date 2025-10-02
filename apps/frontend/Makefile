# Frontend Makefile - Delegates to root Makefile
# This allows hooks to work when CWD is in the frontend directory

ROOT_DIR := $(shell cd ../.. && pwd)

.PHONY: help install lint lint-fix format format-check typecheck test test-fast check quick-check dev-flow all clean

help: ## Show available commands
	@$(MAKE) -C $(ROOT_DIR) help

install: ## Install all dependencies
	@$(MAKE) -C $(ROOT_DIR) install

lint: ## Run linting
	@$(MAKE) -C $(ROOT_DIR) lint

lint-fix: ## Run linting with auto-fix
	@$(MAKE) -C $(ROOT_DIR) lint-fix

format: ## Format code
	@$(MAKE) -C $(ROOT_DIR) format

format-check: ## Check code formatting
	@$(MAKE) -C $(ROOT_DIR) format-check

typecheck: ## Run type checking
	@$(MAKE) -C $(ROOT_DIR) typecheck

test: ## Run tests
	@$(MAKE) -C $(ROOT_DIR) test

test-fast: ## Run fast tests
	@$(MAKE) -C $(ROOT_DIR) test-fast

check: ## Run all quality checks
	@$(MAKE) -C $(ROOT_DIR) check

quick-check: ## Quick quality check
	@$(MAKE) -C $(ROOT_DIR) quick-check

dev-flow: ## Development flow
	@$(MAKE) -C $(ROOT_DIR) dev-flow

all: ## Run all tasks
	@$(MAKE) -C $(ROOT_DIR) all

clean: ## Clean build artifacts
	@$(MAKE) -C $(ROOT_DIR) clean

dev: ## Start development server
	@$(MAKE) -C $(ROOT_DIR) js-dev
