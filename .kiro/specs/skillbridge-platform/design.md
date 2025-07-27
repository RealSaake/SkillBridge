# SkillBridge Design Document

## UI Integration Overview

### Frontend Architecture
The SkillBridge UI is built with React TypeScript components using a modern design system with dark/light theme support. The UI follows a dashboard-centric approach with specialized components for each career development feature.

### Component-to-MCP Mapping

| UI Component | MCP Server | Tools Used | Data Flow |
|--------------|------------|------------|-----------|
| `GitHubActivity.tsx` | `github-projects`, `portfolio-analyzer` | `fetch_github_repos`, `fetch_github_profile`, `analyze_github_activity` | Real-time GitHub stats, language distribution, repository analysis |
| `ResumeReview.tsx` | `resume-tips`, `portfolio-analyzer` | `get_resume_tips`, `analyze_resume_section`, `generate_resume_enhancement` | Resume scoring, AI suggestions, section analysis |
| `LearningRoadmap.tsx` | `roadmap-data` | `get_career_roadmap`, `get_learning_resources` | Personalized learning paths, progress tracking |
| `SkillGapAnalysis.tsx` | `portfolio-analyzer` | `find_skill_gaps`, `analyze_github_activity` | Skill level assessment, gap identification |
| `JobMarketInsights.tsx` | Custom market data API | Market trends, salary data | Job market analysis (future enhancement) |
| `ProfileSetup.tsx` | User management system | Profile creation, GitHub OAuth | User onboarding and authentication |

## Architecture Overview

### System Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API    │    │   AI Layer      │
│   (React/Next)  │◄──►│   (Node.js)      │◄──►│   (Kiro+MCP)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Static CDN    │    │   PostgreSQL     │    │   GitHub API    │
│   (Vercel)      │    │   (Supabase)     │    │   (External)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Technology Stack

#### Frontend
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS + Headless UI
- **State Management**: Zustand (lightweight, TypeScript-first)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts for progress visualization
- **Deployment**: Vercel

**Rationale**: Next.js provides excellent SSR/SSG for portfolio SEO, while Tailwind ensures consistent, mobile-first design. Zustand is lighter than Redux for our use case.

#### Backend
- **Runtime**: Node.js 20+ with TypeScript
- **Framework**: Fastify (faster than Express, better TypeScript support)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk (GitHub OAuth integration)
- **File Storage**: Vercel Blob for resume PDFs
- **Deployment**: Railway or Render

**Rationale**: Fastify offers better performance and TypeScript experience than Express. Prisma provides type-safe database access with excellent migration tools.

#### AI & Intelligence Layer
- **Agent Framework**: Kiro IDE agents with MCP integration
- **MCP Servers**: Existing SkillBridge MCP servers
- **Hooks**: beforeGenerate/afterGenerate for validation
- **Steering**: Consistent AI behavior rules
- **Logging**: Structured logging for AI decision tracking

#### Database Design

```sql
-- Core user and profile tables
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id VARCHAR(255) UNIQUE NOT NULL,
  github_username VARCHAR(255) UNIQUE,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(255),
  bio TEXT,
  target_role VARCHAR(100), -- frontend, backend, fullstack, data-science
  experience_level VARCHAR(50), -- beginner, intermediate, advanced
  is_public BOOLEAN DEFAULT false,
  portfolio_url VARCHAR(255),
  resume_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- GitHub integration and analysis
CREATE TABLE github_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  github_data JSONB NOT NULL, -- Raw GitHub profile data
  last_synced TIMESTAMP DEFAULT NOW(),
  sync_status VARCHAR(50) DEFAULT 'pending' -- pending, success, error
);

CREATE TABLE repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  github_id BIGINT UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  language VARCHAR(100),
  stars INTEGER DEFAULT 0,
  forks INTEGER DEFAULT 0,
  is_fork BOOLEAN DEFAULT false,
  repo_data JSONB NOT NULL, -- Full GitHub repo data
  analysis_data JSONB, -- AI analysis results
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Skills and learning progress
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(50), -- language, framework, tool, concept
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
  proficiency_level INTEGER CHECK (proficiency_level >= 1 AND proficiency_level <= 5),
  evidence_repos UUID[] DEFAULT '{}', -- Array of repository IDs
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, skill_id)
);

-- Learning roadmaps and progress
CREATE TABLE roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  target_role VARCHAR(100) NOT NULL,
  roadmap_data JSONB NOT NULL, -- Generated roadmap structure
  progress_data JSONB DEFAULT '{}', -- User progress tracking
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Resume and portfolio data
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  version INTEGER DEFAULT 1,
  resume_data JSONB NOT NULL, -- Structured resume content
  pdf_url VARCHAR(255), -- Generated PDF location
  is_current BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Analytics and tracking
CREATE TABLE user_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL, -- portfolio_view, resume_download, etc.
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);
```

