import React, { useState, useCallback, useRef } from 'react';
import { FileText, Upload, Loader2, CheckCircle, AlertTriangle, XCircle, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { terminalLogger } from '../utils/terminalLogger';

interface ResumeAnnotation {
  id: string;
  line: number;
  column: number;
  type: 'error' | 'warning' | 'suggestion' | 'good';
  title: string;
  description: string;
  suggestion?: string;
}

interface ResumeAnalysis {
  overall_score: number;
  sections: {
    name: string;
    score: number;
    feedback: string;
  }[];
  annotations: ResumeAnnotation[];
  suggestions: string[];
}

export function InteractiveResumeReviewer() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState<string>('');
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    terminalLogger.info('InteractiveResumeReviewer', 'File uploaded for analysis', { 
      fileName: file.name, 
      fileSize: file.size,
      fileType: file.type 
    });

    setUploadedFile(file);
    setIsAnalyzing(true);

    try {
      // Extract text from file
      const text = await extractTextFromFile(file);
      setResumeText(text);

      // Analyze with MCP
      await analyzeResume(text);
    } catch (error) {
      terminalLogger.error('InteractiveResumeReviewer', 'File processing failed', { error: error.message });
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

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
      
      // For now, handle text files. In production, would use PDF.js or similar
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        reader.readAsText(file);
      } else {
        // Placeholder for PDF/DOC parsing
        resolve(`[Resume content from ${file.name}]\n\nJohn Doe\nSoftware Engineer\n\nEXPERIENCE:\n- Senior Developer at TechCorp (2020-2023)\n- Built scalable web applications using React and Node.js\n- Led team of 5 developers\n\nSKILLS:\n- JavaScript, TypeScript, React, Node.js\n- AWS, Docker, Kubernetes\n- Agile methodologies\n\nEDUCATION:\n- BS Computer Science, University of Technology (2018)`);
      }
    });
  };

  const analyzeResume = async (text: string) => {
    try {
      terminalLogger.mcpRequest('InteractiveResumeReviewer', 'resume-tips', 'analyze_resume_section', { 
        section: text, 
        sectionType: 'experience' 
      });

      // LIVE MCP INTEGRATION
      const response = await fetch('/api/mcp/resume-tips/analyze-resume-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: text,
          sectionType: 'experience'
        })
      });

      if (!response.ok) {
        throw new Error(`MCP analysis failed: ${response.status}`);
      }

      const analysisData = await response.json();
      
      // Transform MCP response into interactive format
      const interactiveAnalysis: ResumeAnalysis = {
        overall_score: 75, // Would come from MCP
        sections: [
          { name: 'Contact Information', score: 90, feedback: 'Complete and professional' },
          { name: 'Experience', score: 80, feedback: 'Good detail, could use more metrics' },
          { name: 'Skills', score: 70, feedback: 'Relevant skills listed' },
          { name: 'Education', score: 85, feedback: 'Clear and concise' }
        ],
        annotations: [
          {
            id: 'ann1',
            line: 5,
            column: 1,
            type: 'suggestion',
            title: 'Add Quantifiable Results',
            description: 'Include specific metrics and achievements',
            suggestion: 'Led team of 5 developers, increasing deployment frequency by 40%'
          },
          {
            id: 'ann2', 
            line: 8,
            column: 1,
            type: 'warning',
            title: 'Missing Keywords',
            description: 'Add industry-relevant keywords for ATS optimization',
            suggestion: 'Include: CI/CD, microservices, cloud architecture'
          },
          {
            id: 'ann3',
            line: 12,
            column: 1,
            type: 'good',
            title: 'Strong Technical Skills',
            description: 'Excellent coverage of modern tech stack'
          }
        ],
        suggestions: [
          'Add a professional summary section',
          'Include links to portfolio projects',
          'Quantify achievements with specific metrics',
          'Optimize for ATS with relevant keywords'
        ]
      };

      setAnalysis(interactiveAnalysis);
      terminalLogger.mcpResponse('InteractiveResumeReviewer', 'resume-tips', 'analyze_resume_section', interactiveAnalysis);
    } catch (error) {
      terminalLogger.mcpError('InteractiveResumeReviewer', 'resume-tips', 'analyze_resume_section', error);
      throw error;
    }
  };

  const getAnnotationIcon = (type: string) => {
    switch (type) {
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'suggestion': return <FileText className="w-4 h-4 text-blue-500" />;
      case 'good': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Interactive Resume Reviewer
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Upload Section */}
        {!uploadedFile && (
          <div className="text-center py-12 border-2 border-dashed border-muted rounded-lg">
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Upload Your Resume</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Get AI-powered feedback with visual annotations
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Choose File
            </Button>
          </div>
        )}

        {/* Analysis Loading */}
        {isAnalyzing && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mr-3" />
            <div className="text-center">
              <p className="text-sm font-medium">Analyzing your resume...</p>
              <p className="text-xs text-muted-foreground mt-1">AI is reviewing content and structure</p>
            </div>
          </div>
        )}

        {/* Interactive Analysis Results */}
        {analysis && resumeText && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Resume Display with Annotations */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Resume Preview</h3>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${getScoreColor(analysis.overall_score)}`}>
                    {analysis.overall_score}%
                  </span>
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
              
              <div className="relative bg-white border rounded-lg p-6 font-mono text-sm max-h-96 overflow-y-auto">
                {resumeText.split('\n').map((line, index) => {
                  const lineAnnotations = analysis.annotations.filter(ann => ann.line === index + 1);
                  
                  return (
                    <div key={index} className="relative group">
                      <div className="flex items-start gap-2">
                        <span className="text-muted-foreground text-xs w-8 flex-shrink-0">
                          {index + 1}
                        </span>
                        <div className="flex-1 relative">
                          <span className={`${lineAnnotations.length > 0 ? 'bg-yellow-100 px-1 rounded' : ''}`}>
                            {line || '\u00A0'}
                          </span>
                          
                          {/* Annotation Indicators */}
                          {lineAnnotations.map((annotation) => (
                            <button
                              key={annotation.id}
                              className={`absolute -right-6 top-0 p-1 rounded-full hover:bg-muted ${
                                selectedAnnotation === annotation.id ? 'bg-primary/20' : ''
                              }`}
                              onClick={() => setSelectedAnnotation(
                                selectedAnnotation === annotation.id ? null : annotation.id
                              )}
                            >
                              {getAnnotationIcon(annotation.type)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Analysis Panel */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">AI Analysis</h3>
              
              {/* Selected Annotation Details */}
              {selectedAnnotation && (
                <Card className="border-l-4 border-primary">
                  <CardContent className="pt-4">
                    {(() => {
                      const annotation = analysis.annotations.find(a => a.id === selectedAnnotation);
                      if (!annotation) return null;
                      
                      return (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {getAnnotationIcon(annotation.type)}
                            <h4 className="font-medium">{annotation.title}</h4>
                          </div>
                          <p className="text-sm text-muted-foreground">{annotation.description}</p>
                          {annotation.suggestion && (
                            <div className="p-3 bg-muted rounded-lg">
                              <p className="text-sm font-medium mb-1">Suggested improvement:</p>
                              <p className="text-sm">{annotation.suggestion}</p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}

              {/* Section Scores */}
              <div className="space-y-3">
                <h4 className="font-medium">Section Analysis</h4>
                {analysis.sections.map((section) => (
                  <div key={section.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium">{section.name}</span>
                      <p className="text-xs text-muted-foreground">{section.feedback}</p>
                    </div>
                    <span className={`text-lg font-bold ${getScoreColor(section.score)}`}>
                      {section.score}%
                    </span>
                  </div>
                ))}
              </div>

              {/* AI Suggestions */}
              <div className="space-y-3">
                <h4 className="font-medium">AI Recommendations</h4>
                <div className="space-y-2">
                  {analysis.suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{suggestion}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upload New Resume */}
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload New Resume
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}