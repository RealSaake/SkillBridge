# Fix SkillBridge - Production Design Document

## 🎨 **DESIGN PHILOSOPHY**

### **Core Principles**
1. **User-Centric**: Every design decision prioritizes user needs and experience
2. **Data-Driven**: Real user data drives personalized experiences
3. **Performance-First**: Fast, responsive, and reliable interactions
4. **Professional**: Inspires confidence and trust in career development
5. **Accessible**: Inclusive design for all users and devices

## 🏗️ **SYSTEM ARCHITECTURE REDESIGN**

### **Current Issues**
- Mock data contamination across components
- Poor separation of concerns
- Inconsistent state management
- No real-time data synchronization
- Weak error handling and recovery

### **New Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React + TypeScript)                             │
│  ├── Real-time Data Layer (React Query + WebSockets)       │
│  ├── State Management (Zustand + Context)                  │
│  ├── UI Components (Radix + Custom Design System)          │
│  └── Error Boundaries (Comprehensive Error Handling)       │
├─────────────────────────────────────────────────────────────┤
│  Backend (Firebase Functions + Express)                    │
│  ├── Authentication Service (GitHub OAuth + JWT)           │
│  ├── GitHub Integration Service (Real API Calls)           │
│  ├── User Data Service (Firestore + Caching)              │
│  ├── Analytics Service (User Behavior Tracking)           │
│  └── Notification Service (Real-time Updates)             │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                │
│  ├── Firestore (User Profiles, Progress, Preferences)     │
│  ├── Redis Cache (GitHub Data, API Responses)             │
│  ├── GitHub API (Real Repository Data)                    │
│  └── Analytics DB (User Behavior, Performance Metrics)    │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 **USER EXPERIENCE REDESIGN**

### **Critical User Journeys**

#### **Journey 1: First-Time User**
```
Landing Page → Value Proposition → GitHub OAuth → Onboarding Quiz → Personalized Dashboard
     ↓              ↓                   ↓              ↓                    ↓
Clear Benefits → Trust Building → Secure Auth → Profile Building → Immediate Value
```

#### **Journey 2: Returning User**
```
Direct Login → Updated Dashboard → New Insights → Progress Tracking → Next Actions
     ↓              ↓                ↓              ↓                ↓
Quick Access → Fresh Content → Personalized → Motivation → Engagement
```

#### **Journey 3: Power User**
```
Advanced Features → Deep Analytics → Export Data → Share Progress → Community
       ↓                ↓              ↓            ↓              ↓
Expert Tools → Detailed Insights → Portability → Social Proof → Network
```

## 🎨 **VISUAL DESIGN SYSTEM**

### **Color Palette**
```css
/* Primary Brand Colors */
--primary-50: #f0f9ff;
--primary-100: #e0f2fe;
--primary-500: #0ea5e9;  /* Main brand blue */
--primary-600: #0284c7;
--primary-900: #0c4a6e;

/* Secondary Accent */
--secondary-50: #fdf4ff;
--secondary-100: #fae8ff;
--secondary-500: #a855f7;  /* Purple accent */
--secondary-600: #9333ea;
--secondary-900: #581c87;

/* Success States */
--success-50: #f0fdf4;
--success-500: #22c55e;
--success-600: #16a34a;

/* Warning States */
--warning-50: #fffbeb;
--warning-500: #f59e0b;
--warning-600: #d97706;

/* Error States */
--error-50: #fef2f2;
--error-500: #ef4444;
--error-600: #dc2626;

/* Neutral Grays */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-300: #d1d5db;
--gray-400: #9ca3af;
--gray-500: #6b7280;
--gray-600: #4b5563;
--gray-700: #374151;
--gray-800: #1f2937;
--gray-900: #111827;
```

