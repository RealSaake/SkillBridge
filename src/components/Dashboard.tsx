import React from 'react';
import { GitHubActivityEnhanced } from './GitHubActivityEnhanced';
import { ResumeReviewEnhanced } from './ResumeReviewEnhanced';
import { SkillGapAnalysisEnhanced } from './SkillGapAnalysisEnhanced';
import { LearningRoadmapEnhanced } from './LearningRoadmapEnhanced';

interface DashboardProps {
  username?: string;
  targetRole?: string;
}

export default function Dashboard({ username = 'testuser', targetRole = 'frontend-developer' }: DashboardProps) {
  return (
    <main className="container mx-auto px-4 py-8" role="main">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">SkillBridge Dashboard</h1>
        <p className="text-lg text-gray-600">
          Your AI-powered career development companion
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div data-testid="github-activity-enhanced">
            <GitHubActivityEnhanced username={username} />
          </div>
          
          <div data-testid="skill-gap-analysis-enhanced">
            <SkillGapAnalysisEnhanced 
              username={username} 
              targetRole={targetRole} 
            />
          </div>
        </div>
        
        <div className="space-y-6">
          <div data-testid="resume-review-enhanced">
            <ResumeReviewEnhanced />
          </div>
          
          <div data-testid="learning-roadmap-enhanced">
            <LearningRoadmapEnhanced targetRole={targetRole} />
          </div>
        </div>
      </div>
    </main>
  );
}