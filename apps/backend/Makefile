# Backend Makefile - delegates to root Makefile
# This allows make commands to work from the backend directory

ROOT_DIR := $(shell cd ../.. && pwd)

.PHONY: help install lint test format format-check clean all check quick-check dev-flow test-fast

# Delegate all targets to the root Makefile
help:
	@$(MAKE) -C $(ROOT_DIR) help

install:
	@$(MAKE) -C $(ROOT_DIR) install

lint:
	@$(MAKE) -C $(ROOT_DIR) lint

test:
	@$(MAKE) -C $(ROOT_DIR) test

format:
	@$(MAKE) -C $(ROOT_DIR) format

format-check:
	@$(MAKE) -C $(ROOT_DIR) format-check

clean:
	@$(MAKE) -C $(ROOT_DIR) clean

all:
	@$(MAKE) -C $(ROOT_DIR) all

check:
	@$(MAKE) -C $(ROOT_DIR) check

quick-check:
	@$(MAKE) -C $(ROOT_DIR) quick-check

dev-flow:
	@$(MAKE) -C $(ROOT_DIR) dev-flow

test-fast:
	@$(MAKE) -C $(ROOT_DIR) test-fast
