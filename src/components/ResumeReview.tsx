import React, { useState } from 'react';
import { FileText, CheckCircle, AlertCircle, XCircle, ChevronDown, ChevronUp, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

interface ResumeScore {
  overall: number;
  sections: {
    name: string;
    score: number;
    status: 'good' | 'warning' | 'error';
  }[];
}

interface Suggestion {
  type: 'good' | 'warning' | 'error';
  title: string;
  description: string;
}

export function ResumeReview() {
  const [isExpanded, setIsExpanded] = useState(true);

  // Data binding: These will be populated by MCP server calls
  const resumeScore: ResumeScore = {
    overall: 78,
    sections: [
      { name: 'Contact Information', score: 95, status: 'good' },
      { name: 'Professional Summary', score: 85, status: 'good' },
      { name: 'Work Experience', score: 75, status: 'warning' },
      { name: 'Skills', score: 60, status: 'warning' },
      { name: 'Education', score: 90, status: 'good' },
      { name: 'Projects', score: 45, status: 'error' },
    ]
  };

  const suggestions: Suggestion[] = [
    {
      type: 'good',
      title: 'Strong Technical Skills Section',
      description: 'Your technical skills are well-organized and relevant to your target role.'
    },
    {
      type: 'warning',
      title: 'Add Quantifiable Achievements',
      description: 'Include specific metrics in your work experience (e.g., "Improved performance by 40%").'
    },
    {
      type: 'warning',
      title: 'Skills Section Needs Update',
      description: 'Consider adding trending technologies like React 18, TypeScript 5.0, or Docker.'
    },
    {
      type: 'error',
      title: 'Missing Project Details',
      description: 'Your projects section lacks technical details and impact metrics.'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <Card className="transition-colors duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <CardTitle className="text-lg">Resume Review</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Overall Score */}
          <div className={`p-4 rounded-lg border-l-4 ${
            resumeScore.overall >= 80 
              ? 'border-green-500 bg-green-50' 
              : resumeScore.overall >= 60 
                ? 'border-yellow-500 bg-yellow-50'
                : 'border-red-500 bg-red-50'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg">Overall Score</h3>
                <p className="text-sm text-muted-foreground">
                  Based on AI analysis of your resume
                </p>
              </div>
              <div className={`text-3xl font-bold ${getScoreColor(resumeScore.overall)}`}>
                {resumeScore.overall}%
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-2 mt-3">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${resumeScore.overall}%` }}
              />
            </div>
          </div>

          {/* Section Breakdown */}
          <div>
            <h4 className="text-sm mb-3">Section Analysis</h4>
            <div className="space-y-2">
              {resumeScore.sections.map((section) => (
                <div key={section.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(section.status)}
                    <span className="text-sm">{section.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${getScoreColor(section.score)}`}>
                      {section.score}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Suggestions */}
          <div>
            <h4 className="text-sm mb-3">AI Recommendations</h4>
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <div key={index} className={`p-3 rounded-lg border-l-4 ${
                  suggestion.type === 'good' 
                    ? 'border-green-500 bg-green-50'
                    : suggestion.type === 'warning'
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-red-500 bg-red-50'
                }`}>
                  <div className="flex items-start space-x-3">
                    {getStatusIcon(suggestion.type)}
                    <div className="flex-1">
                      <h5 className="text-sm font-medium">{suggestion.title}</h5>
                      <p className="text-xs mt-1 text-muted-foreground">
                        {suggestion.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upload New Resume */}
          <div className="p-4 border-2 border-dashed border-muted rounded-lg text-center">
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm mb-2">Upload updated resume for re-analysis</p>
            <Button variant="outline" size="sm">
              Choose File
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}