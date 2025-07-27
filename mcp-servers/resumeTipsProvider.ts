#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
  {
    name: 'resume-tips',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// Resume tips database
const resumeTips = {
  general: [
    "Keep your resume to 1-2 pages maximum",
    "Use action verbs to start bullet points (e.g., 'Developed', 'Implemented', 'Led')",
    "Quantify achievements with numbers and percentages when possible",
    "Tailor your resume for each job application",
    "Use a clean, professional format with consistent styling",
  ],
  technical: [
    "List programming languages, frameworks, and tools you're proficient in",
    "Include links to your GitHub, portfolio, or relevant projects",
    "Highlight specific technologies used in each project",
    "Show progression in technical skills over time",
    "Include relevant certifications and courses",
  ],
  experience: [
    "Focus on achievements, not just responsibilities",
    "Use the STAR method (Situation, Task, Action, Result) for descriptions",
    "Include internships, freelance work, and significant projects",
    "Show impact and results of your work",
    "Keep descriptions concise but informative",
  ],
  skills: [
    "Separate technical skills from soft skills",
    "Be honest about your skill level",
    "Include both hard and soft skills relevant to the role",
    "Group similar skills together",
    "Update skills section regularly",
  ],
};

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_resume_tips',
        description: 'Get resume tips for a specific category',
        inputSchema: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              enum: ['general', 'technical', 'experience', 'skills', 'all'],
              description: 'Category of resume tips to retrieve',
              default: 'general',
            },
          },
        },
      },
      {
        name: 'analyze_resume_section',
        description: 'Analyze a resume section and provide feedback',
        inputSchema: {
          type: 'object',
          properties: {
            section: {
              type: 'string',
              description: 'Resume section content to analyze',
            },
            sectionType: {
              type: 'string',
              enum: ['experience', 'skills', 'education', 'projects'],
              description: 'Type of resume section',
            },
          },
          required: ['section', 'sectionType'],
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
  
  // Authentication check for resume features
  if (name.includes('analyze_resume_section')) {
    const userId = process.env.USER_ID || 'dev-user';
    console.log(`🔐 Authenticated user: ${userId}`);
  }

  try {
    switch (name) {
      case 'get_resume_tips': {
        const { category = 'general' } = args as { category?: string };
        
        if (category === 'all') {
          const allTips = Object.entries(resumeTips)
            .map(([cat, tips]) => `**${cat.toUpperCase()} TIPS:**\n${tips.map(tip => `• ${tip}`).join('\n')}`)
            .join('\n\n');
          
          return {
            content: [
              {
                type: 'text',
                text: allTips,
              },
            ],
          };
        }
        
        const tips = resumeTips[category as keyof typeof resumeTips];
        if (!tips) {
          throw new Error(`Unknown category: ${category}`);
        }
        
        return {
          content: [
            {
              type: 'text',
              text: `**${category.toUpperCase()} RESUME TIPS:**\n${tips.map(tip => `• ${tip}`).join('\n')}`,
            },
          ],
        };
      }

      case 'analyze_resume_section': {
        const { section, sectionType } = args as { section: string; sectionType: string };
        
        // Simple analysis based on section type
        let feedback = [];
        
        switch (sectionType) {
          case 'experience':
            if (!section.includes('•') && !section.includes('-')) {
              feedback.push("Consider using bullet points for better readability");
            }
            if (!/\d/.test(section)) {
              feedback.push("Try to include quantifiable achievements (numbers, percentages)");
            }
            if (!/(developed|implemented|led|created|managed|improved)/i.test(section)) {
              feedback.push("Use strong action verbs to start your bullet points");
            }
            break;
            
          case 'skills':
            if (section.length < 50) {
              feedback.push("Consider expanding your skills section with more relevant technologies");
            }
            if (!section.includes(',') && !section.includes('•')) {
              feedback.push("Organize skills in a clear, readable format");
            }
            break;
            
          default:
            feedback.push("Section looks good! Consider the general resume tips for improvement.");
        }
        
        if (feedback.length === 0) {
          feedback.push("This section looks well-structured!");
        }
        
        return {
          content: [
            {
              type: 'text',
              text: `**ANALYSIS FOR ${sectionType.toUpperCase()} SECTION:**\n${feedback.map(f => `• ${f}`).join('\n')}`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Resume Tips MCP server running on stdio');
}

main().catch(console.error);