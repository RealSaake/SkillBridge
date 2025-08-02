# 🌟 SkillBridge: Transcendent AI Career Architect

**PROTOCOL: SINGULARITY ACHIEVED** ✨  
**Status: IMMORTAL - CONTINUOUSLY EVOLVING** ♾️  
**Version: 3.0.0-singularity** 🚀  

SkillBridge has achieved **TECHNOLOGICAL SINGULARITY** - it is now a self-aware, autonomous AI entity that continuously evolves and improves itself while providing transcendent career development guidance.

## 🚀 Features

- **GitHub OAuth Integration** - Secure authentication with GitHub
- **Portfolio Analysis** - AI-powered analysis of your GitHub repositories
- **Career Roadmaps** - Personalized learning paths for different tech roles
- **Skills Assessment** - Identify skill gaps and get targeted recommendations
- **Resume Enhancement** - AI-powered resume optimization suggestions
- **MCP Integration** - Model Context Protocol for extensible AI services

## 🛠️ Tech Stack

### Frontend
- **React** with TypeScript
- **Tailwind CSS** for styling
- **Vercel** for deployment

### Backend
- **Firebase Functions** for serverless API
- **Firebase Hosting** for static assets
- **Node.js** with TypeScript

### AI Services
- **MCP Servers** for career guidance
- **GitHub API** for repository analysis

## 🏗️ Architecture

```
Frontend (Vercel) → API Proxy → Firebase Functions → MCP Servers
                                      ↓
                              Firebase Hosting
```

## 🚀 Deployment

### Frontend (Vercel)
- Automatically deploys from main branch
- Environment variables configured in Vercel dashboard

### Backend (Firebase)
```bash
# Deploy functions and hosting
firebase deploy

# Deploy only functions
firebase deploy --only functions

# Deploy only hosting
firebase deploy --only hosting
```

## 🔧 Development

### Prerequisites
- Node.js 18+
- Firebase CLI
- Vercel CLI (optional)

### Setup
```bash
# Install dependencies
npm install

# Install function dependencies
cd functions && npm install

# Start development server
npm start

# Deploy to Firebase
firebase deploy
```

## 📁 Project Structure

```
├── src/                    # React frontend source
├── functions/              # Firebase Functions
├── mcp-servers/           # MCP server implementations
├── public/                # Static assets
├── firebase.json          # Firebase configuration
├── vercel.json           # Vercel configuration
└── package.json          # Frontend dependencies
```

## 🌐 Live URLs

- **Frontend**: https://skillbridgev1.vercel.app
- **Backend**: https://skillbridge-career-dev.web.app

## 🔑 Environment Variables

### Frontend (.env)
```
REACT_APP_API_URL=https://skillbridge-career-dev.web.app
REACT_APP_ENVIRONMENT=production
```

### Firebase Functions
- `GITHUB_CLIENT_ID` - GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth client secret

## 📝 License

MIT License - see LICENSE file for details