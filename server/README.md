# SkillBridge API Server

The backend API server for SkillBridge, providing authentication, user management, and personalized career development features.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- GitHub OAuth App (for authentication)

### Setup

1. **Run the setup script:**
   ```bash
   ./setup.sh
   ```

2. **Configure environment variables:**
   Update `.env` with your actual values:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/skillbridge_dev"
   JWT_SECRET="your-super-secret-jwt-key"
   JWT_REFRESH_SECRET="your-super-secret-refresh-key"
   GITHUB_CLIENT_ID="your-github-oauth-client-id"
   GITHUB_CLIENT_SECRET="your-github-oauth-client-secret"
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3001`

## 🏗️ Architecture

### Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT + GitHub OAuth
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Zod schemas

### Project Structure

```
server/
├── src/
│   ├── config/          # Configuration files
│   │   └── passport.ts  # Passport.js strategies
│   ├── lib/             # Shared libraries
│   │   └── prisma.ts    # Prisma client setup
│   ├── middleware/      # Express middleware
│   │   ├── auth.ts      # Authentication middleware
│   │   └── errorHandler.ts # Error handling
│   ├── routes/          # API route handlers
│   │   ├── auth.ts      # Authentication routes
│   │   ├── users.ts     # User management
│   │   ├── profiles.ts  # User profiles
│   │   ├── skills.ts    # Skill management
│   │   └── dashboard.ts # Dashboard configuration
│   └── index.ts         # Main server file
├── prisma/
│   └── schema.prisma    # Database schema
├── .env.example         # Environment template
└── package.json         # Dependencies and scripts
```

## 🔐 Authentication Flow

### GitHub OAuth

1. User clicks "Login with GitHub" on frontend
2. Frontend redirects to `/api/auth/github`
3. User authorizes on GitHub
4. GitHub redirects to `/api/auth/github/callback`
5. Server creates/updates user and generates JWT tokens
6. Frontend receives tokens and stores them

### JWT Token Management

- **Access Token**: Short-lived (15 minutes), used for API requests
- **Refresh Token**: Long-lived (7 days), used to get new access tokens
- **Automatic Refresh**: Frontend automatically refreshes tokens before expiration

## 📊 Database Schema

### Core Tables

- **users**: Basic user information from GitHub
- **user_profiles**: Extended profile data (career goals, experience)
- **user_skills**: Skill tracking with proficiency levels
- **user_sessions**: Refresh token management
- **learning_progress**: Progress tracking for learning activities
- **dashboard_widgets**: Customizable dashboard configuration

### Key Relationships

- User → Profile (1:1)
- User → Skills (1:many)
- User → Sessions (1:many)
- User → Progress (1:many)

## 🛠️ API Endpoints

### Authentication
- `GET /api/auth/github` - Initiate GitHub OAuth
- `GET /api/auth/github/callback` - OAuth callback
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### User Management
- `GET /api/users/profile` - Get user profile
- `PATCH /api/users/profile` - Update user info
- `DELETE /api/users/account` - Delete account

### Profile Management
- `GET /api/profiles` - Get user profile
- `PATCH /api/profiles` - Update profile
- `GET /api/profiles/completion` - Profile completion status

### Skill Management
- `GET /api/skills` - Get user skills
- `POST /api/skills` - Add new skill
- `PATCH /api/skills/:id` - Update skill
- `DELETE /api/skills/:id` - Delete skill
- `POST /api/skills/bulk` - Bulk update skills
- `GET /api/skills/stats` - Skill statistics

### Dashboard
- `GET /api/dashboard/widgets` - Get dashboard configuration
- `PATCH /api/dashboard/widgets/:id` - Update widget
- `PATCH /api/dashboard/widgets/bulk` - Bulk update widgets
- `GET /api/dashboard/summary` - Dashboard summary data

## 🔒 Security Features

### Authentication & Authorization
- JWT-based authentication with refresh tokens
- GitHub OAuth integration
- Session management with automatic cleanup
- Protected routes with middleware

### Security Middleware
- **Helmet**: Security headers
- **CORS**: Cross-origin request handling
- **Rate Limiting**: Request throttling
- **Input Validation**: Zod schema validation
- **Error Handling**: Structured error responses

### Data Protection
- Password-less authentication (GitHub OAuth only)
- Secure token storage and rotation
- User data isolation
- Cascade deletion for data cleanup

## 🧪 Development

### Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm run start        # Start production server
npm test             # Run tests
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes to database
npm run db:migrate   # Create and run migrations
npm run db:studio    # Open Prisma Studio (database GUI)
```

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `JWT_SECRET` | Secret for access tokens | `your-secret-key` |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | `your-refresh-secret` |
| `GITHUB_CLIENT_ID` | GitHub OAuth app client ID | `abc123` |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app secret | `secret123` |
| `FRONTEND_URL` | Frontend application URL | `http://localhost:3000` |
| `PORT` | Server port | `3001` |

### Database Setup

1. **Install PostgreSQL** (or use Docker):
   ```bash
   docker run --name skillbridge-db -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres
   ```

2. **Create database**:
   ```sql
   CREATE DATABASE skillbridge_dev;
   ```

3. **Update DATABASE_URL** in `.env`

4. **Push schema**:
   ```bash
   npm run db:push
   ```

### GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/applications/new)
2. Create a new OAuth App:
   - **Application name**: SkillBridge
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3001/api/auth/github/callback`
3. Copy Client ID and Client Secret to `.env`

## 🚀 Production Deployment

### Environment Setup
- Use strong, unique secrets for JWT tokens
- Configure production database
- Set up proper CORS origins
- Enable HTTPS
- Configure rate limiting for production load

### Database Migrations
```bash
npm run db:migrate
```

### Build and Start
```bash
npm run build
npm start
```

## 🐛 Troubleshooting

### Common Issues

**Database Connection Error**
- Check PostgreSQL is running
- Verify DATABASE_URL format
- Ensure database exists

**GitHub OAuth Error**
- Verify GitHub OAuth app configuration
- Check callback URL matches exactly
- Ensure client ID/secret are correct

**JWT Token Error**
- Check JWT secrets are set
- Verify token hasn't expired
- Clear browser storage and re-login

### Debugging

Enable detailed logging:
```env
NODE_ENV=development
```

View database with Prisma Studio:
```bash
npm run db:studio
```

## 📝 API Documentation

For detailed API documentation with request/response examples, start the server and visit:
- Health check: `GET /health`
- API endpoints: See routes in `src/routes/`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details