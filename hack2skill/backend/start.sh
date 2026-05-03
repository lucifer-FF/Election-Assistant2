#!/bin/bash

# Election Assistant - Backend Startup Script
# Production deployment ready

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "  ELECTION ASSISTANT - SECURE BACKEND INITIALIZATION"
echo "═══════════════════════════════════════════════════════════════"

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
  echo "❌ Node.js 16.x or higher required. Found: $(node -v)"
  exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if .env exists
if [ ! -f ".env" ]; then
  echo "⚠️  .env file not found. Creating from .env.example..."
  cp .env.example .env
  echo "📝 Please update .env with your configuration"
  exit 1
fi

echo "✅ .env file found"

# Install dependencies
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
else
  echo "✅ Dependencies already installed"
fi

# Create logs directory
mkdir -p logs

# Run migrations
echo "🔧 Running database migrations..."
npm run migrate || echo "⚠️  Migration failed - check MongoDB connection"

# Seed initial data (optional)
# npm run seed

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  🚀 STARTING SERVER..."
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Start server
npm start
