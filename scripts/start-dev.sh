#!/bin/bash

echo "🚀 Starting HydroCred Development Environment"
echo "=============================================="

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "Please copy env.example to .env and configure your environment variables."
    exit 1
fi

# Check if backend dependencies are installed
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend
    npm install
    cd ..
fi

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

# Start backend server in background
echo "🔧 Starting backend server on port 5055..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Check if backend is running
if curl -s http://localhost:5055/api/health > /dev/null; then
    echo "✅ Backend server is running"
else
    echo "❌ Backend server failed to start"
    echo "Check the backend logs for errors"
    exit 1
fi

# Start frontend development server
echo "🌐 Starting frontend development server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "🎉 Development environment started!"
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:5055"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Stopping development servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on exit
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait