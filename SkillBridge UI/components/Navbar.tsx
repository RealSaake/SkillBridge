import React from 'react';
import { User, Settings, Moon, Sun, BarChart3, FileText, Target, MessageSquare, Home } from 'lucide-react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { useTheme } from '../App';

interface UserRole {
  id: string;
  name: string;
  level: string;
}

interface NavbarProps {
  currentRole: UserRole;
  roles: UserRole[];
  onRoleChange: (role: UserRole) => void;
  currentView: string;
  onViewChange: (view: string) => void;
}

export function Navbar({ currentRole, roles, onRoleChange, currentView, onViewChange }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'resume-enhancer', label: 'Resume', icon: FileText },
    { id: 'skill-gap-deep-dive', label: 'Skills', icon: Target },
    { id: 'career-coach', label: 'Coach', icon: MessageSquare }
  ];

  return (
    <nav className={`border-b transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                theme === 'dark' ? 'bg-blue-600' : 'bg-blue-500'
              }`}>
                <span className="text-white text-sm">SB</span>
              </div>
              <div>
                <h1 className="text-lg">SkillBridge</h1>
                <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  AI Career Assistant
                </p>
              </div>
            </div>

            {/* Navigation Items */}
            <div className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={currentView === item.id ? "default" : "ghost"}
                    size="sm"
                    onClick={() => onViewChange(item.id)}
                    className="flex items-center space-x-2"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden lg:inline">{item.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Center - Role Selector */}
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <Select
              value={currentRole.id}
              onValueChange={(value) => {
                const role = roles.find(r => r.id === value);
                if (role) onRoleChange(role);
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col items-start">
                      <span className="text-sm">{currentRole.name}</span>
                      <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {currentRole.level}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs ml-2">
                      78%
                    </Badge>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    <div className="flex flex-col items-start">
                      <span className="text-sm">{role.name}</span>
                      <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {role.level}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Right Side - Theme Toggle and User */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <div className="flex items-center space-x-2">
              <Sun className="w-4 h-4" />
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
                aria-label="Toggle dark mode"
              />
              <Moon className="w-4 h-4" />
            </div>

            {/* Settings */}
            <Button variant="ghost" size="icon" aria-label="Settings">
              <Settings className="w-4 h-4" />
            </Button>

            {/* User Avatar */}
            <Avatar className="w-8 h-8">
              <AvatarImage src="/placeholder-avatar.jpg" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </nav>
  );
}