## API Design

### RESTful Endpoints

#### Authentication & Users
```typescript
POST   /api/auth/callback          // Clerk webhook
GET    /api/users/me               // Current user profile
PUT    /api/users/me               // Update user profile
DELETE /api/users/me               // Delete account
```

#### GitHub Integration
```typescript
POST   /api/github/connect         // Link GitHub account
POST   /api/github/sync            // Trigger repository sync
GET    /api/github/repos           // Get user repositories
GET    /api/github/analysis        // Get AI analysis of repos
```

#### Skills & Learning
```typescript
GET    /api/skills                 // List all available skills
GET    /api/users/me/skills        // User's current skills
PUT    /api/users/me/skills        // Update skill proficiencies
GET    /api/roadmaps/:role         // Get roadmap for role
POST   /api/roadmaps               // Generate personalized roadmap
PUT    /api/roadmaps/:id/progress  // Update learning progress
```

#### Portfolio & Resume
```typescript
GET    /api/portfolio/:username    // Public portfolio view
PUT    /api/portfolio              // Update portfolio settings
GET    /api/resume                 // Get current resume
POST   /api/resume/generate        // Generate new resume version
GET    /api/resume/pdf             // Download resume PDF
```

#### Analytics
```typescript
POST   /api/analytics/track        // Track user events
GET    /api/analytics/dashboard    // User analytics dashboard
```

### MCP Integration Strategy

#### Agent Workflow
```typescript
// Example: Portfolio generation agent
async function generatePortfolio(userId: string) {
  // Pre-generation hook
  await runHook('beforeGenerate', { userId, action: 'portfolio' });
  
  try {
    // 1. Fetch GitHub data via MCP
    const githubData = await mcp('github-projects', 'fetch_github_repos', { 
      username: user.github_username 
    });
    
    // 2. Analyze skills and projects via MCP
    const analysis = await mcp('portfolio-analyzer', 'analyze_github_activity', {
      username: user.github_username,
      targetRole: user.target_role
    });
    
    // 3. Get roadmap recommendations via MCP
    const roadmap = await mcp('roadmap-data', 'get_career_roadmap', {
      role: user.target_role
    });
    
    // 4. Generate resume content via MCP
    const resumeEnhancements = await mcp('portfolio-analyzer', 'generate_resume_enhancement', {
      githubData,
      targetRole: user.target_role
    });
    
    // 5. Combine data into portfolio
    const portfolio = {
      profile: analysis.profile,
      skills: analysis.activity,
      projects: selectTopProjects(githubData),
      roadmap: roadmap.phases,
      resume: resumeEnhancements
    };
    
    // Post-generation hook
    await runHook('afterGenerate', { userId, action: 'portfolio', result: portfolio });
    
    return portfolio;
    
  } catch (error) {
    await logError('portfolio-generation', error, { userId });
    throw error;
  }
}
```

#### Hook Implementation
```typescript
// .kiro/hooks/beforeGenerate.ts
export async function beforeGenerate(context: HookContext) {
  // Validate user permissions
  if (!context.userId) {
    throw new Error('User authentication required');
  }
  
  // Check rate limits
  const rateLimitOk = await checkRateLimit(context.userId, context.action);
  if (!rateLimitOk) {
    throw new Error('Rate limit exceeded');
  }
  
  // Log action start
  await logAction('start', context);
}

// .kiro/hooks/afterGenerate.ts
export async function afterGenerate(context: HookContext) {
  // Validate output schema
  const isValid = await validateOutput(context.result, context.action);
  if (!isValid) {
    await logError('invalid-output', context);
    throw new Error('Generated content failed validation');
  }
  
  // Update user analytics
  await trackUserEvent(context.userId, `${context.action}_completed`);
  
  // Log success
  await logAction('complete', context);
}
```

## UI/UX Design

### Design System

#### Color Palette
```css
:root {
  /* Primary - Professional blue */
  --primary-50: #eff6ff;
  --primary-500: #3b82f6;
  --primary-600: #2563eb;
  --primary-900: #1e3a8a;
  
  /* Secondary - Success green */
  --secondary-50: #f0fdf4;
  --secondary-500: #22c55e;
  --secondary-600: #16a34a;
  
  /* Neutral - Clean grays */
  --neutral-50: #f9fafb;
  --neutral-100: #f3f4f6;
  --neutral-500: #6b7280;
  --neutral-900: #111827;
  
  /* Accent - Warning orange */
  --accent-500: #f59e0b;
  --accent-600: #d97706;
}
```

