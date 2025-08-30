#!/bin/bash

# HydroCred Development Environment Startup Script
# This script sets up the development environment with mock blockchain

echo "🚀 Starting HydroCred Development Environment..."

# Check if .env file exists, if not copy from development template
if [ ! -f .env ]; then
    echo "📝 Creating .env file from development template..."
    cp .env.development .env
    echo "✅ .env file created with mock blockchain enabled"
else
    echo "✅ .env file already exists"
fi

# Check if node_modules exist in each workspace
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing root dependencies..."
    npm install
fi

if [ ! -d "blockchain/node_modules" ]; then
    echo "Installing blockchain dependencies..."
    npm -w blockchain install
fi

if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    npm -w backend install
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm -w frontend install
fi

echo "✅ All dependencies installed"

# Start the development environment
echo "🌐 Starting development servers..."
echo "   Backend: http://localhost:5055"
echo "   Frontend: http://localhost:5173"
echo "   Mock Blockchain: Enabled"
echo ""
echo "💡 Use the mock wallet switcher (bottom-right) to test different roles"
echo "💡 Check MOCK_BLOCKCHAIN_GUIDE.md for detailed usage instructions"
echo ""

npm run dev