#!/bin/bash

# SysRegister Self-Hosting Quick Start Script
# This script helps you quickly set up and deploy SysRegister

set -e

echo "🚀 SysRegister Self-Hosting Setup"
echo "=================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first:"
    echo "   https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    
    # Generate a random JWT secret
    JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
    
    # Update the JWT_SECRET in .env
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/JWT_SECRET=\"KEY\"/JWT_SECRET=\"$JWT_SECRET\"/" .env
    else
        # Linux
        sed -i "s/JWT_SECRET=\"KEY\"/JWT_SECRET=\"$JWT_SECRET\"/" .env
    fi
    
    echo "✅ .env file created with a random JWT_SECRET"
    echo ""
    echo "⚠️  IMPORTANT: Review and update the .env file if needed!"
    echo ""
else
    echo "ℹ️  .env file already exists, skipping creation"
    echo ""
fi

# Create data directories
echo "📁 Creating data directories..."
mkdir -p data userassets/banners userassets/avatars
echo "✅ Data directories created"
echo ""

# Build and start the containers
echo "🔨 Building and starting Docker containers..."
echo "   This may take a few minutes on first run..."
echo ""

if command -v docker-compose &> /dev/null; then
    docker-compose up -d --build
else
    docker compose up -d --build
fi

echo ""
echo "✅ SysRegister is now running!"
echo ""
echo "📱 Access your instance at: http://localhost:3000"
echo ""
echo "📊 Useful commands:"
echo "   View logs:    docker-compose logs -f"
echo "   Stop:         docker-compose down"
echo "   Restart:      docker-compose restart"
echo ""
echo "🎉 Happy self-hosting!"
