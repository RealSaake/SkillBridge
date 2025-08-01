import React, { useState, useCallback } from 'react';
import { FileText, CheckCircle, AlertCircle, XCircle, ChevronDown, ChevronUp, Upload, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { usePersonalizedResumeAnalysis } from '../hooks/usePersonalizedMCP';

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
  const [resumeContent, setResumeContent] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Live MCP integration for resume analysis
  const { 
    data: analysisData, 
    loading: analysisLoading, 
    error: analysisError,
    refetch: refetchAnalysis 
  } = usePersonalizedResumeAnalysis(resumeContent);

  // Handle file upload and text extraction
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);

    try {
      const text = await extractTextFromFile(file);
      setResumeContent(text);
    } catch (error) {
      console.error('Error extracting text from file:', error);
    }
  }, []);

  // Extract text from uploaded file
  const extractTextFromFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const text = e.target?.result as string;
        resolve(text);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      // For now, we'll handle text files. In production, you'd want PDF parsing
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        reader.readAsText(file);
      } else {
        // For other file types, we'll use a placeholder
        resolve(`Resume content from ${file.name} - File parsing would be implemented here`);
      }
    });
  };

  // Parse MCP response or use fallback data
  const resumeScore: ResumeScore = analysisData?.score || {
    overall: 0,
    sections: []
  };

  const suggestions: Suggestion[] = analysisData?.suggestions || [];

  // Show upload prompt if no resume is uploaded
  const showUploadPrompt = !resumeContent && !analysisLoading;

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
          {/* Loading State */}
          {analysisLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mr-3" />
              <div className="text-center">
                <p className="text-sm font-medium">Analyzing your resume...</p>
                <p className="text-xs text-muted-foreground mt-1">This may take a few moments</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {analysisError && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <h4 className="text-sm font-medium text-destructive">Analysis Failed</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{analysisError}</p>
              <Button size="sm" variant="outline" onClick={refetchAnalysis}>
                Try Again
              </Button>
            </div>
          )}

          {/* Upload Prompt */}
          {showUploadPrompt && (
            <div className="text-center py-12">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Upload Your Resume</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Get AI-powered feedback and improvement suggestions
              </p>
              <div className="relative">
                <input
                  type="file"
                  accept=".txt,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button>
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </Button>
              </div>
            </div>
          )}

          {/* Analysis Results */}
          {!analysisLoading && !analysisError && resumeContent && (
            <>
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
              {resumeScore.sections.length > 0 && (
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
              )}

              {/* AI Suggestions */}
              {suggestions.length > 0 && (
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
              )}

              {/* Upload New Resume */}
              <div className="p-4 border-2 border-dashed border-muted rounded-lg text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm mb-2">
                  {uploadedFile ? `Current: ${uploadedFile.name}` : 'Upload updated resume for re-analysis'}
                </p>
                <div className="relative">
                  <input
                    type="file"
                    accept=".txt,.pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button variant="outline" size="sm">
                    Choose File
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}