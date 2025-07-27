import React, { useState } from 'react';
import { FileText, Download, Zap, CheckCircle, AlertTriangle, XCircle, Eye, ArrowRight, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { useTheme, useApp } from '../App';

interface ImprovementSuggestion {
  id: string;
  section: string;
  type: 'critical' | 'important' | 'minor';
  title: string;
  description: string;
  before: string;
  after: string;
  applied: boolean;
  reasoning: string;
}

interface ResumeSection {
  name: string;
  score: number;
  improvements: number;
  status: 'good' | 'needs-work' | 'critical';
}

export function ResumeEnhancer() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isGenerating, setIsGenerating] = useState(false);
  const { theme } = useTheme();
  const { setCurrentView } = useApp();

  // Data binding: This will be populated by MCP server
  const resumeScore = 78;
  const totalSuggestions = 8;
  const appliedSuggestions = 3;

  const sections: ResumeSection[] = [
    // Data binding: will be populated by MCP server
    {
      name: "Professional Summary",
      score: 85,
      improvements: 2,
      status: "good"
    },
    {
      name: "Work Experience", 
      score: 75,
      improvements: 3,
      status: "needs-work"
    },
    {
      name: "Technical Skills",
      score: 80, 
      improvements: 1,
      status: "good"
    },
    {
      name: "Projects",
      score: 60,
      improvements: 2,
      status: "critical"
    }
  ];

  const suggestions: ImprovementSuggestion[] = [
    // Data binding: will be populated by MCP server
    {
      id: "1",
      section: "Work Experience",
      type: "critical",
      title: "Add quantifiable achievements",
      description: "Include specific metrics and numbers to demonstrate impact",
      before: "Improved application performance",
      after: "Improved application performance by 40%, reducing load time from 3.2s to 1.9s",
      applied: false,
      reasoning: "Quantifiable results demonstrate concrete value and are highly valued by recruiters"
    },
    {
      id: "2", 
      section: "Technical Skills",
      type: "important",
      title: "Update technology stack",
      description: "Add current technologies that align with your target role",
      before: "JavaScript, HTML, CSS",
      after: "JavaScript (ES6+), TypeScript, React, Node.js, HTML5, CSS3, Tailwind CSS",
      applied: false,
      reasoning: "Modern tech stack shows you're current with industry standards"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'needs-work':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'critical':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'important':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'minor':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const handleApplyImprovement = (suggestionId: string) => {
    // This will trigger MCP server call to apply the improvement
    console.log('Applying improvement:', suggestionId);
  };

  const handleGenerateEnhanced = async () => {
    setIsGenerating(true);
    // MCP server call to generate enhanced resume
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Resume Enhancer</h1>
          <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            AI-powered resume optimization for better job matching
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => setCurrentView('dashboard')}>
            <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
            Back to Dashboard
          </Button>
          <Button onClick={handleGenerateEnhanced} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Generate Enhanced Resume
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overview Stats */}
        <Card className={`lg:col-span-1 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Resume Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Score */}
            <div className="text-center">
              <div className={`text-4xl mb-2 ${
                resumeScore >= 80 ? 'text-green-500' : 
                resumeScore >= 60 ? 'text-yellow-500' : 'text-red-500'
              }`}>
                {resumeScore}%
              </div>
              <p className="text-sm">Overall Score</p>
              <Progress value={resumeScore} className="h-2 mt-2" />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-3 rounded-lg text-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="text-2xl">{totalSuggestions}</div>
                <div className="text-xs">Suggestions</div>
              </div>
              <div className={`p-3 rounded-lg text-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="text-2xl text-green-500">{appliedSuggestions}</div>
                <div className="text-xs">Applied</div>
              </div>
            </div>

            {/* Section Breakdown */}
            <div>
              <h4 className="text-sm mb-3">Section Analysis</h4>
              <div className="space-y-3">
                {sections.map((section) => (
                  <div key={section.name} className={`p-3 rounded-lg ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(section.status)}
                        <span className="text-sm">{section.name}</span>
                      </div>
                      <span className="text-sm">{section.score}%</span>
                    </div>
                    {section.improvements > 0 && (
                      <div className="flex items-center space-x-1">
                        <Lightbulb className="w-3 h-3 text-yellow-500" />
                        <span className="text-xs">{section.improvements} improvements available</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full">
                <Eye className="w-4 h-4 mr-2" />
                Preview Current Resume
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Download Original
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Card className={`lg:col-span-2 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardContent className="p-0">
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
              <div className="p-6 pb-0">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="suggestions">AI Suggestions</TabsTrigger>
                  <TabsTrigger value="before-after">Before & After</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="suggestions" className="p-6 pt-4">
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {suggestions.map((suggestion) => (
                      <Card key={suggestion.id} className={`border ${
                        theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
                      }`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <Badge className={`text-xs ${getTypeColor(suggestion.type)}`}>
                                  {suggestion.type}
                                </Badge>
                                <span className="text-sm text-gray-500">{suggestion.section}</span>
                              </div>
                              <h4 className="text-sm">{suggestion.title}</h4>
                              <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                {suggestion.description}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleApplyImprovement(suggestion.id)}
                              disabled={suggestion.applied}
                            >
                              {suggestion.applied ? 'Applied' : 'Apply'}
                            </Button>
                          </div>

                          {/* Before/After Preview */}
                          <div className="space-y-3">
                            <div className={`p-3 rounded border-l-4 border-red-500 ${
                              theme === 'dark' ? 'bg-red-900/10' : 'bg-red-50'
                            }`}>
                              <p className="text-xs text-red-600 dark:text-red-400 mb-1">Before:</p>
                              <p className="text-sm">{suggestion.before}</p>
                            </div>
                            
                            <div className={`p-3 rounded border-l-4 border-green-500 ${
                              theme === 'dark' ? 'bg-green-900/10' : 'bg-green-50'
                            }`}>
                              <p className="text-xs text-green-600 dark:text-green-400 mb-1">After:</p>
                              <p className="text-sm">{suggestion.after}</p>
                            </div>
                          </div>

                          {/* AI Reasoning */}
                          <div className={`mt-3 p-3 rounded-lg ${
                            theme === 'dark' ? 'bg-blue-900/10' : 'bg-blue-50'
                          }`}>
                            <div className="flex items-start space-x-2">
                              <Lightbulb className="w-4 h-4 text-blue-500 mt-0.5" />
                              <div>
                                <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">AI Insight:</p>
                                <p className="text-xs">{suggestion.reasoning}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {/* Empty State */}
                    <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      <Lightbulb className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">All suggestions applied!</p>
                      <p className="text-xs">Your resume is optimized for your target role.</p>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="before-after" className="p-6 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[600px]">
                  {/* Before */}
                  <Card className={`${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center space-x-2">
                        <span>Original Resume</span>
                        <Badge variant="destructive" className="text-xs">Score: 65%</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[500px]">
                        <div className="space-y-4 text-sm">
                          {/* Mock resume content - this will be actual resume data */}
                          <div className={`p-3 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <h4 className="text-sm mb-2">Professional Summary</h4>
                            <p className="text-xs">Frontend developer with experience in React and JavaScript.</p>
                          </div>
                          
                          <div className={`p-3 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <h4 className="text-sm mb-2">Work Experience</h4>
                            <p className="text-xs">Worked on web applications using modern frameworks.</p>
                          </div>

                          <div className={`p-3 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <h4 className="text-sm mb-2">Technical Skills</h4>
                            <p className="text-xs">JavaScript, HTML, CSS, React</p>
                          </div>
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {/* After */}
                  <Card className={`${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center space-x-2">
                        <span>Enhanced Resume</span>
                        <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                          Score: 87%
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[500px]">
                        <div className="space-y-4 text-sm">
                          {/* Enhanced resume content */}
                          <div className={`p-3 rounded border-l-4 border-green-500 ${
                            theme === 'dark' ? 'bg-green-900/10' : 'bg-green-50'
                          }`}>
                            <h4 className="text-sm mb-2">Professional Summary</h4>
                            <p className="text-xs">Results-driven Frontend Developer with 3+ years of experience building responsive web applications using React, TypeScript, and modern JavaScript. Delivered 15+ projects with 40% performance improvements.</p>
                          </div>
                          
                          <div className={`p-3 rounded border-l-4 border-green-500 ${
                            theme === 'dark' ? 'bg-green-900/10' : 'bg-green-50'
                          }`}>
                            <h4 className="text-sm mb-2">Work Experience</h4>
                            <p className="text-xs">Frontend Developer at TechCorp (2021-2024): Led development of 3 major web applications serving 10k+ users, improved app performance by 40%, mentored 2 junior developers.</p>
                          </div>

                          <div className={`p-3 rounded border-l-4 border-green-500 ${
                            theme === 'dark' ? 'bg-green-900/10' : 'bg-green-50'
                          }`}>
                            <h4 className="text-sm mb-2">Technical Skills</h4>
                            <p className="text-xs">JavaScript (ES6+), TypeScript, React, Next.js, Node.js, HTML5, CSS3, Tailwind CSS, Git, Docker, AWS</p>
                          </div>
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-center mt-4">
                  <Button size="lg">
                    <Download className="w-4 h-4 mr-2" />
                    Download Enhanced Resume
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}