#### Typography Scale
```css
/* Headings */
.text-h1 { @apply text-4xl font-bold tracking-tight; }
.text-h2 { @apply text-3xl font-semibold tracking-tight; }
.text-h3 { @apply text-2xl font-semibold; }
.text-h4 { @apply text-xl font-medium; }

/* Body text */
.text-body { @apply text-base leading-relaxed; }
.text-small { @apply text-sm; }
.text-xs { @apply text-xs; }

/* Interactive */
.text-link { @apply text-primary-600 hover:text-primary-700 underline; }
```

### Key User Flows

#### 1. Onboarding Flow
```
1. Sign up with GitHub OAuth
2. Import GitHub repositories (background sync)
3. Select target career role
4. Set experience level and goals
5. Generate initial portfolio
6. Review and customize content
7. Publish portfolio
```

#### 2. Portfolio Creation Flow
```
1. Dashboard overview with progress
2. GitHub sync status and repo selection
3. AI-generated project descriptions
4. Skill assessment and validation
5. Portfolio preview and customization
6. Public URL generation
7. Share and export options
```

#### 3. Resume Generation Flow
```
1. Select target job/role
2. AI analyzes GitHub projects
3. Generate resume bullets
4. Manual editing and refinement
5. ATS optimization check
6. Export to PDF/Word
7. Version management
```

### Component Architecture

#### Core Components
```typescript
// Layout components
<AppLayout />
<DashboardLayout />
<PortfolioLayout />

// Feature components
<GitHubSync />
<SkillAssessment />
<ProjectShowcase />
<LearningRoadmap />
<ResumeBuilder />

// UI components
<Button variant="primary" size="lg" />
<Card className="p-6" />
<ProgressBar value={75} />
<SkillBadge skill="React" level={4} />
<ProjectCard project={projectData} />
```

#### State Management
```typescript
// User store
interface UserStore {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  syncGitHub: () => Promise<void>;
}

// Portfolio store
interface PortfolioStore {
  repositories: Repository[];
  skills: UserSkill[];
  roadmap: Roadmap | null;
  isGenerating: boolean;
  generatePortfolio: () => Promise<void>;
  updateSkill: (skillId: string, level: number) => Promise<void>;
}
```

## Security & Privacy

### Authentication
- **Clerk Integration**: Secure OAuth with GitHub
- **JWT Tokens**: Short-lived access tokens
- **Session Management**: Secure session handling
- **Rate Limiting**: API endpoint protection

### Data Protection
- **Encryption**: All sensitive data encrypted at rest
- **HTTPS**: All communications over TLS
- **Input Validation**: Comprehensive input sanitization
- **SQL Injection**: Parameterized queries via Prisma

### Privacy Controls
- **Portfolio Visibility**: Public/private toggle
- **Data Deletion**: Complete account removal
- **GitHub Permissions**: Minimal required scopes
- **Analytics Opt-out**: User control over tracking

## Performance & Scalability

### Frontend Optimization
- **Code Splitting**: Route-based lazy loading
- **Image Optimization**: Next.js Image component
- **Caching**: Aggressive caching of static content
- **Bundle Size**: Tree shaking and dead code elimination

### Backend Optimization
- **Database Indexing**: Optimized queries with proper indexes
- **Connection Pooling**: Efficient database connections
- **Caching Layer**: Redis for frequently accessed data
- **Background Jobs**: Queue system for heavy operations

### Monitoring & Observability
- **Error Tracking**: Sentry integration
- **Performance Monitoring**: Web Vitals tracking
- **API Monitoring**: Response time and error rate tracking
- **User Analytics**: Privacy-compliant usage tracking

## Deployment & DevOps

### Development Environment
```bash
# Local development setup
npm run dev          # Start Next.js dev server
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed development data
npm run test         # Run test suite
npm run lint         # Code quality checks
```

### Production Deployment
- **Frontend**: Vercel with automatic deployments
- **Backend**: Railway with Docker containers
- **Database**: Supabase PostgreSQL
- **CDN**: Vercel Edge Network
- **Monitoring**: Vercel Analytics + Sentry

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run test
      - run: npm run lint
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

## Risk Mitigation

### Technical Risks
- **GitHub API Limits**: Implement caching and rate limit handling
- **AI Hallucination**: Validation hooks and human oversight
- **Database Performance**: Proper indexing and query optimization
- **Third-party Dependencies**: Regular security updates

### Business Risks
- **User Adoption**: Focus on core value proposition
- **Competition**: Differentiate through AI integration
- **Monetization**: Validate pricing with early users
- **Scalability**: Design for growth from day one

### Mitigation Strategies
- **Feature Flags**: Gradual rollout of new features
- **A/B Testing**: Data-driven UX decisions
- **User Feedback**: Regular user interviews and surveys
- **Performance Budgets**: Maintain fast loading times