import React, { createContext, useContext, useState } from 'react';
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

interface UserRole {
  id: string;
  name: string;
  level: string;
}

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [currentView, setCurrentView] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [currentRole, setCurrentRole] = useState<UserRole>({
    id: '1',
    name: 'Frontend Developer',
    level: 'Mid-level'
  });

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const roles: UserRole[] = [
    { id: '1', name: 'Frontend Developer', level: 'Mid-level' },
    { id: '2', name: 'Full Stack Developer', level: 'Senior' },
    { id: '3', name: 'Data Scientist', level: 'Junior' },
    { id: '4', name: 'DevOps Engineer', level: 'Mid-level' }
  ];

  const renderCurrentView = () => {
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

  // Show profile setup if user hasn't completed onboarding
  if (!user && currentView === 'dashboard') {
    return (
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        <AppContext.Provider value={{ currentView, setCurrentView, user, setUser }}>
          <div className={`min-h-screen transition-colors duration-300 ${
            theme === 'dark' 
              ? 'bg-gray-900 text-white' 
              : 'bg-gray-50 text-gray-900'
          }`}>
            <ProfileSetup />
          </div>
        </AppContext.Provider>
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <AppContext.Provider value={{ currentView, setCurrentView, user, setUser }}>
        <div className={`min-h-screen transition-colors duration-300 ${
          theme === 'dark' 
            ? 'bg-gray-900 text-white' 
            : 'bg-gray-50 text-gray-900'
        }`}>
          <Navbar 
            currentRole={currentRole}
            roles={roles}
            onRoleChange={setCurrentRole}
            currentView={currentView}
            onViewChange={setCurrentView}
          />
          
          <main className="container mx-auto px-4 py-8 max-w-7xl">
            {renderCurrentView()}
          </main>
        </div>
      </AppContext.Provider>
    </ThemeContext.Provider>
  );
}