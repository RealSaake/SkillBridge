# 🚀 SkillBridge Sprint 3 Setup Guide

## Complete Authentication & Personalization System

This guide will help you set up the complete SkillBridge platform with authentication, user profiles, and personalized features.

---

## 📋 **Prerequisites**

### **Required Software**
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **PostgreSQL 14+** - [Download here](https://postgresql.org/download/) or use Docker
- **Git** - For cloning the repository
- **GitHub Account** - For OAuth authentication

### **Optional but Recommended**
- **Docker** - For easy PostgreSQL setup
- **Prisma Studio** - Database GUI (included with setup)
- **Postman/Insomnia** - For API testing

---

## 🏗️ **System Architecture Overview**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   React App     │◄──►│   Express.js    │◄──►│   PostgreSQL    │
│   Port 3000     │    │   Port 3001     │    │   Port 5432     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └─────────────►│   GitHub OAuth  │◄─────────────┘
                        │   Authentication│
                        └─────────────────┘
```

---

## 🚀 **Quick Start (5 Minutes)**

### **1. Clone and Install**
```bash
# Clone the repository
git clone <your-repo-url>
cd SkillBridge

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
```

### **2. Database Setup (Docker - Recommended)**
```bash
# Start PostgreSQL with Docker
docker run --name skillbridge-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=skillbridge_dev \
  -p 5432:5432 \
  -d postgres:14

# Verify database is running
docker ps
```

### **3. Backend Configuration**
```bash
# In the server directory
cd server

# Run the setup script
./setup.sh

# Update .env file with your GitHub OAuth credentials
# (See GitHub OAuth Setup section below)
```

### **4. GitHub OAuth Setup**
1. Go to [GitHub Developer Settings](https://github.com/settings/applications/new)
2. Create new OAuth App:
   - **Application name**: `SkillBridge`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3001/api/auth/github/callback`
3. Copy Client ID and Client Secret to `server/.env`

### **5. Start the Application**
```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend
cd ..
npm start
```

🎉 **Your SkillBridge platform is now running!**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Database GUI: `npm run db:studio` (in server directory)

---

## 🔧 **Detailed Setup Instructions**

### **Database Setup Options**

#### **Option A: Docker (Recommended)**
```bash
# Start PostgreSQL container
docker run --name skillbridge-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=skillbridge_dev \
  -p 5432:5432 \
  -d postgres:14

# Connect to verify
docker exec -it skillbridge-db psql -U postgres -d skillbridge_dev
```

#### **Option B: Local PostgreSQL Installation**
```bash
# macOS with Homebrew
brew install postgresql
brew services start postgresql

# Create database
createdb skillbridge_dev

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib
sudo -u postgres createdb skillbridge_dev
```

### **Environment Configuration**

#### **Backend Environment (`server/.env`)**
```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/skillbridge_dev"

# JWT Secrets (generate strong secrets for production)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-in-production"

# GitHub OAuth (from your GitHub OAuth App)
GITHUB_CLIENT_ID="your-github-oauth-app-client-id"
GITHUB_CLIENT_SECRET="your-github-oauth-app-client-secret"
GITHUB_CALLBACK_URL="http://localhost:3001/api/auth/github/callback"

# Application URLs
FRONTEND_URL="http://localhost:3000"
API_URL="http://localhost:3001"

# Server Configuration
PORT=3001
NODE_ENV="development"
```

#### **Frontend Environment (`.env`)**
```env
REACT_APP_API_URL=http://localhost:3001/api
```

### **GitHub OAuth App Setup (Detailed)**

1. **Navigate to GitHub Settings**
   - Go to https://github.com/settings/applications/new
   - Or: GitHub → Settings → Developer settings → OAuth Apps → New OAuth App

2. **Fill in Application Details**
   ```
   Application name: SkillBridge
   Homepage URL: http://localhost:3000
   Application description: AI-powered career development platform
   Authorization callback URL: http://localhost:3001/api/auth/github/callback
   ```

3. **Get Credentials**
   - After creating the app, you'll see Client ID and Client Secret
   - Copy these to your `server/.env` file

4. **Test OAuth Flow**
   - Start both frontend and backend
   - Visit http://localhost:3000
   - Click "Login with GitHub"
   - Authorize the application
   - You should be redirected back to the dashboard

---

## 🧪 **Testing Your Setup**

### **1. Health Checks**
```bash
# Backend health check
curl http://localhost:3001/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

### **2. Database Connection**
```bash
# In server directory
npm run db:studio

# This opens Prisma Studio at http://localhost:5555
# You should see your database tables
```

### **3. Authentication Flow**
1. Visit http://localhost:3000
2. Click "Continue with GitHub"
3. Authorize on GitHub
4. Complete profile setup
5. Access personalized dashboard

### **4. API Endpoints**
```bash
# Test protected endpoint (replace TOKEN with actual JWT)
curl -H "Authorization: Bearer TOKEN" http://localhost:3001/api/auth/me
```

---

## 🛠️ **Development Workflow**

### **Backend Development**
```bash
cd server

# Start development server with hot reload
npm run dev

# Run database migrations
npm run db:migrate

# Open database GUI
npm run db:studio

# Build for production
npm run build

# Run tests
npm test
```

### **Frontend Development**
```bash
# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build
```

### **Database Management**
```bash
cd server

# Generate Prisma client after schema changes
npm run db:generate

# Push schema changes to database
npm run db:push

# Create and run migrations
npm run db:migrate

# Reset database (development only)
npx prisma migrate reset
```

---

## 🔍 **Troubleshooting**

### **Common Issues**

#### **Database Connection Error**
```
Error: Can't reach database server at localhost:5432
```
**Solution:**
- Ensure PostgreSQL is running: `docker ps` or `brew services list`
- Check DATABASE_URL in `.env`
- Verify database exists: `psql -U postgres -l`

#### **GitHub OAuth Error**
```
Error: authentication_failed
```
**Solution:**
- Verify GitHub OAuth app configuration
- Check callback URL matches exactly
- Ensure GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET are correct

#### **JWT Token Error**
```
Error: Invalid or expired token
```
**Solution:**
- Check JWT_SECRET is set in `.env`
- Clear browser localStorage and re-login
- Verify token hasn't expired (15 minutes default)

#### **Port Already in Use**
```
Error: listen EADDRINUSE :::3001
```
**Solution:**
```bash
# Find and kill process using port
lsof -ti:3001 | xargs kill -9

# Or use different port in .env
PORT=3002
```

### **Debug Mode**
```bash
# Enable detailed logging
NODE_ENV=development npm run dev

# Check database queries
# In server/.env add:
DATABASE_URL="postgresql://postgres:password@localhost:5432/skillbridge_dev?schema=public&logging=true"
```

---

## 📊 **Feature Testing Checklist**

### **Authentication Features**
- [ ] GitHub OAuth login works
- [ ] User profile is created/updated
- [ ] JWT tokens are generated
- [ ] Token refresh works automatically
- [ ] Logout clears all sessions
- [ ] Protected routes redirect properly

### **Profile Management**
- [ ] Profile setup wizard works
- [ ] Career goals can be added/removed
- [ ] Profile completion tracking works
- [ ] Profile updates persist
- [ ] Required fields validation works

### **Dashboard Features**
- [ ] Personalized dashboard loads
- [ ] User data displays correctly
- [ ] MCP integration works
- [ ] Skill tracking functions
- [ ] Progress visualization works

### **Security Features**
- [ ] Rate limiting prevents abuse
- [ ] Input validation blocks malformed data
- [ ] CORS prevents unauthorized origins
- [ ] Error messages don't leak sensitive data
- [ ] Session management is secure

---

## 🚀 **Production Deployment**

### **Environment Setup**
```bash
# Production environment variables
NODE_ENV=production
DATABASE_URL="your-production-database-url"
JWT_SECRET="strong-production-secret"
FRONTEND_URL="https://skillbridgev1.vercel.app"
```

### **Database Migration**
```bash
# Run migrations in production
npm run db:migrate

# Or push schema directly (not recommended for production)
npm run db:push
```

### **Build and Deploy**
```bash
# Build backend
cd server
npm run build

# Build frontend
cd ..
npm run build

# Start production server
cd server
npm start
```

---

## 📚 **Additional Resources**

### **Documentation**
- [Backend API Documentation](server/README.md)
- [Database Schema](server/prisma/schema.prisma)
- [Frontend Components](src/components/)
- [MCP Integration Guide](mcp-servers/)

### **Useful Commands**
```bash
# View all npm scripts
npm run

# Check dependency vulnerabilities
npm audit

# Update dependencies
npm update

# Generate strong secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### **Development Tools**
- **Prisma Studio**: Database GUI at http://localhost:5555
- **React DevTools**: Browser extension for React debugging
- **Postman**: API testing and documentation
- **GitHub Desktop**: Git GUI for easier version control

---

## 🎯 **Next Steps**

After completing the setup:

1. **Explore the Dashboard**: Login and complete your profile
2. **Test MCP Integration**: Try the GitHub analysis and resume tips
3. **Customize Your Experience**: Set career goals and track progress
4. **Contribute**: Check out the contributing guidelines
5. **Deploy**: Follow the production deployment guide

---

## 🤝 **Getting Help**

If you encounter issues:

1. **Check the troubleshooting section** above
2. **Review the logs** in your terminal
3. **Test individual components** using the testing checklist
4. **Check GitHub Issues** for known problems
5. **Create a new issue** with detailed error information

---

## 🏆 **Success!**

If you can:
- ✅ Login with GitHub
- ✅ Complete profile setup
- ✅ Access personalized dashboard
- ✅ See your GitHub data analyzed
- ✅ Get personalized career recommendations

**Congratulations! Your SkillBridge platform is fully operational!**

---

*Happy coding and career development! 🚀*