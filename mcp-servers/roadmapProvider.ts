#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
  {
    name: 'roadmap-provider',
    version: '0.1.0',
  }
);

// Career roadmaps database
const roadmaps = {
  'frontend-developer': {
    title: 'Frontend Developer Roadmap',
    phases: [
      {
        phase: 'Fundamentals',
        duration: '2-3 months',
        skills: ['HTML5', 'CSS3', 'JavaScript ES6+', 'Git/GitHub', 'Browser DevTools'],
        projects: ['Personal portfolio', 'Landing page', 'Simple calculator'],
      },
      {
        phase: 'Intermediate',
        duration: '3-4 months',
        skills: ['React/Vue/Angular', 'State Management', 'API Integration', 'Responsive Design', 'CSS Frameworks'],
        projects: ['Todo app', 'Weather app', 'E-commerce frontend'],
      },
      {
        phase: 'Advanced',
        duration: '4-6 months',
        skills: ['TypeScript', 'Testing (Jest/Cypress)', 'Build Tools', 'Performance Optimization', 'Accessibility'],
        projects: ['Full-stack application', 'Component library', 'PWA'],
      },
    ],
  },
  'backend-developer': {
    title: 'Backend Developer Roadmap',
    phases: [
      {
        phase: 'Fundamentals',
        duration: '2-3 months',
        skills: ['Programming Language (Python/Node.js/Java)', 'Databases (SQL)', 'HTTP/REST APIs', 'Git'],
        projects: ['Simple REST API', 'CRUD application', 'Database design'],
      },
      {
        phase: 'Intermediate',
        duration: '3-4 months',
        skills: ['Frameworks (Express/Django/Spring)', 'Authentication', 'Database Design', 'API Documentation'],
        projects: ['User management system', 'Blog API', 'File upload service'],
      },
      {
        phase: 'Advanced',
        duration: '4-6 months',
        skills: ['Microservices', 'Caching', 'Message Queues', 'Testing', 'DevOps Basics'],
        projects: ['Microservices architecture', 'Real-time chat app', 'Scalable API'],
      },
    ],
  },
  'fullstack-developer': {
    title: 'Full Stack Developer Roadmap',
    phases: [
      {
        phase: 'Frontend Basics',
        duration: '2-3 months',
        skills: ['HTML/CSS/JavaScript', 'React/Vue', 'State Management', 'API Integration'],
        projects: ['Portfolio website', 'Frontend for existing API'],
      },
      {
        phase: 'Backend Basics',
        duration: '2-3 months',
        skills: ['Node.js/Python', 'Databases', 'REST APIs', 'Authentication'],
        projects: ['Backend API', 'Database design'],
      },
      {
        phase: 'Full Stack Integration',
        duration: '4-6 months',
        skills: ['Full Stack Frameworks', 'Deployment', 'Testing', 'DevOps'],
        projects: ['Complete web application', 'E-commerce platform', 'Social media app'],
      },
    ],
  },
  'data-scientist': {
    title: 'Data Scientist Roadmap',
    phases: [
      {
        phase: 'Fundamentals',
        duration: '3-4 months',
        skills: ['Python/R', 'Statistics', 'Pandas/NumPy', 'Data Visualization', 'SQL'],
        projects: ['Data analysis project', 'Visualization dashboard', 'Statistical analysis'],
      },
      {
        phase: 'Machine Learning',
        duration: '4-5 months',
        skills: ['Scikit-learn', 'Machine Learning Algorithms', 'Feature Engineering', 'Model Evaluation'],
        projects: ['Prediction model', 'Classification project', 'Regression analysis'],
      },
      {
        phase: 'Advanced',
        duration: '5-6 months',
        skills: ['Deep Learning', 'TensorFlow/PyTorch', 'Big Data Tools', 'MLOps', 'Cloud Platforms'],
        projects: ['Neural network project', 'NLP application', 'Computer vision project'],
      },
    ],
  },
};

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_career_roadmap',
        description: 'Get a detailed career roadmap for a specific role',
        inputSchema: {
          type: 'object',
          properties: {
            role: {
              type: 'string',
              enum: ['frontend-developer', 'backend-developer', 'fullstack-developer', 'data-scientist'],
              description: 'Career role to get roadmap for',
            },
          },
          required: ['role'],
        },
      },
      {
        name: 'list_available_roadmaps',
        description: 'List all available career roadmaps',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_learning_resources',
        description: 'Get learning resources for specific skills',
        inputSchema: {
          type: 'object',
          properties: {
            skills: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of skills to get resources for',
            },
          },
          required: ['skills'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_career_roadmap': {
        const { role } = args as { role: string };
        const roadmap = roadmaps[role as keyof typeof roadmaps];
        
        if (!roadmap) {
          throw new Error(`Roadmap not found for role: ${role}`);
        }
        
        let output = `# ${roadmap.title}\n\n`;
        
        roadmap.phases.forEach((phase, index) => {
          output += `## Phase ${index + 1}: ${phase.phase}\n`;
          output += `**Duration:** ${phase.duration}\n\n`;
          output += `**Skills to Learn:**\n${phase.skills.map(skill => `• ${skill}`).join('\n')}\n\n`;
          output += `**Project Ideas:**\n${phase.projects.map(project => `• ${project}`).join('\n')}\n\n`;
        });
        
        return {
          content: [
            {
              type: 'text',
              text: output,
            },
          ],
        };
      }

      case 'list_available_roadmaps': {
        const roadmapList = Object.entries(roadmaps)
          .map(([key, roadmap]) => `• **${key}**: ${roadmap.title}`)
          .join('\n');
        
        return {
          content: [
            {
              type: 'text',
              text: `**Available Career Roadmaps:**\n${roadmapList}`,
            },
          ],
        };
      }

      case 'get_learning_resources': {
        const { skills } = args as { skills: string[] };
        
        // Simple resource mapping (in a real implementation, this would be more comprehensive)
        const resourceMap: Record<string, string[]> = {
          'JavaScript': ['MDN Web Docs', 'JavaScript.info', 'Eloquent JavaScript book'],
          'React': ['React Official Docs', 'React Tutorial', 'Create React App'],
          'Python': ['Python.org Tutorial', 'Automate the Boring Stuff', 'Python Crash Course'],
          'Node.js': ['Node.js Official Docs', 'Node.js Tutorial', 'Express.js Guide'],
          'SQL': ['W3Schools SQL', 'SQLBolt', 'PostgreSQL Tutorial'],
        };
        
        let output = '**Learning Resources:**\n\n';
        
        skills.forEach(skill => {
          const resources = resourceMap[skill] || [`Search for "${skill}" tutorials and documentation`];
          output += `**${skill}:**\n${resources.map(resource => `• ${resource}`).join('\n')}\n\n`;
        });
        
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
  console.error('Roadmap Provider MCP server running on stdio');
}

main().catch(console.error);