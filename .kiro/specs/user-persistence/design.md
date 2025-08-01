# User Persistence & State Management Design

## Overview

This design document outlines the implementation of true user persistence for SkillBridge, transforming it from a stateless application into a personalized platform that remembers users and their progress. The solution will be implemented within the existing Firebase Functions architecture, using Firestore as the persistent data store.

## Architecture

### Current State
- Firebase Functions backend with basic GitHub OAuth
- No persistent user data storage
- Users lose all data between sessions
- Onboarding quiz results are discarded

### Target State
- Firebase Functions backend with Firestore integration
- Persistent user profiles with onboarding data
- Progress tracking for learning roadmaps
- Seamless authentication flow distinguishing new vs returning users

## Components and Interfaces

### 1. Database Schema (Firestore Collections)

#### Users Collection (`users/{userId}`)
```typescript
interface User {
  id: string;                    // GitHub user ID
  githubId: string;             // GitHub user ID (redundant for clarity)
  username: string;             // GitHub username
  email: string;                // GitHub email
  name: string;                 // Display name
  avatarUrl: string;            // GitHub avatar URL
  bio?: string;                 // GitHub bio
  location?: string;            // GitHub location
  company?: string;             // GitHub company
  blog?: string;                // GitHub blog URL
  publicRepos: number;          // GitHub public repo count
  followers: number;            // GitHub followers count
  following: number;            // GitHub following count
  githubCreatedAt: string;      // GitHub account creation date
  githubUpdatedAt: string;      // GitHub last update date
  createdAt: string;            // SkillBridge account creation
  updatedAt: string;            // Last profile update
  lastLoginAt: string;          // Last login timestamp
}
```

#### Profiles Collection (`profiles/{userId}`)
```typescript
interface Profile {
  userId: string;               // Reference to user document
  currentRole?: string;         // Current job role
  targetRole?: string;          // Desired job role
  experienceLevel?: string;     // Beginner, Intermediate, Advanced
  techStack: string[];          // Array of technologies
  careerGoal?: string;          // Career objective
  completedOnboarding: boolean; // Has completed onboarding quiz
  roadmapProgress?: {           // Progress tracking
    [roadmapId: string]: {
      completedSteps: string[];
      lastUpdated: string;
      progressPercentage: number;
    }
  };
  preferences?: {               // User preferences
    theme: 'light' | 'dark';
    notifications: boolean;
    publicProfile: boolean;
  };
  createdAt: string;
  updatedAt: string;
}
```

### 2. API Endpoints

#### Authentication Endpoints
- `GET /api/auth/me` - Get current user with profile data
- `POST /api/auth/logout` - Logout and clear session

#### Profile Management Endpoints
- `GET /api/profiles/me` - Get user's profile (404 if not exists)
- `POST /api/profiles` - Create new profile (onboarding)
- `PUT /api/profiles/me` - Update profile data
- `PUT /api/profiles/me/progress` - Update roadmap progress
- `DELETE /api/profiles/me` - Delete profile

### 3. Frontend State Management

#### AuthContext Enhancement
```typescript
interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  updateProgress: (roadmapId: string, completedSteps: string[]) => Promise<void>;
}
```

#### Authentication Flow
1. User clicks "Sign in with GitHub"
2. GitHub OAuth flow completes
3. Firebase Function receives callback with GitHub data
4. System checks if user exists in Firestore
5. If user exists: Load user + profile data, redirect to dashboard
6. If user doesn't exist: Create user record, redirect to onboarding
7. After onboarding: Create profile record, redirect to dashboard

## Data Models

