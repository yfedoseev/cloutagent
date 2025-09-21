# Multi-stage Dockerfile for Python/Node.js projects
# Uncomment the relevant sections based on your project type

# =============================================================================
# Python Base (uncomment for Python projects)
# =============================================================================
# FROM python:3.11-slim as python-base
#
# ENV PYTHONUNBUFFERED=1 \
#     PYTHONDONTWRITEBYTECODE=1 \
#     PIP_NO_CACHE_DIR=1 \
#     PIP_DISABLE_PIP_VERSION_CHECK=1
#
# WORKDIR /app
#
# # Install uv for faster dependency management
# RUN pip install uv
#
# # Copy dependency files
# COPY pyproject.toml uv.lock* ./
#
# # Install dependencies
# RUN uv sync --frozen
#
# # Copy source code
# COPY . .
#
# EXPOSE 8000
# CMD ["uv", "run", "python", "main.py"]

# =============================================================================
# Node.js Base (uncomment for Node.js projects)
# =============================================================================
FROM node:18-alpine as node-base

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the application (if needed)
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]

# =============================================================================
# Development Stage (for local development)
# =============================================================================
FROM node-base as development

# Install all dependencies (including dev)
RUN npm ci

# Install development tools
RUN npm install -g nodemon

CMD ["npm", "run", "dev"]