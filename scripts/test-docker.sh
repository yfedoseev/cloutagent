#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐳 Testing Docker setup for CloutAgent...${NC}"
echo ""

# Function to print status
print_status() {
    echo -e "${YELLOW}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Cleanup function
cleanup() {
    print_status "Cleaning up..."
    docker compose down -v 2>/dev/null || true
    print_success "Cleanup complete"
}

# Set trap to cleanup on exit
trap cleanup EXIT

# Check if Docker is running
print_status "Checking Docker status..."
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi
print_success "Docker is running"

# Check for .env file
print_status "Checking environment configuration..."
if [ ! -f .env ]; then
    print_error ".env file not found. Copying from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        print_success "Created .env from .env.example"
    else
        print_error "No .env.example found. Please create .env file with required variables."
        exit 1
    fi
else
    print_success "Environment configuration found"
fi

# Build images
print_status "Building Docker images..."
if docker compose build --no-cache 2>&1; then
    print_success "Images built successfully"
else
    print_error "Failed to build Docker images"
    exit 1
fi

# Start services
print_status "Starting services..."
if docker compose up -d; then
    print_success "Services started"
else
    print_error "Failed to start services"
    exit 1
fi

# Wait for services to be healthy
print_status "Waiting for services to be healthy..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if docker compose ps | grep -q "healthy"; then
        print_success "Services are healthy"
        break
    fi

    if [ $attempt -eq $((max_attempts - 1)) ]; then
        print_error "Services failed to become healthy"
        docker compose logs
        exit 1
    fi

    echo -n "."
    sleep 2
    attempt=$((attempt + 1))
done
echo ""

# Test backend health
print_status "Testing backend health endpoint..."
sleep 2
if curl -f -s http://localhost:3001/api/health > /dev/null; then
    print_success "Backend health check passed"
else
    print_error "Backend health check failed"
    docker compose logs backend
    exit 1
fi

# Test frontend
print_status "Testing frontend..."
if curl -f -s http://localhost:3000 > /dev/null; then
    print_success "Frontend is accessible"
else
    print_error "Frontend is not accessible"
    docker compose logs frontend
    exit 1
fi

# Test API proxy through frontend
print_status "Testing API proxy..."
if curl -f -s http://localhost:3000/api/health > /dev/null; then
    print_success "API proxy is working"
else
    print_error "API proxy failed"
    docker compose logs frontend
    exit 1
fi

# Test frontend health endpoint
print_status "Testing frontend health endpoint..."
if curl -f -s http://localhost:3000/health | grep -q "healthy"; then
    print_success "Frontend health endpoint working"
else
    print_error "Frontend health endpoint failed"
    exit 1
fi

# Check image sizes
print_status "Checking image sizes..."
echo ""
docker images | grep cloutagent || docker images | grep "frontend\|backend"
echo ""

# Check volumes
print_status "Checking volumes..."
docker volume ls | grep cloutagent || echo "No named volumes found (using bind mounts)"
echo ""

# Show running containers
print_status "Running containers:"
docker compose ps
echo ""

# Show logs summary
print_status "Recent logs (last 10 lines):"
echo ""
echo -e "${BLUE}=== Backend Logs ===${NC}"
docker compose logs --tail=10 backend
echo ""
echo -e "${BLUE}=== Frontend Logs ===${NC}"
docker compose logs --tail=10 frontend
echo ""

# Final summary
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ All Docker setup tests passed!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📊 Test Summary:${NC}"
echo -e "  ✓ Docker images built successfully"
echo -e "  ✓ Services started and healthy"
echo -e "  ✓ Backend API responding"
echo -e "  ✓ Frontend serving content"
echo -e "  ✓ API proxy working"
echo -e "  ✓ Health checks passing"
echo ""
echo -e "${BLUE}🔗 Access URLs:${NC}"
echo -e "  Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "  Backend:  ${GREEN}http://localhost:3001${NC}"
echo ""
echo -e "${YELLOW}Note: Services will be cleaned up automatically${NC}"
echo ""