### User Creation Flow
```typescript
// 1. GitHub OAuth callback creates/updates user
const createOrUpdateUser = async (githubData: GitHubUser): Promise<User> => {
  const userRef = db.collection('users').doc(githubData.id.toString());
  const userData: User = {
    id: githubData.id.toString(),
    githubId: githubData.id.toString(),
    username: githubData.login,
    email: githubData.email || `${githubData.login}@github.local`,
    name: githubData.name || githubData.login,
    avatarUrl: githubData.avatar_url,
    bio: githubData.bio,
    location: githubData.location,
    company: githubData.company,
    blog: githubData.blog,
    publicRepos: githubData.public_repos,
    followers: githubData.followers,
    following: githubData.following,
    githubCreatedAt: githubData.created_at,
    githubUpdatedAt: githubData.updated_at,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  };
  
  await userRef.set(userData, { merge: true });
  return userData;
};
```

### Profile Creation Flow
```typescript
// 2. Onboarding completion creates profile
const createProfile = async (userId: string, onboardingData: OnboardingData): Promise<Profile> => {
  const profileRef = db.collection('profiles').doc(userId);
  const profileData: Profile = {
    userId,
    currentRole: onboardingData.currentRole,
    targetRole: onboardingData.targetRole,
    experienceLevel: onboardingData.experienceLevel,
    techStack: onboardingData.techStack,
    careerGoal: onboardingData.careerGoal,
    completedOnboarding: true,
    roadmapProgress: {},
    preferences: {
      theme: 'light',
      notifications: true,
      publicProfile: false
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  await profileRef.set(profileData);
  return profileData;
};
```

## Error Handling

### Database Connection Errors
- Implement retry logic with exponential backoff
- Cache user data in localStorage as fallback
- Display clear error messages with retry options
- Graceful degradation to read-only mode

### Authentication Errors
- Handle expired tokens with automatic refresh
- Clear invalid sessions and redirect to login
- Preserve user context during re-authentication
- Log authentication failures for monitoring

### Data Validation Errors
- Validate all input data before database operations
- Return specific error messages for validation failures
- Prevent data corruption with schema validation
- Handle partial update failures gracefully

## Testing Strategy

### Unit Tests
- Database operations (create, read, update, delete)
- Authentication token validation
- Data transformation functions
- Error handling scenarios

### Integration Tests
- Complete authentication flow
- Onboarding to dashboard journey
- Profile update operations
- Progress tracking functionality

### End-to-End Tests
- New user signup and onboarding
- Returning user login and data loading
- Multi-user data isolation
- Session management and logout

### Performance Tests
- Database query optimization
- Concurrent user handling
- Large dataset operations
- Memory usage monitoring

## Security Considerations

### Data Protection
- Encrypt sensitive profile data
- Implement proper access controls
- Validate all user inputs
- Sanitize data before storage

### Authentication Security
- Secure token storage and transmission
- Implement token expiration and refresh
- Protect against CSRF attacks
- Rate limit authentication attempts

### Privacy Controls
- Allow users to delete their data
- Implement data export functionality
- Respect user privacy preferences
- Comply with data protection regulations

## Implementation Phases

### Phase 1: Database Setup
1. Configure Firestore collections and indexes
2. Implement basic CRUD operations
3. Add data validation and error handling
4. Create database migration utilities

### Phase 2: Authentication Enhancement
1. Modify GitHub OAuth callback to create/update users
2. Implement profile existence checking
3. Add session management improvements
4. Create logout functionality

### Phase 3: Frontend Integration
1. Update AuthContext with profile management
2. Modify authentication flow routing
3. Implement profile update operations
4. Add progress tracking functionality

### Phase 4: Testing & Optimization
1. Comprehensive testing suite
2. Performance optimization
3. Security audit and hardening
4. Documentation and deployment

## Monitoring and Analytics

### Key Metrics
- User registration and onboarding completion rates
- Profile update frequency and patterns
- Authentication success/failure rates
- Database performance and error rates

### Logging Strategy
- Structured logging for all database operations
- Authentication event tracking
- Error logging with context
- Performance metrics collection

### Alerting
- Database connection failures
- High error rates
- Authentication anomalies
- Performance degradation

This design provides a comprehensive foundation for implementing true user persistence in SkillBridge while maintaining the existing Firebase Functions architecture and ensuring scalability, security, and reliability.