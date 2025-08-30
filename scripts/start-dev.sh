#!/bin/bash

# HydroCred Development Startup Script
echo "🚀 Starting HydroCred Development Environment"
echo "============================================="

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit .env with your configuration before deploying contracts"
fi

# Function to start services
start_frontend() {
    echo "🎨 Starting Frontend (React + Vite)..."
    cd frontend && npm run dev &
    FRONTEND_PID=$!
    echo "Frontend PID: $FRONTEND_PID"
    cd ..
}

start_backend() {
    echo "🔧 Starting Backend (Express API)..."
    cd backend && npm run dev &
    BACKEND_PID=$!
    echo "Backend PID: $BACKEND_PID"
    cd ..
}

# Install dependencies if needed
for dir in frontend backend blockchain; do
    if [ -d "$dir" ] && [ ! -d "$dir/node_modules" ]; then
        echo "📦 Installing $dir dependencies..."
        cd $dir && npm install && cd ..
    fi
done

# Start services
start_backend
sleep 2
start_frontend

echo ""
echo "🎉 Development environment started!"
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:5055"
echo ""
echo "⚠️  Note: Contract deployment required for full functionality"
echo "📚 See DEPLOYMENT_GUIDE.md for setup instructions"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap 'echo "🛑 Stopping services..."; kill $FRONTEND_PID $BACKEND_PID 2>/dev/null; exit' INT
wait