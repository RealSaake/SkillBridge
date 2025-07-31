import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

export const DevLanding = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-white">SB</span>
          </div>
          <CardTitle className="text-3xl font-bold">SkillBridge Development</CardTitle>
          <p className="text-gray-600 mt-2">
            Development mode - test the platform without authentication
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/dev-dashboard">
              <Button className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                <span className="text-lg font-semibold">🚀 Dashboard</span>
                <span className="text-sm opacity-80">Test the main dashboard</span>
              </Button>
            </Link>
            
            <Link to="/login">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                <span className="text-lg font-semibold">🔐 Login Flow</span>
                <span className="text-sm opacity-80">Test authentication</span>
              </Button>
            </Link>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">✅ What's Working:</h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• All 4 MCP servers are running</li>
              <li>• GitHub API integration</li>
              <li>• Resume tips and analysis</li>
              <li>• Career roadmaps</li>
              <li>• Portfolio analysis</li>
              <li>• Frontend components</li>
            </ul>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Development Notes:</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• GitHub OAuth requires deployment for full testing</li>
              <li>• Backend API needs database setup for persistence</li>
              <li>• Using mock user data in development mode</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};