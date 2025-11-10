#!/bin/bash

# Star Corporate Production Deployment Script

echo "🚀 Starting Star Corporate deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if required tools are installed
echo "🔍 Checking prerequisites..."

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is required but not installed${NC}"
    exit 1
fi

# Check for npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is required but not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Environment setup
echo "🔧 Setting up environment..."
read -p "Enter deployment environment (development/production): " ENV
ENV=${ENV:-development}

if [ "$ENV" = "production" ]; then
    echo "⚠️  Deploying to PRODUCTION environment"
    read -p "Are you sure? (y/N): " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        echo "Deployment cancelled"
        exit 0
    fi
fi

# Backend deployment
echo "🖥️  Deploying backend..."
cd backend

# Install dependencies
echo "📦 Installing backend dependencies..."
npm install --production

# Run tests
echo "🧪 Running tests..."
npm test

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Tests failed. Deployment aborted.${NC}"
    exit 1
fi

# Database migration
echo "🗃️  Running database migrations..."
npm run db:setup

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Database setup failed. Deployment aborted.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backend deployment ready${NC}"

# Frontend deployment
echo "📱 Preparing frontend..."
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Build frontend
echo "🏗️  Building frontend..."
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend build failed. Deployment aborted.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend build completed${NC}"

# Deployment summary
echo ""
echo "🎉 Deployment preparation completed!"
echo "==============================================="
echo "Backend: Ready for server deployment"
echo "Frontend: Built and ready for hosting"
echo "Database: Schema migrated successfully"
echo ""
echo "📋 Next Steps:"
echo "1. Deploy backend to your hosting provider"
echo "2. Deploy frontend to web hosting"
echo "3. Update DNS settings"
echo "4. Test production environment"
echo ""
echo -e "${GREEN}🚀 Star Corporate is ready for production!${NC}"