### **Typography Scale**
```css
/* Display Text */
.text-display-xl { font-size: 4.5rem; line-height: 1.1; font-weight: 800; }
.text-display-lg { font-size: 3.75rem; line-height: 1.1; font-weight: 800; }
.text-display-md { font-size: 3rem; line-height: 1.2; font-weight: 700; }

/* Headings */
.text-h1 { font-size: 2.25rem; line-height: 1.2; font-weight: 700; }
.text-h2 { font-size: 1.875rem; line-height: 1.3; font-weight: 600; }
.text-h3 { font-size: 1.5rem; line-height: 1.3; font-weight: 600; }
.text-h4 { font-size: 1.25rem; line-height: 1.4; font-weight: 500; }

/* Body Text */
.text-lg { font-size: 1.125rem; line-height: 1.6; }
.text-base { font-size: 1rem; line-height: 1.6; }
.text-sm { font-size: 0.875rem; line-height: 1.5; }
.text-xs { font-size: 0.75rem; line-height: 1.4; }
```

### **Spacing System**
```css
/* Consistent spacing scale */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

## 🧩 **COMPONENT DESIGN SPECIFICATIONS**

### **Enhanced UI Components**

#### **1. Professional Card Component**
```typescript
interface CardProps {
  variant: 'default' | 'elevated' | 'outlined' | 'glass';
  size: 'sm' | 'md' | 'lg' | 'xl';
  interactive?: boolean;
  loading?: boolean;
  error?: boolean;
  children: React.ReactNode;
}

// Usage Examples:
<Card variant="glass" size="lg" interactive>
  <CardHeader>
    <CardTitle>GitHub Activity</CardTitle>
    <CardDescription>Your coding patterns and insights</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Real GitHub data visualization */}
  </CardContent>
</Card>
```

#### **2. Data Visualization Components**
```typescript
// Repository Language Chart
<LanguageChart 
  data={userGitHubData.languages}
  interactive={true}
  showPercentages={true}
  colorScheme="brand"
/>

// Contribution Heatmap
<ContributionHeatmap
  data={userGitHubData.contributions}
  period="year"
  interactive={true}
/>

// Progress Ring
<ProgressRing
  value={skillProgress}
  size="lg"
  showLabel={true}
  animated={true}
/>
```

#### **3. Smart Loading States**
```typescript
// Skeleton Components
<RepositoryCardSkeleton />
<DashboardSkeleton />
<ChartSkeleton />

// Progressive Loading
<ProgressiveImage
  src={user.avatarUrl}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

#### **4. Error Boundary Components**
```typescript
<ErrorBoundary
  fallback={<ErrorFallback />}
  onError={(error, errorInfo) => {
    // Log to analytics
    analytics.track('error', { error, errorInfo });
  }}
>
  <GitHubDataComponent />
</ErrorBoundary>
```

## 📱 **RESPONSIVE DESIGN STRATEGY**

### **Breakpoint System**
```css
/* Mobile First Approach */
@media (min-width: 640px)  { /* sm */ }
@media (min-width: 768px)  { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

### **Component Adaptations**

#### **Dashboard Layout**
```typescript
// Mobile: Single column stack
// Tablet: 2-column grid
// Desktop: 3-column grid with sidebar

<DashboardGrid>
  <MainContent className="col-span-full lg:col-span-2">
    <GitHubActivity />
    <SkillAnalysis />
  </MainContent>
  <Sidebar className="col-span-full lg:col-span-1">
    <QuickActions />
    <ProgressSummary />
  </Sidebar>
</DashboardGrid>
```

#### **Navigation**
```typescript
// Mobile: Bottom tab navigation
// Desktop: Top navigation with sidebar

<Navigation>
  <MobileNav className="lg:hidden" />
  <DesktopNav className="hidden lg:flex" />
