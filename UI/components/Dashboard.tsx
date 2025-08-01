import React from 'react';
import { GitHubActivity } from './GitHubActivity';
import { ResumeReview } from './ResumeReview';
import { SkillGapAnalysis } from './SkillGapAnalysis';
import { LearningRoadmap } from './LearningRoadmap';
import { JobMarketInsights } from './JobMarketInsights';
import { useTheme } from '../App';

export function Dashboard() {
  const { theme } = useTheme();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Welcome to SkillBridge</h1>
        <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          Your AI-powered career development companion
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <GitHubActivity />
          <SkillGapAnalysis />
          <JobMarketInsights />
        </div>
        
        <div className="space-y-6">
          <ResumeReview />
          <LearningRoadmap />
        </div>
      </div>
    </div>
  );
}