#!/bin/bash

# SkillBridge Deployment Script
# This script handles the complete deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}"
echo "🚀 SkillBridge Deployment Script"
echo "================================="
echo -e "${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

# Check if required tools are installed
check_tool() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ Error: $1 is not installed. Please install it first.${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ $1 is installed${NC}"
    fi
}

echo -e "${BLUE}🔍 Checking required tools...${NC}"
check_tool "node"
check_tool "npm"
check_tool "git"

# Optional tools
if command -v vercel &> /dev/null; then
    echo -e "${GREEN}✅ Vercel CLI is installed${NC}"
    VERCEL_AVAILABLE=true
else
    echo -e "${YELLOW}⚠️  Vercel CLI not installed (optional for frontend deployment)${NC}"
    VERCEL_AVAILABLE=false
fi

if command -v railway &> /dev/null; then
    echo -e "${GREEN}✅ Railway CLI is installed${NC}"
    RAILWAY_AVAILABLE=true
else
    echo -e "${YELLOW}⚠️  Railway CLI not installed (optional for backend deployment)${NC}"
    RAILWAY_AVAILABLE=false
fi

echo ""

# Run production readiness check
echo -e "${BLUE}🔍 Running production readiness check...${NC}"
if npm run production:check; then
    echo -e "${GREEN}✅ Production readiness check passed!${NC}"
else
    echo -e "${RED}❌ Production readiness check failed. Please fix issues before deploying.${NC}"
    exit 1
fi

echo ""

# Build everything
echo -e "${BLUE}🏗️  Building application for production...${NC}"
if npm run build:production; then
    echo -e "${GREEN}✅ Build completed successfully!${NC}"
else
    echo -e "${RED}❌ Build failed. Please fix build errors before deploying.${NC}"
    exit 1
fi

echo ""

# Show deployment options
echo -e "${PURPLE}🎯 Deployment Options:${NC}"
echo ""
echo "1. 🌐 Frontend Deployment (Vercel)"
echo "2. 🖥️  Backend Deployment (Railway)"
echo "3. 🐳 Docker Deployment"
echo "4. 📋 Manual Deployment (show instructions)"
echo "5. 🚀 Full Stack Deployment (Frontend + Backend)"
echo ""

read -p "Choose deployment option (1-5): " choice

case $choice in
    1)
        echo -e "${BLUE}🌐 Deploying Frontend to Vercel...${NC}"
        if [ "$VERCEL_AVAILABLE" = true ]; then
            echo "Deploying to Vercel..."
            vercel --prod
        else
            echo -e "${YELLOW}⚠️  Vercel CLI not available. Manual deployment instructions:${NC}"
            echo ""
            echo "1. Install Vercel CLI: npm i -g vercel"
            echo "2. Login to Vercel: vercel login"
            echo "3. Deploy: vercel --prod"
            echo ""
            echo "Or upload the 'build' folder to your hosting provider."
        fi
        ;;
    2)
        echo -e "${BLUE}🖥️  Deploying Backend to Railway...${NC}"
        if [ "$RAILWAY_AVAILABLE" = true ]; then
            echo "Deploying to Railway..."
            cd server
            railway up
            cd ..
        else
            echo -e "${YELLOW}⚠️  Railway CLI not available. Manual deployment instructions:${NC}"
            echo ""
            echo "1. Install Railway CLI: npm i -g @railway/cli"
            echo "2. Login to Railway: railway login"
            echo "3. Initialize project: railway init"
            echo "4. Deploy: railway up"
            echo ""
            echo "Or use the Railway web interface to deploy from GitHub."
        fi
        ;;
    3)
        echo -e "${BLUE}🐳 Building Docker image...${NC}"
        if command -v docker &> /dev/null; then
            echo "Building Docker image..."
            docker build -t skillbridge:latest .
            echo -e "${GREEN}✅ Docker image built successfully!${NC}"
            echo ""
            echo "To run the container:"
            echo "docker run -p 3001:3001 --env-file server/.env skillbridge:latest"
        else
            echo -e "${RED}❌ Docker not installed. Please install Docker first.${NC}"
        fi
        ;;
    4)
        echo -e "${BLUE}📋 Manual Deployment Instructions:${NC}"
        echo ""
        echo -e "${PURPLE}Frontend Deployment:${NC}"
        echo "1. Upload the 'build' folder to your static hosting provider"
        echo "2. Configure environment variables:"
        echo "   - REACT_APP_API_URL=https://your-api-domain.com"
        echo "   - REACT_APP_GITHUB_CLIENT_ID=your_github_client_id"
        echo "   - REACT_APP_ENVIRONMENT=production"
        echo ""
        echo -e "${PURPLE}Backend Deployment:${NC}"
        echo "1. Upload the 'server' folder to your Node.js hosting provider"
        echo "2. Upload the 'dist/mcp-servers' folder"
        echo "3. Set environment variables (see server/.env.example)"
        echo "4. Run database migrations: npx prisma migrate deploy"
        echo "5. Start the server: npm start"
        echo ""
        echo "See docs/PRODUCTION_DEPLOYMENT.md for detailed instructions."
        ;;
    5)
        echo -e "${BLUE}🚀 Full Stack Deployment...${NC}"
        echo ""
        echo "This will deploy both frontend and backend."
        echo ""
        
        # Frontend deployment
        echo -e "${BLUE}🌐 Step 1: Deploying Frontend...${NC}"
        if [ "$VERCEL_AVAILABLE" = true ]; then
            vercel --prod
        else
            echo -e "${YELLOW}⚠️  Please deploy frontend manually to Vercel or your preferred provider${NC}"
        fi
        
        echo ""
        
        # Backend deployment
        echo -e "${BLUE}🖥️  Step 2: Deploying Backend...${NC}"
        if [ "$RAILWAY_AVAILABLE" = true ]; then
            cd server
            railway up
            cd ..
        else
            echo -e "${YELLOW}⚠️  Please deploy backend manually to Railway or your preferred provider${NC}"
        fi
        ;;
    *)
        echo -e "${RED}❌ Invalid option. Please choose 1-5.${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 Deployment process completed!${NC}"
echo ""
echo -e "${PURPLE}📋 Post-Deployment Checklist:${NC}"
echo "1. ✅ Set up environment variables on your hosting platforms"
echo "2. ✅ Configure GitHub OAuth app with production URLs"
echo "3. ✅ Set up database and run migrations"
echo "4. ✅ Test the deployed application"
echo "5. ✅ Set up monitoring and error tracking"
echo ""
echo -e "${BLUE}📚 For detailed instructions, see: docs/PRODUCTION_DEPLOYMENT.md${NC}"
echo ""
echo -e "${GREEN}🚀 SkillBridge is ready to help developers advance their careers!${NC}"