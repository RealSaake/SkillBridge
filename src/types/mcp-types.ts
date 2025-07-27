// SkillBridge MCP Type Definitions
// This file defines all interfaces for MCP server communication

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  created_at: string;
  fork: boolean;
  private: boolean;
  html_url: string;
  clone_url: string;
  topics: string[];
  license: {
    key: string;
    name: string;
  } | null;
}

export interface GitHubProfile {
  login: string;
  id: number;
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  bio: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubActivityAnalysis {
  profile: {
    name: string;
    followers: number;
    publicRepos: number;
    accountAge: number;
  };
  activity: {
    totalStars: number;
    recentlyActiveRepos: number;
    languages: string[];
    frameworks: string[];
    commitFrequency: 'sporadic' | 'regular' | 'consistent';
    contributionStreak: number;
  };
  insights: {
    experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced';
    activityLevel: 'Low' | 'Medium' | 'High';
    roleAlignment: number; // 0-100 percentage
  };
}

export interface ResumeSection {
  name: string;
  score: number;
  status: 'good' | 'warning' | 'error';
  feedback: string[];
}

export interface ResumeSuggestion {
  type: 'good' | 'warning' | 'error';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'content' | 'format' | 'ats' | 'keywords';
}

export interface ResumeAnalysis {
  overall: number; // 0-100 score
  sections: ResumeSection[];
  suggestions: ResumeSuggestion[];
  atsCompatibility: {
    score: number;
    issues: string[];
    recommendations: string[];
  };
  keywords: {
    present: string[];
    missing: string[];
    density: number;
  };
}

export interface ResumeEnhancement {
  projectBullets: string[];
  skillHighlights: string[];
  roleSpecificContent: string[];
  quantifiedAchievements: string[];
  atsOptimizations: string[];
}

export interface SkillGap {
  skill: string;
  currentLevel: number; // 0-100
  targetLevel: number; // 0-100
  priority?: 'High' | 'Medium' | 'Low';
  importance: 'high' | 'medium' | 'low';
  category?: string;
  trending?: boolean;
  description?: string;
  learningResources?: string[];
  resources?: LearningResource[];
  estimatedTimeToLearn?: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface LearningResource {
  title: string;
  type: 'course' | 'article' | 'video' | 'book' | 'project';
  provider: string;
  url?: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  rating?: number;
  cost: 'free' | 'paid' | 'freemium';
}

export interface RoadmapPhase {
  phase: string;
  duration: string;
  skills: string[];
  projects: string[];
  milestones: string[];
  prerequisites: string[];
  resources: LearningResource[];
}

export interface CareerRoadmap {
  title: string;
  targetRole: string;
  totalDuration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  phases: RoadmapPhase[];
  alternativePaths: string[];
  marketDemand: {
    score: number;
    trend: 'growing' | 'stable' | 'declining';
    averageSalary: string;
  };
}

export interface LearningRoadmap {
  title: string;
  targetRole: string;
  estimatedWeeks: number;
  totalHours: number;
  hoursPerWeek: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  weeks: RoadmapWeek[];
  skillsFocus: string[];
}

export interface RoadmapWeek {
  week: number;
  theme: string;
  description?: string;
  items: LearningItem[];
}

export interface LearningItem {
  id: string;
  title: string;
  type: 'course' | 'article' | 'project' | 'video';
  provider: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  status: 'not-started' | 'in-progress' | 'completed';
  progress: number;
  skill: string;
  priority: 'high' | 'medium' | 'low';
  url?: string;
  description?: string;
  prerequisites?: string[];
}

export interface MCPError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: string;
  serverName: string;
  toolName: string;
}

export interface MCPResponse<T> {
  data: T | null;
  error: MCPError | null;
  loading: boolean;
  timestamp: string;
}

// User Profile Types
export interface UserProfile {
  id: string;
  githubUsername: string;
  targetRole: string;
  experienceLevel: string;
  preferences: {
    learningStyle: 'visual' | 'hands-on' | 'reading' | 'social';
    timeCommitment: number; // hours per week
    focusAreas: string[];
  };
  progress: {
    completedMilestones: string[];
    currentPhase: string;
    skillLevels: Record<string, number>;
  };
}

// State Management Types
export interface UserStore {
  user: UserProfile | null;
  isAuthenticated: boolean;
  githubConnected: boolean;
  setUser: (user: UserProfile) => void;
  connectGitHub: (username: string) => Promise<void>;
  updateProgress: (progress: Partial<UserProfile['progress']>) => void;
  logout: () => void;
}

export interface PortfolioStore {
  repositories: GitHubRepo[];
  analysis: GitHubActivityAnalysis | null;
  skillGaps: SkillGap[];
  roadmap: CareerRoadmap | null;
  isGenerating: boolean;
  lastUpdated: string | null;
  
  // Actions
  fetchGitHubData: (username: string) => Promise<void>;
  analyzeActivity: (username: string, targetRole: string) => Promise<void>;
  generateRoadmap: (targetRole: string) => Promise<void>;
  updateSkillLevel: (skill: string, level: number) => void;
  refreshData: () => Promise<void>;
}

export interface ResumeStore {
  currentResume: ResumeAnalysis | null;
  versions: ResumeAnalysis[];
  enhancements: ResumeEnhancement | null;
  isAnalyzing: boolean;
  
  // Actions
  analyzeResume: (content: string) => Promise<void>;
  generateEnhancements: (githubData: GitHubActivityAnalysis, targetRole: string) => Promise<void>;
  saveVersion: (version: ResumeAnalysis) => void;
  exportResume: (format: 'pdf' | 'docx' | 'txt') => Promise<Blob>;
}