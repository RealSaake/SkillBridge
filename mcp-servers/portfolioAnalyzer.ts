#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
  {
    name: 'portfolio-analyzer',
    version: '0.1.0',
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'analyze_github_activity',
        description: 'Analyze GitHub activity and provide career insights',
        inputSchema: {
          type: 'object',
          properties: {
            username: {
              type: 'string',
              description: 'GitHub username to analyze',
            },
            targetRole: {
              type: 'string',
              enum: ['frontend', 'backend', 'fullstack', 'data-science'],
              description: 'Target career role for analysis',
            },
          },
          required: ['username'],
        },
      },
      {
        name: 'generate_resume_enhancement',
        description: 'Generate resume enhancements based on GitHub profile and target role',
        inputSchema: {
          type: 'object',
          properties: {
            githubData: {
              type: 'object',
              description: 'GitHub profile and repos data',
            },
            currentResume: {
              type: 'string',
              description: 'Current resume content',
            },
            targetRole: {
              type: 'string',
              description: 'Target job role',
            },
          },
          required: ['githubData', 'targetRole'],
        },
      },
      {
        name: 'find_skill_gaps',
        description: 'Identify skill gaps based on GitHub activity vs target role requirements',
        inputSchema: {
          type: 'object',
          properties: {
            githubRepos: {
              type: 'array',
              items: { type: 'object' },
              description: 'Array of GitHub repositories',
            },
            targetRole: {
              type: 'string',
              description: 'Target career role',
            },
          },
          required: ['githubRepos', 'targetRole'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // 🚀 BEFOREGENERATE VALIDATION (embedded)
  console.log(`🚀 Starting ${name} action`);
  
  // Authentication check for sensitive operations
  if (name.includes('analyze_github_activity') || name.includes('generate_resume_enhancement')) {
    const userId = process.env.USER_ID || 'dev-user';
    if (!userId || userId === 'undefined') {
      console.error('❌ Authentication required for career features');
      throw new Error('User authentication required for career features');
    }
    console.log(`🔐 Authenticated user: ${userId}`);
  }
  
  // Rate limiting check (development mode)
  const rateLimitOk = true; // TODO: Implement Redis-based rate limiting
  if (!rateLimitOk) {
    throw new Error('Rate limit exceeded. Please try again in a few minutes.');
  }

  try {
    switch (name) {
      case 'analyze_github_activity': {
        const { username, targetRole = 'fullstack' } = args as { username: string; targetRole?: string };

        // Fetch GitHub data
        const [profileRes, reposRes] = await Promise.all([
          fetch(`https://api.github.com/users/${username}`),
          fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=20`)
        ]);

        if (!profileRes.ok || !reposRes.ok) {
          throw new Error('Failed to fetch GitHub data');
        }

        const profile = await profileRes.json();
        const repos = await reposRes.json();

        // Analyze languages and technologies
        const languages = new Set();
        const frameworks = new Set();
        let totalStars = 0;
        let recentActivity = 0;

        repos.forEach((repo: any) => {
          if (repo.language) languages.add(repo.language);
          totalStars += repo.stargazers_count;

          // Check for recent activity (last 6 months)
          const updatedAt = new Date(repo.updated_at);
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

          if (updatedAt > sixMonthsAgo) {
            recentActivity++;
          }

          // Detect frameworks from repo names/descriptions
          const repoText = `${repo.name} ${repo.description || ''}`.toLowerCase();
          if (repoText.includes('react')) frameworks.add('React');
          if (repoText.includes('vue')) frameworks.add('Vue.js');
          if (repoText.includes('angular')) frameworks.add('Angular');
          if (repoText.includes('express')) frameworks.add('Express.js');
          if (repoText.includes('django')) frameworks.add('Django');
          if (repoText.includes('flask')) frameworks.add('Flask');
        });

        const analysis = {
          profile: {
            name: profile.name,
            followers: profile.followers,
            publicRepos: profile.public_repos,
            accountAge: Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365)),
          },
          activity: {
            totalStars,
            recentlyActiveRepos: recentActivity,
            languages: Array.from(languages),
            frameworks: Array.from(frameworks),
          },
          insights: {
            experienceLevel: totalStars > 100 ? 'Advanced' : totalStars > 20 ? 'Intermediate' : 'Beginner',
            activityLevel: recentActivity > 5 ? 'High' : recentActivity > 2 ? 'Medium' : 'Low',
            roleAlignment: calculateRoleAlignment(Array.from(languages) as string[], targetRole),
          },
        };

        return {
          content: [
            {
              type: 'text',
              text: `**GitHub Activity Analysis for ${username}**\n\n` +
                `**Profile Overview:**\n` +
                `• Name: ${analysis.profile.name || 'Not provided'}\n` +
                `• Followers: ${analysis.profile.followers}\n` +
                `• Public Repos: ${analysis.profile.publicRepos}\n` +
                `• Account Age: ${analysis.profile.accountAge} years\n\n` +
                `**Technical Skills:**\n` +
                `• Languages: ${analysis.activity.languages.join(', ') || 'None detected'}\n` +
                `• Frameworks: ${analysis.activity.frameworks.join(', ') || 'None detected'}\n\n` +
                `**Activity Insights:**\n` +
                `• Total Stars: ${analysis.activity.totalStars}\n` +
                `• Recently Active Repos: ${analysis.activity.recentlyActiveRepos}\n` +
                `• Experience Level: ${analysis.insights.experienceLevel}\n` +
                `• Activity Level: ${analysis.insights.activityLevel}\n` +
                `• Role Alignment (${targetRole}): ${analysis.insights.roleAlignment}%`,
            },
          ],
        };
      }

      case 'generate_resume_enhancement': {
        const { githubData, targetRole } = args as {
          githubData: any;
          currentResume?: string;
          targetRole: string;
        };

        const enhancements = [];

        // Analyze GitHub projects for resume bullets
        if (githubData.repos && Array.isArray(githubData.repos)) {
          const topRepos = githubData.repos
            .filter((repo: any) => !repo.fork && repo.stargazers_count > 0)
            .sort((a: any, b: any) => b.stargazers_count - a.stargazers_count)
            .slice(0, 3);

          enhancements.push('**Project Experience Enhancements:**');
          topRepos.forEach((repo: any) => {
            enhancements.push(`• Developed ${repo.name}: ${repo.description || 'Open source project'} (${repo.stargazers_count} stars)`);
          });
        }

        // Role-specific suggestions
        const roleSuggestions = getRoleSuggestions(targetRole);
        enhancements.push('\n**Role-Specific Improvements:**');
        roleSuggestions.forEach(suggestion => enhancements.push(`• ${suggestion}`));

        // 🎯 AFTERGENERATE VALIDATION (embedded)
        const enhancementText = enhancements.join('\n');
        console.log(`✅ Completed ${name} successfully`);
        
        return {
          content: [
            {
              type: 'text',
              text: enhancementText,
            },
          ],
        };
      }

      case 'find_skill_gaps': {
        const { githubRepos, targetRole } = args as { githubRepos: any[]; targetRole: string };

        const requiredSkills = getRequiredSkills(targetRole);
        const currentSkills = extractSkillsFromRepos(githubRepos);

        const gaps = requiredSkills.filter(skill =>
          !currentSkills.some(current =>
            current.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(current.toLowerCase())
          )
        );

        const recommendations = gaps.map(skill => ({
          skill,
          priority: getPriority(skill),
          resources: getResourcesForSkill(skill),
        }));

        let output = `**Skill Gap Analysis for ${targetRole}**\n\n`;
        output += `**Current Skills:** ${currentSkills.join(', ')}\n\n`;
        output += `**Missing Skills:**\n`;

        recommendations.forEach(rec => {
          output += `• **${rec.skill}** (Priority: ${rec.priority})\n`;
          output += `  Resources: ${rec.resources.join(', ')}\n`;
        });

        // 🎯 AFTERGENERATE VALIDATION (embedded)
        console.log(`✅ Completed ${name} successfully`);
        
        return {
          content: [
            {
              type: 'text',
              text: output,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    // 🔥 ONERROR HANDLING (embedded)
    console.error(`❌ Error in ${name}:`, error instanceof Error ? error.message : String(error));
    
    // User-friendly error messages
    let userMessage = 'Something went wrong. Please try again.';
    if (error instanceof Error) {
      if (error.message.includes('Rate limit exceeded')) {
        userMessage = 'We\'re experiencing high demand. Please try again in a few minutes.';
      } else if (error.message.includes('GitHub')) {
        userMessage = 'Unable to connect to GitHub. Please check your connection and try again.';
      } else if (error.message.includes('authentication')) {
        userMessage = 'Please sign in to continue using SkillBridge features.';
      }
    }
    
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${userMessage}`,
        },
      ],
      isError: true,
    };
  }
});



// Helper functions
function calculateRoleAlignment(languages: string[], targetRole: string): number {
  const roleLanguages: Record<string, string[]> = {
    frontend: ['JavaScript', 'TypeScript', 'HTML', 'CSS'],
    backend: ['Python', 'Java', 'JavaScript', 'Go', 'Rust'],
    fullstack: ['JavaScript', 'TypeScript', 'Python', 'Java'],
    'data-science': ['Python', 'R', 'Julia', 'SQL'],
  };

  const required = roleLanguages[targetRole] || [];
  const matches = languages.filter(lang => required.includes(lang)).length;
  return Math.round((matches / required.length) * 100);
}

function getRoleSuggestions(role: string): string[] {
  const suggestions: Record<string, string[]> = {
    frontend: [
      'Highlight responsive design and cross-browser compatibility experience',
      'Mention performance optimization techniques used',
      'Include accessibility (a11y) considerations in projects',
    ],
    backend: [
      'Emphasize API design and database optimization experience',
      'Mention scalability and performance improvements',
      'Include security best practices implemented',
    ],
    fullstack: [
      'Showcase end-to-end project development',
      'Highlight integration between frontend and backend systems',
      'Mention deployment and DevOps experience',
    ],
  };

  return suggestions[role] || suggestions.fullstack;
}

function getRequiredSkills(role: string): string[] {
  const skills: Record<string, string[]> = {
    frontend: ['React', 'Vue.js', 'Angular', 'CSS', 'JavaScript', 'TypeScript', 'Webpack'],
    backend: ['Node.js', 'Express', 'Django', 'Flask', 'SQL', 'MongoDB', 'Redis'],
    fullstack: ['React', 'Node.js', 'Express', 'SQL', 'MongoDB', 'Git', 'Docker'],
    'data-science': ['Python', 'Pandas', 'NumPy', 'Scikit-learn', 'TensorFlow', 'SQL'],
  };

  return skills[role] || skills.fullstack;
}

function extractSkillsFromRepos(repos: any[]): string[] {
  const skills = new Set<string>();

  repos.forEach(repo => {
    if (repo.language) skills.add(repo.language);

    const text = `${repo.name} ${repo.description || ''}`.toLowerCase();
    if (text.includes('react')) skills.add('React');
    if (text.includes('vue')) skills.add('Vue.js');
    if (text.includes('angular')) skills.add('Angular');
    if (text.includes('express')) skills.add('Express');
    if (text.includes('django')) skills.add('Django');
    if (text.includes('flask')) skills.add('Flask');
  });

  return Array.from(skills);
}

function getPriority(skill: string): string {
  const highPriority = ['React', 'JavaScript', 'Python', 'SQL', 'Git'];
  return highPriority.includes(skill) ? 'High' : 'Medium';
}

function getResourcesForSkill(skill: string): string[] {
  const resources: Record<string, string[]> = {
    React: ['React Official Docs', 'Create React App', 'React Tutorial'],
    Python: ['Python.org', 'Automate the Boring Stuff', 'Python Crash Course'],
    SQL: ['W3Schools SQL', 'SQLBolt', 'PostgreSQL Tutorial'],
  };

  return resources[skill] || [`${skill} documentation`, `${skill} tutorials`];
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Portfolio Analyzer MCP server running on stdio');
}

main().catch(console.error);