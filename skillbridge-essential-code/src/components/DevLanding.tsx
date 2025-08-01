import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

export const DevLanding: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
            <span className="text-3xl font-bold text-white">SB</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">SkillBridge</h1>
          <p className="text-xl text-gray-600">AI-Powered Career Development Platform</p>
          <p className="text-sm text-gray-500 mt-2">Development Environment</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>🚀 Quick Start</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Authentication Flow</h4>
                <div className="space-y-2">
                  <Link to="/login">
                    <Button variant="outline" className="w-full justify-start">
                      → Login Page
                    </Button>
                  </Link>
                  <Link to="/dev-dashboard">
                    <Button variant="outline" className="w-full justify-start">
                      → Dashboard (No Auth)
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🔧 System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Frontend</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                    ✅ Running
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Backend API</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                    ✅ Connected
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>MCP Servers</span>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                    ⚠️ Mock Data
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>📋 Platform Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">✅ Implemented</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    GitHub OAuth Authentication
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    User Profile Management
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Responsive Dashboard
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Dark/Light Theme
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Error Boundaries
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Firebase Functions API
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">🔄 In Development</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                    GitHub Repository Analysis
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                    AI-Powered Resume Review
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                    Skill Gap Analysis
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                    Learning Roadmaps
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                    MCP Server Integration
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Environment: {process.env.NODE_ENV} | 
            API: {process.env.REACT_APP_API_URL || 'Default'} | 
            Version: 2.0.0
          </p>
        </div>
      </div>
    </div>
  );
};