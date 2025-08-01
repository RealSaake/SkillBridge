import React, { useState } from 'react';
import { User, Settings, Moon, Sun, BarChart3, FileText, Target, MessageSquare, Home, LogOut, UserCircle, Bell, Sparkles, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import { useTheme } from '../App';

interface NavbarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onSignOut?: () => void;
}

export function Navbar({ currentView, onViewChange, onSignOut }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const [notifications] = useState(3); // Mock notification count

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'resume-enhancer', label: 'Resume', icon: FileText },
    { id: 'skill-gap-deep-dive', label: 'Skills', icon: Target },
    { id: 'career-coach', label: 'Coach', icon: MessageSquare }
  ];

  const userMenuItems = [
    { 
      id: 'profile', 
      label: 'My Profile', 
      icon: UserCircle,
      onClick: () => onViewChange('profile-setup')
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Settings,
      onClick: () => console.log('Settings clicked')
    },
    { 
      id: 'notifications', 
      label: 'Notifications', 
      icon: Bell,
      onClick: () => console.log('Notifications clicked'),
      badge: notifications > 0 ? notifications.toString() : undefined
    }
  ];

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-6">
            <button
              onClick={() => onViewChange('dashboard')}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold">SkillBridge</h1>
                <p className="text-xs text-muted-foreground">AI Career Assistant</p>
              </div>
            </button>

            {/* Navigation Items */}
            <div className="hidden lg:flex items-center space-x-1">
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
                    <span>{item.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          <div className="lg:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Menu
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem 
                      key={item.id}
                      onClick={() => onViewChange(item.id)}
                      className="flex items-center space-x-2"
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right Side - Theme Toggle, Notifications, and User Menu */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <div className="hidden sm:flex items-center space-x-2">
              <Sun className="w-4 h-4" />
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
                aria-label="Toggle dark mode"
              />
              <Moon className="w-4 h-4" />
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-4 h-4" />
              {notifications > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs"
                  variant="destructive"
                >
                  {notifications}
                </Badge>
              )}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 p-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="/placeholder-avatar.jpg" />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                      JD
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-medium">John Doe</span>
                    <span className="text-xs text-muted-foreground">Frontend Developer</span>
                  </div>
                  <ChevronDown className="w-4 h-4 hidden md:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col">
                  <span>John Doe</span>
                  <span className="font-normal text-muted-foreground">john.doe@example.com</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {userMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem 
                      key={item.id}
                      onClick={item.onClick}
                      className="flex items-center space-x-2"
                    >
                      <Icon className="w-4 h-4" />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </DropdownMenuItem>
                  );
                })}
                
                <DropdownMenuSeparator />
                
                {/* Theme toggle for mobile */}
                <DropdownMenuItem 
                  onClick={toggleTheme}
                  className="flex items-center space-x-2 md:hidden"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  <span>Toggle {theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={onSignOut}
                  className="flex items-center space-x-2 text-destructive focus:text-destructive"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}