</Navigation>
```

## 🔄 **REAL-TIME DATA INTEGRATION**

### **GitHub Data Synchronization**
```typescript
// Real-time GitHub data fetching
const useGitHubData = (username: string) => {
  return useQuery({
    queryKey: ['github', username],
    queryFn: () => fetchGitHubData(username),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 60 * 1000, // 30 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// WebSocket for real-time updates
const useRealtimeUpdates = (userId: string) => {
  useEffect(() => {
    const ws = new WebSocket(`wss://api.skillbridge.dev/ws/${userId}`);
    
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      queryClient.setQueryData(['github', userId], update);
    };

    return () => ws.close();
  }, [userId]);
};
```

### **Optimistic Updates**
```typescript
// Update UI immediately, sync with server
const updateUserProfile = useMutation({
  mutationFn: (profileData) => api.updateProfile(profileData),
  onMutate: async (newProfile) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['user', 'profile']);
    
    // Snapshot previous value
    const previousProfile = queryClient.getQueryData(['user', 'profile']);
    
    // Optimistically update
    queryClient.setQueryData(['user', 'profile'], newProfile);
    
    return { previousProfile };
  },
  onError: (err, newProfile, context) => {
    // Rollback on error
    queryClient.setQueryData(['user', 'profile'], context.previousProfile);
  },
  onSettled: () => {
    // Refetch after mutation
    queryClient.invalidateQueries(['user', 'profile']);
  },
});
```

## 🎯 **PERSONALIZATION ENGINE**

### **"Aha!" Moment Design**
```typescript
// Immediate value delivery after onboarding
const generateAhaMoment = (user: UserProfile, githubData: GitHubData) => {
  const insights = {
    // Primary strength identification
    biggestStrength: analyzePrimarySkill(githubData.languages, githubData.projects),
    
    // Next skill recommendation
    nextSkillToLearn: findSkillGap(user.currentRole, user.targetRole, githubData.skills),
    
    // Immediate actionable projects
    recommendedProjects: generateProjectIdeas(user.targetRole, user.experienceLevel),
    
    // Confidence boost
    uniqueStrengths: identifyUniqueSkills(githubData, user.targetRole)
  };
  
  return {
    headline: `Welcome, ${user.name}! Your biggest strength is ${insights.biggestStrength}.`,
    subheadline: `To reach ${user.targetRole}, focus on learning ${insights.nextSkillToLearn} next.`,
    actionableSteps: insights.recommendedProjects.slice(0, 3),
    motivationalMessage: `You're already ${calculateProgressPercentage(user)}% of the way there!`
  };
};
```

### **User Profiling System**
```typescript
interface UserProfile {
  // Basic Info
  id: string;
  githubUsername: string;
  email: string;
  name: string;
  avatarUrl: string;
  
  // Career Info
  currentRole: string;
  targetRole: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  
  // Preferences
  learningStyle: 'visual' | 'hands-on' | 'reading' | 'video';
  timeCommitment: string;
  primaryGoals: string[];
  techStack: string[];
  
  // Computed Fields
  skillLevel: number;
  progressScore: number;
  engagementLevel: 'low' | 'medium' | 'high';
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  lastActiveAt: string;
}
```

### **Recommendation Engine with Curated Content**
```typescript
const generateRecommendations = (user: UserProfile, githubData: GitHubData) => {
  const recommendations = {
    // Skill-based recommendations with specific resources
    skillGaps: analyzeSkillGaps(user.techStack, user.targetRole),
    
    // Project recommendations
    projectIdeas: generateProjectIdeas(user.currentRole, user.targetRole),
    
    // Curated learning resources (not just generic suggestions)
    learningResources: findCuratedResources(user.skillGaps, user.learningStyle),
    
    // Career opportunities
    careerOpportunities: findCareerOpportunities(user.skillLevel, user.targetRole),
    
    // Networking suggestions
    networkingSuggestions: findNetworkingOpportunities(user.techStack),
  };
  
  return recommendations;
};

// Curated content system
const findCuratedResources = (skillGaps: string[], learningStyle: string) => {
  const curatedContent = {
    'docker': {
      beginner: {
        video: 'Docker Tutorial for Beginners - Programming with Mosh (YouTube)',
        interactive: 'Play with Docker - Interactive Tutorial',
        reading: 'Docker Official Documentation - Get Started Guide',
        project: 'Containerize a Node.js app - Step-by-step tutorial'
      }
    },
    'graphql': {
      beginner: {
        video: 'GraphQL Crash Course - Traversy Media (YouTube)',
        interactive: 'GraphQL Playground - Try queries in browser',
        reading: 'How to GraphQL - Free tutorial series',
        project: 'Build a GraphQL API with Node.js - Complete guide'
      }
    }
    // ... more curated content
  };
  
  return skillGaps.map(skill => ({
    skill,
    resources: curatedContent[skill]?.[getUserLevel(skill)] || getGenericResources(skill)
  }));
};
```

### **Gamification System**
```typescript
interface GamificationState {
  // Streaks and consistency
  loginStreak: number;
  learningStreak: number;
  lastActiveDate: string;
  
