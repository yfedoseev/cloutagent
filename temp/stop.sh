#!/bin/bash

echo "🛑 Stopping Langflow..."
echo ""

# Stop containers
docker-compose down

echo ""
echo "✅ Langflow stopped successfully!"
echo ""
echo "📝 Note: Data is preserved in Docker volumes."
echo "   To remove all data, run: docker-compose down -v"
echo ""
