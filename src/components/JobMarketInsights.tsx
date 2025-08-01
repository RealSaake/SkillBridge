import React, { useState } from 'react';
import { TrendingUp, MapPin, DollarSign, Briefcase, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

interface JobTrend {
  role: string;
  demand: number;
  growth: number;
  avgSalary: string;
  locations: string[];
  requiredSkills: string[];
}

interface MarketInsight {
  title: string;
  description: string;
  type: 'positive' | 'neutral' | 'warning';
  impact: 'high' | 'medium' | 'low';
}

interface SalaryRange {
  location: string;
  min: number;
  max: number;
  median: number;
}

export function JobMarketInsights() {
  const [isExpanded, setIsExpanded] = useState(true);

  const jobTrends: JobTrend[] = [
    {
      role: 'Frontend Developer',
      demand: 85,
      growth: 12,
      avgSalary: '$75,000 - $120,000',
      locations: ['San Francisco', 'New York', 'Austin', 'Seattle'],
      requiredSkills: ['React', 'TypeScript', 'Node.js', 'CSS']
    },
    {
      role: 'Full Stack Developer',
      demand: 90,
      growth: 15,
      avgSalary: '$80,000 - $140,000',
      locations: ['San Francisco', 'Seattle', 'Boston', 'Denver'],
      requiredSkills: ['React', 'Node.js', 'Python', 'Docker', 'AWS']
    },
    {
      role: 'DevOps Engineer',
      demand: 95,
      growth: 20,
      avgSalary: '$90,000 - $160,000',
      locations: ['Seattle', 'San Francisco', 'Austin', 'Chicago'],
      requiredSkills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Python']
    }
  ];

  const marketInsights: MarketInsight[] = [
    {
      title: 'High Demand for Docker Skills',
      description: 'Docker expertise shows 40% higher salary potential in current market.',
      type: 'positive',
      impact: 'high'
    },
    {
      title: 'TypeScript Adoption Growing',
      description: 'Companies increasingly require TypeScript for frontend positions.',
      type: 'positive',
      impact: 'medium'
    },
    {
      title: 'Remote Work Opportunities',
      description: '68% of tech roles now offer remote or hybrid work options.',
      type: 'neutral',
      impact: 'medium'
    },
    {
      title: 'AI/ML Skills Becoming Essential',
      description: 'Traditional roles increasingly require basic AI/ML understanding.',
      type: 'warning',
      impact: 'high'
    }
  ];

  const salaryRanges: SalaryRange[] = [
    { location: 'San Francisco', min: 120000, max: 180000, median: 150000 },
    { location: 'New York', min: 100000, max: 160000, median: 130000 },
    { location: 'Seattle', min: 110000, max: 170000, median: 140000 },
    { location: 'Austin', min: 80000, max: 130000, median: 105000 }
  ];

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'positive':
        return 'border-green-500 bg-green-50';
      case 'warning':
        return 'border-yellow-500 bg-yellow-50';
      case 'neutral':
        return 'border-blue-500 bg-blue-50';
      default:
        return 'border-muted bg-muted/50';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <TrendingUp className="w-4 h-4 text-yellow-500" />;
      case 'neutral':
        return <TrendingUp className="w-4 h-4 text-blue-500" />;
      default:
        return <TrendingUp className="w-4 h-4" />;
    }
  };

  const formatSalary = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Card className="transition-colors duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Briefcase className="w-5 h-5" />
            <CardTitle className="text-lg">Job Market Insights</CardTitle>
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
          {/* Market Insights */}
          <div>
            <h4 className="text-sm mb-3 font-medium">Market Trends</h4>
            <div className="space-y-3">
              {marketInsights.map((insight, index) => (
                <div key={index} className={`p-3 rounded-lg border-l-4 ${getInsightColor(insight.type)}`}>
                  <div className="flex items-start space-x-3">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="text-sm font-medium">{insight.title}</h5>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          insight.impact === 'high' 
                            ? 'bg-red-100 text-red-800'
                            : insight.impact === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                        }`}>
                          {insight.impact} impact
                        </span>
                      </div>
                      <p className="text-xs mt-1 text-muted-foreground">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Job Role Demand */}
          <div>
            <h4 className="text-sm mb-3 font-medium">Role Demand & Growth</h4>
            <div className="space-y-4">
              {jobTrends.map((job) => (
                <div key={job.role} className="p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-medium">{job.role}</h5>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                        +{job.growth}% growth
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>Market Demand</span>
                        <span>{job.demand}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${job.demand}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <span className="text-xs">{job.avgSalary}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-medium">Top Locations:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {job.locations.slice(0, 3).map((location) => (
                          <span key={location} className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {location}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-xs font-medium">Key Skills:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {job.requiredSkills.slice(0, 4).map((skill) => (
                          <span key={skill} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Salary Comparison */}
          <div>
            <h4 className="text-sm mb-3 font-medium">Salary Ranges by Location</h4>
            <div className="space-y-3">
              {salaryRanges.map((salary) => (
                <div key={salary.location} className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm font-medium">{salary.location}</span>
                    </div>
                    <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full">
                      Median: {formatSalary(salary.median)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span>{formatSalary(salary.min)}</span>
                    <span>{formatSalary(salary.max)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((salary.median - salary.min) / (salary.max - salary.min)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Items */}
          <div className="p-4 rounded-lg border border-blue-200 bg-blue-50">
            <h4 className="text-sm mb-2 font-medium">Recommended Actions</h4>
            <ul className="text-xs space-y-1 mb-3">
              <li>• Focus on Docker and AWS skills for salary boost</li>
              <li>• Consider TypeScript certification for competitive edge</li>
              <li>• Explore remote opportunities in high-paying markets</li>
              <li>• Build portfolio projects showcasing full-stack capabilities</li>
            </ul>
            <Button size="sm" variant="outline">
              <ExternalLink className="w-3 h-3 mr-1" />
              View Job Openings
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}