  // Achievements and badges
  badges: Badge[];
  totalPoints: number;
  level: number;
  
  // Progress tracking
  skillsUnlocked: string[];
  milestonesCompleted: Milestone[];
  projectsCompleted: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// Badge system
const awardBadge = (user: UserProfile, achievement: string) => {
  const badges = {
    'first_login': {
      name: 'Welcome Aboard!',
      description: 'Completed your first login',
      icon: '🚀',
      rarity: 'common'
    },
    'github_connected': {
      name: 'Code Detective',
      description: 'Connected your GitHub account',
      icon: '🔍',
      rarity: 'common'
    },
    'quiz_completed': {
      name: 'Self-Aware Developer',
      description: 'Completed the career assessment',
      icon: '🎯',
      rarity: 'common'
    },
    'first_roadmap': {
      name: 'Path Finder',
      description: 'Generated your first learning roadmap',
      icon: '🗺️',
      rarity: 'rare'
    },
    'week_streak': {
      name: 'Consistency Champion',
      description: 'Logged in for 7 days straight',
      icon: '🔥',
      rarity: 'rare'
    },
    'skill_master': {
      name: 'Skill Collector',
      description: 'Mastered 10 different technologies',
      icon: '⭐',
      rarity: 'epic'
    }
  };
  
  return badges[achievement];
};
```

### **Shareable Profile System**
```typescript
interface PublicProfile {
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  
  // Career info
  currentRole: string;
  targetRole: string;
  experienceLevel: string;
  
  // Achievements (gamification)
  badges: Badge[];
  skillsCount: number;
  projectsCount: number;
  
  // GitHub highlights
  topLanguages: LanguageStats[];
  featuredProjects: Repository[];
  contributionStreak: number;
  
