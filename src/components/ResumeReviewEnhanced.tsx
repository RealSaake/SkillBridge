import React, { useState } from 'react';
import { FileText, CheckCircle, AlertCircle, XCircle, ChevronDown, ChevronUp, Upload, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { useTheme } from '../App';
import { useResumeAnalysis } from '../hooks/useMCP';

interface ResumeReviewEnhancedProps {
  resumeContent?: string;
  onUpload?: (file: File) => void;
}

export function ResumeReviewEnhanced({ 
  resumeContent,
  onUpload 
}: ResumeReviewEnhancedProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const { theme } = useTheme();
  
  // 🔌 Real MCP data hook
  const { 
    data: resumeData, 
    loading, 
    error, 
    refetch 
  } = useResumeAnalysis(resumeContent);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      onUpload?.(file);
      
      // Read file content for analysis
      const reader = new FileReader();
      reader.onload = (e) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const content = e.target?.result as string;
        // Trigger re-analysis with new content
        refetch();
      };
      reader.readAsText(file);
    }
  };

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

  const getOverallScoreMessage = (score: number) => {
    if (score >= 90) return 'Excellent! Your resume is highly optimized.';
    if (score >= 80) return 'Great! Your resume is well-structured with minor improvements needed.';
    if (score >= 70) return 'Good foundation with some areas for improvement.';
    if (score >= 60) return 'Decent start, but several areas need attention.';
    return 'Significant improvements needed to make your resume competitive.';
  };

  return (
    <Card className={`transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <CardTitle className="text-lg">Resume Review</CardTitle>
            {uploadedFile && (
              <Badge variant="secondary" className="text-xs">
                {uploadedFile.name}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={refetch}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span className="text-sm">Analyzing resume with AI...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Unable to analyze resume. Please try uploading again or check the file format.
                <Button variant="outline" size="sm" className="ml-2" onClick={refetch}>
                  Retry Analysis
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* No Resume State */}
          {!loading && !error && !resumeData && (
            <div className={`p-8 border-2 border-dashed rounded-lg text-center ${
              theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
            }`}>
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg mb-2">Upload Your Resume</h3>
              <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Get AI-powered analysis and personalized recommendations
              </p>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="resume-upload"
              />
              <label htmlFor="resume-upload">
                <Button variant="outline" className="cursor-pointer">
                  Choose Resume File
                </Button>
              </label>
              <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Supports PDF, DOC, DOCX, and TXT files
              </p>
            </div>
          )}

          {/* Content */}
          {!loading && !error && resumeData && (
            <>
              {/* Overall Score */}
              <div className={`p-4 rounded-lg border-l-4 ${
                resumeData.overall >= 80 
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                  : resumeData.overall >= 60 
                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                    : 'border-red-500 bg-red-50 dark:bg-red-900/20'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg">Overall Score</h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      {getOverallScoreMessage(resumeData.overall)}
                    </p>
                  </div>
                  <div className={`text-3xl font-bold ${getScoreColor(resumeData.overall)}`}>
                    {resumeData.overall}%
                  </div>
                </div>
                <Progress value={resumeData.overall} className="h-3" />
              </div>

              {/* Section Breakdown */}
              <div>
                <h4 className="text-sm mb-3">Section Analysis</h4>
                <div className="space-y-2">
                  {resumeData.sections.map((section) => (
                    <div key={section.name} className={`flex items-center justify-between p-3 rounded-lg ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(section.status)}
                        <span className="text-sm">{section.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${getScoreColor(section.score)}`}>
                          {section.score}%
                        </span>
                        <div className="w-16">
                          <Progress value={section.score} className="h-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Recommendations */}
              <div>
                <h4 className="text-sm mb-3">AI Recommendations</h4>
                <div className="space-y-3">
                  {resumeData.suggestions.map((suggestion, index) => (
                    <div key={index} className={`p-3 rounded-lg border-l-4 ${
                      suggestion.type === 'good' 
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/10'
                        : suggestion.type === 'warning'
                          ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10'
                          : 'border-red-500 bg-red-50 dark:bg-red-900/10'
                    }`}>
                      <div className="flex items-start space-x-3">
                        {getStatusIcon(suggestion.type)}
                        <div className="flex-1">
                          <h5 className="text-sm font-medium">{suggestion.title}</h5>
                          <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            {suggestion.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Items */}
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                <h4 className="text-sm mb-2">Next Steps</h4>
                <div className="space-y-2 text-sm">
                  {resumeData.overall < 80 && (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Focus on improving sections with scores below 70%</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Use the Resume Enhancer to auto-generate improved content</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Check skill gaps to identify missing technical skills</span>
                  </div>
                </div>
              </div>

              {/* Upload New Resume */}
              <div className={`p-4 border-2 border-dashed rounded-lg text-center ${
                theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
              }`}>
                <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                <p className="text-sm mb-2">Upload updated resume for re-analysis</p>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="resume-reupload"
                />
                <label htmlFor="resume-reupload">
                  <Button variant="outline" size="sm" className="cursor-pointer">
                    Choose New File
                  </Button>
                </label>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}