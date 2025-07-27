import React, { createContext, useContext, useState } from 'react';
import { GitHubActivityEnhanced } from './components/GitHubActivityEnhanced';
import { ResumeReviewEnhanced } from './components/ResumeReviewEnhanced';
import { LearningRoadmapEnhanced } from './components/LearningRoadmapEnhanced';
import { SkillGapAnalysisEnhanced } from './components/SkillGapAnalysisEnhanced';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className={`min-h-screen transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-gray-900 text-white' 
          : 'bg-gray-50 text-gray-900'
      }`}>
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl mb-2">SkillBridge Dashboard</h1>
            <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Your AI-powered career development companion
            </p>
            <button
              onClick={toggleTheme}
              className="mt-4 px-4 py-2 rounded-md bg-primary text-primary-foreground"
            >
              Toggle {theme === 'light' ? 'Dark' : 'Light'} Mode
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <GitHubActivityEnhanced username="octocat" targetRole="fullstack" />
              <LearningRoadmapEnhanced targetRole="fullstack" currentSkills={['React', 'JavaScript']} />
            </div>
            
            <div className="space-y-6">
              <ResumeReviewEnhanced />
              <SkillGapAnalysisEnhanced username="octocat" targetRole="fullstack" />
            </div>
          </div>
        </div>
      </div>
    </ThemeContext.Provider>
  );
}

export default App;