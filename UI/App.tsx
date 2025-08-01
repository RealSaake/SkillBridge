import React, { createContext, useContext, useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { ProfileSetup } from './components/ProfileSetup';
import { ResumeEnhancer } from './components/ResumeEnhancer';
import { SkillGapDeepDive } from './components/SkillGapDeepDive';
import { CareerCoachChat } from './components/CareerCoachChat';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface AppContextType {
  currentView: string;
  setCurrentView: (view: string) => void;
  user: any;
  setUser: (user: any) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};



export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [currentView, setCurrentView] = useState('landing');
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleGetStarted = () => {
    setCurrentView('profile-setup');
  };

  const handleSignIn = () => {
    // Simulate sign in process
    setIsAuthenticated(true);
    setUser({ name: 'John Doe', email: 'john.doe@example.com' });
    setCurrentView('dashboard');
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    setUser(null);
    setCurrentView('landing');
  };

  const renderCurrentView = () => {
    if (currentView === 'landing') {
      return <LandingPage onGetStarted={handleGetStarted} onSignIn={handleSignIn} />;
    }
    
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'profile-setup':
        return <ProfileSetup />;
      case 'resume-enhancer':
        return <ResumeEnhancer />;
      case 'skill-gap-deep-dive':
        return <SkillGapDeepDive />;
      case 'career-coach':
        return <CareerCoachChat />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <AppContext.Provider value={{ currentView, setCurrentView, user, setUser }}>
        <div className={`${theme === 'dark' ? 'dark' : ''}`}>
          {currentView === 'landing' ? (
            renderCurrentView()
          ) : (
            <div className="min-h-screen bg-background text-foreground">
              <Navbar 
                currentView={currentView}
                onViewChange={setCurrentView}
                onSignOut={handleSignOut}
              />
              
              <main className="container mx-auto px-4 py-8 max-w-7xl">
                {renderCurrentView()}
              </main>
            </div>
          )}
        </div>
      </AppContext.Provider>
    </ThemeContext.Provider>
  );
}