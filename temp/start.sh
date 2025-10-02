#!/bin/bash

echo "🚀 Starting Langflow..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Start containers
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check if containers are running
if docker-compose ps | grep -q "langflow"; then
    echo ""
    echo "✅ Langflow is running!"
    echo ""
    echo "🌐 Access Langflow at: http://localhost:7860"
    echo ""
    echo "📝 Useful commands:"
    echo "   - View logs: docker-compose logs -f"
    echo "   - Stop: ./stop.sh or docker-compose down"
    echo "   - Restart: docker-compose restart"
    echo ""
else
    echo ""
    echo "❌ Failed to start Langflow. Check logs with: docker-compose logs"
    exit 1
fi
