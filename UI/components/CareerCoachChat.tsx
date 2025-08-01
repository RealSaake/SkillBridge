import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, User, Bot, ArrowRight, Lightbulb, FileText, Target, Briefcase, Settings, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { useTheme, useApp } from '../App';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  attachments?: string[];
}

interface ChatTopic {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  description: string;
  starterQuestions: string[];
}

export function CareerCoachChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [explainMode, setExplainMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const { setCurrentView } = useApp();

  const chatTopics: ChatTopic[] = [
    {
      id: 'resume',
      title: 'Resume Review',
      icon: FileText,
      description: 'Get detailed feedback on your resume',
      starterQuestions: [
        'How can I improve my resume for a Frontend Developer role?',
        'What achievements should I highlight?',
        'How do I format my technical skills section?'
      ]
    },
    {
      id: 'skills',
      title: 'Skill Development',
      icon: Target,
      description: 'Plan your learning roadmap',
      starterQuestions: [
        'What skills should I focus on for career growth?',
        'How long will it take to learn React?',
        'What\'s the best way to learn TypeScript?'
      ]
    },
    {
      id: 'career',
      title: 'Career Planning',
      icon: Briefcase,
      description: 'Navigate your career path',
      starterQuestions: [
        'How do I transition from Frontend to Full Stack?',
        'When should I apply for senior roles?',
        'What companies hire remote developers?'
      ]
    },
    {
      id: 'interview',
      title: 'Interview Prep',
      icon: MessageSquare,
      description: 'Ace your next interview',
      starterQuestions: [
        'What questions should I expect for a React interview?',
        'How do I negotiate salary?',
        'What should I ask the interviewer?'
      ]
    },
    {
      id: 'learning',
      title: 'Learning Resources',
      icon: BookOpen,
      description: 'Find the best learning materials',
      starterQuestions: [
        'What are the best React courses?',
        'Should I learn Vue or React first?',
        'How to practice coding interviews?'
      ]
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize with welcome message
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: '1',
        type: 'ai',
        content: `Hello! I'm your AI Career Coach. I have access to your GitHub activity, resume analysis, and skill gap data to provide personalized career guidance.

What would you like to discuss today? You can ask me about:
• Resume improvements
• Skill development plans  
• Career transition advice
• Interview preparation
• Learning recommendations

How can I help you advance your career?`,
        timestamp: new Date(),
        suggestions: [
          'Analyze my current skill gaps',
          'Review my resume score',
          'Plan my learning roadmap',
          'Find relevant job opportunities'
        ]
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    setIsLoading(true);

    // Simulate AI response with MCP server call
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: generateAIResponse(inputValue),
        timestamp: new Date(),
        suggestions: generateSuggestions(inputValue)
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
      setIsLoading(false);
    }, 2000);
  };

  const generateAIResponse = (input: string): string => {
    // This will be replaced with actual MCP server calls
    const responses = {
      resume: `Based on your resume analysis (current score: 78%), here are my recommendations:

**Immediate Improvements:**
• Add quantifiable achievements to your work experience
• Update your technical skills section with modern frameworks
• Include 2-3 recent projects with impact metrics

**Priority Areas:**
• Your "Projects" section needs the most work
• Consider adding TypeScript and React expertise to align with market demands

Would you like me to help you rewrite specific sections?`,
      
      skills: `Looking at your GitHub activity and skill gaps, here's my analysis:

**Current Strengths:**
• JavaScript and React - showing consistent activity
• Frontend development skills - above market average

**Focus Areas for Growth:**
• TypeScript and Docker - high impact on salary potential
• Next.js and AWS - growing market demand

**Recommended Learning Path:**
1. TypeScript fundamentals (4-6 weeks)
2. Docker containerization (6-8 weeks)  
3. AWS cloud services (8-10 weeks)

This roadmap could increase your market value by 25-30%.`,
      
      career: `Based on your profile and market data, here's your career progression strategy:

**Current Position:**
• Mid-level Frontend Developer
• Skill match: 75%
• Market readiness: Good

**Next Steps:**
• Target companies: Tech startups, FAANG companies
• Salary range: $80k-$120k
• Timeline to senior role: 12-18 months

**Action Items:**
1. Complete TypeScript certification
2. Build 2-3 advanced React projects
3. Contribute to open source projects`,
      
      default: `I understand you're asking about "${input}". Let me provide personalized guidance based on your profile:

**Current Context:**
• GitHub activity: 45 commits this month
• Resume score: 78%
• Skill development focus: Frontend Technologies

**My Recommendation:**
Focus on strengthening your TypeScript skills and building more complex projects to showcase your abilities.

**Next Steps:**
1. Complete a full-stack project using your current skills
2. Learn one new technology that's trending in your target role
3. Update your resume with quantifiable achievements

Would you like me to dive deeper into any specific area?`
    };

    // Simple keyword matching for demo - real implementation will use MCP
    if (input.toLowerCase().includes('resume')) return responses.resume;
    if (input.toLowerCase().includes('skill')) return responses.skills;
    if (input.toLowerCase().includes('career')) return responses.career;
    return responses.default;
  };

  const generateSuggestions = (input: string): string[] => {
    return [
      'Show me specific examples',
      'Create an action plan',
      'Find relevant resources',
      'Compare to market data'
    ];
  };

  const handleTopicSelect = (topic: ChatTopic) => {
    setSelectedTopic(topic.id);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Career Coach</h1>
          <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            AI-powered career guidance personalized for your profile
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Label htmlFor="explain-mode" className="text-sm">Explain mode</Label>
            <Switch 
              id="explain-mode"
              checked={explainMode} 
              onCheckedChange={setExplainMode}
            />
          </div>
          <Button variant="outline" onClick={() => setCurrentView('dashboard')}>
            <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
            Back to Dashboard
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Topics and Settings */}
        <Card className={`lg:col-span-1 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>Topics</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {chatTopics.map((topic) => {
              const Icon = topic.icon;
              return (
                <div
                  key={topic.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedTopic === topic.id
                      ? 'bg-blue-100 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                      : theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => handleTopicSelect(topic)}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{topic.title}</span>
                  </div>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {topic.description}
                  </p>
                </div>
              );
            })}

            <Separator />

            {/* Quick Questions */}
            {selectedTopic && (
              <div>
                <h4 className="text-sm mb-3">Quick Start</h4>
                <div className="space-y-2">
                  {chatTopics.find(t => t.id === selectedTopic)?.starterQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="w-full text-left justify-start h-auto p-2 text-xs"
                      onClick={() => handleSuggestionClick(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Session Context */}
            <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h4 className="text-xs mb-2 flex items-center space-x-1">
                <Settings className="w-3 h-3" />
                <span>Session Context</span>
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Role:</span>
                  <span>Frontend Developer</span>
                </div>
                <div className="flex justify-between">
                  <span>Experience:</span>
                  <span>Mid Level</span>
                </div>
                <div className="flex justify-between">
                  <span>Resume Score:</span>
                  <span>78%</span>
                </div>
                <div className="flex justify-between">
                  <span>Focus Area:</span>
                  <span>Technical Skills</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Chat Area */}
        <Card className={`lg:col-span-3 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Bot className="w-5 h-5 text-blue-500" />
                <span>AI Career Coach</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Badge variant={explainMode ? "default" : "secondary"} className="text-xs">
                  {explainMode ? 'Explain Mode' : 'Quick Answers'}
                </Badge>
                <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Messages */}
            <ScrollArea className="h-[500px] p-6">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex space-x-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.type === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {message.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>

                      {/* Message Content */}
                      <div className={`rounded-lg p-4 ${
                        message.type === 'user'
                          ? 'bg-blue-500 text-white'
                          : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                      }`}>
                        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                        
                        {/* Suggestions */}
                        {message.suggestions && (
                          <div className="mt-3 space-y-2">
                            <p className="text-xs opacity-75">Suggested follow-ups:</p>
                            <div className="flex flex-wrap gap-2">
                              {message.suggestions.map((suggestion, index) => (
                                <Button
                                  key={index}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-6"
                                  onClick={() => handleSuggestionClick(suggestion)}
                                >
                                  {suggestion}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className={`text-xs mt-2 opacity-60 ${
                          message.type === 'user' ? 'text-right' : 'text-left'
                        }`}>
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex space-x-3 max-w-[80%]">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                      }`}>
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className={`rounded-lg p-4 ${
                        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                      }`}>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-6 pt-0">
              <div className="flex space-x-3">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={explainMode ? "Ask me anything about your career..." : "Quick question..."}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={!inputValue.trim() || isLoading}
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              
              <div className={`mt-2 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {explainMode ? (
                  <span>💡 Explain mode: I'll provide detailed explanations and reasoning</span>
                ) : (
                  <span>⚡ Quick mode: I'll give concise, actionable answers</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}