  // Privacy controls
  isPublic: boolean;
  showGitHubData: boolean;
  showBadges: boolean;
}

// Public profile URL generation
const generatePublicProfileUrl = (username: string) => {
  return `https://skillbridge.dev/p/${username}`;
};

// Social sharing integration
const generateSocialShareData = (profile: PublicProfile) => {
  return {
    title: `${profile.displayName} - ${profile.currentRole} on SkillBridge`,
    description: `Check out ${profile.displayName}'s developer profile: ${profile.skillsCount} skills, ${profile.projectsCount} projects, and growing!`,
    image: generateProfileCardImage(profile),
    url: generatePublicProfileUrl(profile.username)
  };
};
```

## 📊 **ANALYTICS & MONITORING**

### **User Behavior Tracking**
```typescript
// Track user interactions
const analytics = {
  // Page views
  trackPageView: (page: string, properties?: object) => {
    gtag('event', 'page_view', {
      page_title: page,
      ...properties
    });
  },
  
  // Feature usage
  trackFeatureUsage: (feature: string, action: string) => {
    gtag('event', 'feature_usage', {
      feature_name: feature,
      action: action,
      timestamp: Date.now()
    });
  },
  
  // User journey
  trackUserJourney: (step: string, completed: boolean) => {
    gtag('event', 'user_journey', {
      step: step,
      completed: completed,
      timestamp: Date.now()
    });
  },
  
  // Performance metrics
  trackPerformance: (metric: string, value: number) => {
    gtag('event', 'performance', {
      metric_name: metric,
      value: value,
      timestamp: Date.now()
    });
  }
};
```

### **Error Monitoring**
```typescript
// Comprehensive error tracking
const errorMonitoring = {
  // JavaScript errors
  trackJSError: (error: Error, errorInfo?: object) => {
    Sentry.captureException(error, {
      extra: errorInfo,
      tags: {
        component: 'frontend',
        severity: 'error'
      }
    });
  },
  
  // API errors
  trackAPIError: (endpoint: string, status: number, message: string) => {
    Sentry.captureMessage(`API Error: ${endpoint}`, {
      level: 'error',
      extra: {
        endpoint,
        status,
        message,
        timestamp: Date.now()
      }
    });
  },
  
  // User feedback
  trackUserFeedback: (feedback: string, rating: number) => {
    analytics.track('user_feedback', {
      feedback,
      rating,
      timestamp: Date.now()
    });
  }
};
```

## 🚀 **PERFORMANCE OPTIMIZATION**

### **Code Splitting Strategy**
```typescript
// Route-based code splitting
const Dashboard = lazy(() => import('./components/Dashboard'));
const Profile = lazy(() => import('./components/Profile'));
const Analytics = lazy(() => import('./components/Analytics'));

// Component-based code splitting
const GitHubChart = lazy(() => import('./components/GitHubChart'));
const SkillAnalysis = lazy(() => import('./components/SkillAnalysis'));
```

### **Caching Strategy**
```typescript
// Service Worker for offline support
const cacheStrategy = {
  // Cache static assets
  staticAssets: 'cache-first',
  
  // Cache API responses
  apiResponses: 'stale-while-revalidate',
  
  // Cache user data
  userData: 'network-first',
  
  // Cache GitHub data
  githubData: 'stale-while-revalidate'
};
```

### **Image Optimization**
```typescript
// Progressive image loading
<Image
  src={user.avatarUrl}
  alt={user.name}
  width={64}
  height={64}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
  priority={true}
/>

// Lazy loading for non-critical images
<Image
  src={repo.imageUrl}
  alt={repo.name}
  loading="lazy"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

## 📝 **CONTENT STRATEGY & SEO**

### **Blog Content System**
```typescript
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: string;
  tags: string[];
  seoMetadata: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    canonicalUrl: string;
  };
  relatedFeatures: string[]; // Link to platform features
}

// High-value content topics
const contentTopics = [
  {
    title: "How to Get Your First Pull Request Merged",
    targetKeywords: ["first pull request", "open source contribution", "github pr"],
    relatedFeatures: ["github-analysis", "skill-assessment"],
    searchVolume: "high"
  },
  {
    title: "5 Skills Every Full-Stack Developer Needs in 2025",
    targetKeywords: ["full stack developer skills", "web development 2025"],
    relatedFeatures: ["career-roadmap", "skill-gap-analysis"],
    searchVolume: "very-high"
  },
  {
    title: "From Junior to Senior: A Developer's Growth Roadmap",
    targetKeywords: ["junior to senior developer", "career progression"],
    relatedFeatures: ["career-roadmap", "progress-tracking"],
    searchVolume: "high"
  },
  {
    title: "Building a Developer Portfolio That Gets You Hired",
    targetKeywords: ["developer portfolio", "github portfolio"],
    relatedFeatures: ["public-profile", "github-analysis"],
    searchVolume: "very-high"
  },
  {
    title: "The Complete Guide to Learning React in 2025",
    targetKeywords: ["learn react", "react tutorial", "react roadmap"],
    relatedFeatures: ["learning-resources", "skill-tracking"],
    searchVolume: "extremely-high"
  }
];
```

### **SEO Optimization Strategy**
```typescript
// Structured data for rich snippets
const generateStructuredData = (content: BlogPost | PublicProfile) => {
  if (content.type === 'blog') {
    return {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": content.title,
      "description": content.excerpt,
      "author": {
        "@type": "Organization",
        "name": "SkillBridge"
      },
      "publisher": {
        "@type": "Organization",
        "name": "SkillBridge",
        "logo": "https://skillbridge.dev/logo.png"
      },
      "datePublished": content.publishedAt,
      "mainEntityOfPage": content.canonicalUrl
    };
  } else if (content.type === 'profile') {
    return {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": content.displayName,
      "jobTitle": content.currentRole,
      "description": content.bio,
      "url": generatePublicProfileUrl(content.username),
      "sameAs": [content.githubUrl, content.linkedinUrl].filter(Boolean)
    };
  }
};

// Internal linking strategy
const generateInternalLinks = (content: string, availableFeatures: string[]) => {
  const linkOpportunities = {
    "skill gap": "/features/skill-analysis",
    "learning roadmap": "/features/roadmap",
    "github analysis": "/features/github-integration",
    "career development": "/blog/career-development",
    "developer portfolio": "/features/public-profile"
  };
  
  // Automatically insert contextual links
  return content.replace(/\b(skill gap|learning roadmap|github analysis)\b/gi, (match) => {
    const url = linkOpportunities[match.toLowerCase()];
    return url ? `<a href="${url}">${match}</a>` : match;
  });
};
```

### **Growth Loop Integration**
```typescript
// Connect content to platform features
const contentToFeatureMapping = {
  // Blog readers become users
  blogReader: {
    ctaText: "Analyze your GitHub profile now",
    ctaAction: "github-connect",
    conversionGoal: "user-signup"
  },
  
  // Users become content sharers
  platformUser: {
    ctaText: "Share your developer profile",
    ctaAction: "create-public-profile",
    conversionGoal: "profile-share"
  },
  
  // Profile viewers become users
  profileViewer: {
    ctaText: "Create your own developer profile",
    ctaAction: "signup-from-profile",
    conversionGoal: "viral-signup"
  }
};

// Viral coefficient tracking
const trackViralCoefficient = () => {
  const metrics = {
    profileShares: countProfileShares(),
    profileViews: countProfileViews(),
    signupsFromProfiles: countViralSignups(),
    viralCoefficient: signupsFromProfiles / profileShares
  };
  
  // Goal: Viral coefficient > 1.0 (each user brings more than 1 new user)
  return metrics;
};
```

## 🔒 **SECURITY DESIGN**

### **Authentication Flow**
```typescript
// Secure token handling
const authFlow = {
  // GitHub OAuth
  initiateOAuth: () => {
    const state = generateSecureState();
    const codeVerifier = generateCodeVerifier();
    
    localStorage.setItem('oauth_state', state);
    localStorage.setItem('code_verifier', codeVerifier);
    
    window.location.href = buildOAuthUrl(state, codeVerifier);
  },
  
  // Token exchange
  exchangeCodeForToken: async (code: string, state: string) => {
    const storedState = localStorage.getItem('oauth_state');
    const codeVerifier = localStorage.getItem('code_verifier');
    
    if (state !== storedState) {
      throw new Error('Invalid OAuth state');
    }
    
    const tokens = await api.exchangeCode(code, codeVerifier);
    
    // Store tokens securely
    secureStorage.setItem('access_token', tokens.accessToken);
    secureStorage.setItem('refresh_token', tokens.refreshToken);
    
    return tokens;
  }
};
```

### **Data Protection**
```typescript
// Encrypt sensitive data
const dataProtection = {
  encryptUserData: (data: object) => {
    return CryptoJS.AES.encrypt(JSON.stringify(data), process.env.ENCRYPTION_KEY);
  },
  
  decryptUserData: (encryptedData: string) => {
    const bytes = CryptoJS.AES.decrypt(encryptedData, process.env.ENCRYPTION_KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  },
  
  sanitizeInput: (input: string) => {
    return DOMPurify.sanitize(input);
  }
};
```

## 🎨 **ACCESSIBILITY DESIGN**

### **WCAG 2.1 AA Compliance**
```typescript
// Semantic HTML structure
<main role="main" aria-label="Dashboard">
  <section aria-labelledby="github-activity-heading">
    <h2 id="github-activity-heading">GitHub Activity</h2>
    <div role="region" aria-live="polite">
      {/* Dynamic content updates */}
    </div>
  </section>
</main>

// Keyboard navigation
const KeyboardNavigation = () => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Tab navigation
      if (event.key === 'Tab') {
        // Ensure focus is visible
        document.body.classList.add('keyboard-navigation');
      }
      
      // Skip links
      if (event.key === 'Enter' && event.target.id === 'skip-to-main') {
        document.getElementById('main-content')?.focus();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
};

// Screen reader support
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {loadingMessage}
</div>
```

This comprehensive design document ensures SkillBridge becomes a **world-class, production-ready platform** that users will love and trust! 🚀