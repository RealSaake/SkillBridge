import { Milestone } from '../components/widgets/roadmap/RoadmapKanbanBoard';

export interface MilestoneTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: Milestone['priority'];
  difficulty: Milestone['difficulty'];
  estimatedHours: number;
  skills: string[];
  prerequisites: string[];
  resources: Array<{
    type: 'course' | 'article' | 'video' | 'book' | 'project';
    title: string;
    url: string;
    duration?: string;
  }>;
  tags: string[];
  targetRoles: string[];
}

export const MILESTONE_TEMPLATES: Record<string, MilestoneTemplate[]> = {
  'frontend-developer': [
    {
      id: 'frontend-html-css-basics',
      title: 'Master HTML & CSS Fundamentals',
      description: 'Build a solid foundation in HTML semantics, CSS layouts, and responsive design principles.',
      category: 'Frontend Basics',
      priority: 'high',
      difficulty: 2,
      estimatedHours: 40,
      skills: ['HTML', 'CSS', 'Responsive Design', 'Flexbox', 'Grid'],
      prerequisites: [],
      resources: [
        {
          type: 'course',
          title: 'HTML & CSS Crash Course',
          url: 'https://example.com/html-css-course',
          duration: '8 hours'
        },
        {
          type: 'article',
          title: 'CSS Grid Complete Guide',
          url: 'https://css-tricks.com/snippets/css/complete-guide-grid/',
          duration: '30 min'
        },
        {
          type: 'project',
          title: 'Build a Responsive Portfolio',
          url: 'https://example.com/portfolio-project',
          duration: '10 hours'
        }
      ],
      tags: ['fundamentals', 'web-basics', 'responsive'],
      targetRoles: ['frontend-developer', 'fullstack-developer']
    },
    {
      id: 'frontend-javascript-fundamentals',
      title: 'JavaScript Core Concepts',
      description: 'Learn JavaScript fundamentals including ES6+, DOM manipulation, and asynchronous programming.',
      category: 'JavaScript',
      priority: 'critical',
      difficulty: 3,
      estimatedHours: 60,
      skills: ['JavaScript', 'ES6+', 'DOM', 'Async/Await', 'Promises'],
      prerequisites: ['frontend-html-css-basics'],
      resources: [
        {
          type: 'course',
          title: 'JavaScript: The Complete Guide',
          url: 'https://example.com/js-complete-guide',
          duration: '20 hours'
        },
        {
          type: 'book',
          title: 'You Don\'t Know JS',
          url: 'https://github.com/getify/You-Dont-Know-JS',
          duration: '40 hours'
        },
        {
          type: 'project',
          title: 'Interactive Web App',
          url: 'https://example.com/js-project',
          duration: '15 hours'
        }
      ],
      tags: ['javascript', 'programming', 'core-skills'],
      targetRoles: ['frontend-developer', 'fullstack-developer']
    },
    {
      id: 'frontend-react-basics',
      title: 'React Fundamentals',
      description: 'Learn React components, hooks, state management, and modern React patterns.',
      category: 'React',
      priority: 'high',
      difficulty: 3,
      estimatedHours: 50,
      skills: ['React', 'JSX', 'Hooks', 'State Management', 'Component Design'],
      prerequisites: ['frontend-javascript-fundamentals'],
      resources: [
        {
          type: 'course',
          title: 'React - The Complete Guide',
          url: 'https://example.com/react-course',
          duration: '15 hours'
        },
        {
          type: 'article',
          title: 'React Hooks Documentation',
          url: 'https://reactjs.org/docs/hooks-intro.html',
          duration: '2 hours'
        },
        {
          type: 'project',
          title: 'Build a Todo App with React',
          url: 'https://example.com/react-todo',
          duration: '12 hours'
        }
      ],
      tags: ['react', 'framework', 'components'],
      targetRoles: ['frontend-developer', 'fullstack-developer']
    },
    {
      id: 'frontend-typescript',
      title: 'TypeScript for React',
      description: 'Add type safety to React applications with TypeScript.',
      category: 'TypeScript',
      priority: 'medium',
      difficulty: 4,
      estimatedHours: 35,
      skills: ['TypeScript', 'Type Safety', 'Interfaces', 'Generics'],
      prerequisites: ['frontend-react-basics'],
      resources: [
        {
          type: 'course',
          title: 'TypeScript Masterclass',
          url: 'https://example.com/typescript-course',
          duration: '12 hours'
        },
        {
          type: 'article',
          title: 'React TypeScript Cheatsheet',
          url: 'https://react-typescript-cheatsheet.netlify.app/',
          duration: '1 hour'
        }
      ],
      tags: ['typescript', 'type-safety', 'advanced'],
      targetRoles: ['frontend-developer', 'fullstack-developer']
    }
  ],

  'backend-developer': [
    {
      id: 'backend-nodejs-basics',
      title: 'Node.js Fundamentals',
      description: 'Learn server-side JavaScript with Node.js, npm, and core modules.',
      category: 'Backend Basics',
      priority: 'critical',
      difficulty: 3,
      estimatedHours: 45,
      skills: ['Node.js', 'NPM', 'File System', 'HTTP', 'Modules'],
      prerequisites: ['frontend-javascript-fundamentals'],
      resources: [
        {
          type: 'course',
          title: 'Node.js Complete Course',
          url: 'https://example.com/nodejs-course',
          duration: '18 hours'
        },
        {
          type: 'project',
          title: 'Build a REST API',
          url: 'https://example.com/nodejs-api',
          duration: '20 hours'
        }
      ],
      tags: ['nodejs', 'server', 'backend'],
      targetRoles: ['backend-developer', 'fullstack-developer']
    },
    {
      id: 'backend-express-framework',
      title: 'Express.js Framework',
      description: 'Build web applications and APIs with Express.js framework.',
      category: 'Web Framework',
      priority: 'high',
      difficulty: 3,
      estimatedHours: 40,
      skills: ['Express.js', 'Middleware', 'Routing', 'REST APIs'],
      prerequisites: ['backend-nodejs-basics'],
      resources: [
        {
          type: 'course',
          title: 'Express.js Crash Course',
          url: 'https://example.com/express-course',
          duration: '8 hours'
        },
        {
          type: 'project',
          title: 'E-commerce API',
          url: 'https://example.com/ecommerce-api',
          duration: '25 hours'
        }
      ],
      tags: ['express', 'api', 'framework'],
      targetRoles: ['backend-developer', 'fullstack-developer']
    },
    {
      id: 'backend-database-design',
      title: 'Database Design & SQL',
      description: 'Learn relational database design, SQL queries, and database optimization.',
      category: 'Database',
      priority: 'high',
      difficulty: 4,
      estimatedHours: 55,
      skills: ['SQL', 'Database Design', 'PostgreSQL', 'Indexing', 'Optimization'],
      prerequisites: [],
      resources: [
        {
          type: 'course',
          title: 'Complete SQL Bootcamp',
          url: 'https://example.com/sql-bootcamp',
          duration: '20 hours'
        },
        {
          type: 'book',
          title: 'Database Design for Mere Mortals',
          url: 'https://example.com/db-design-book',
          duration: '30 hours'
        }
      ],
      tags: ['sql', 'database', 'design'],
      targetRoles: ['backend-developer', 'fullstack-developer', 'data-scientist']
    }
  ],

  'fullstack-developer': [
    {
      id: 'fullstack-mern-stack',
      title: 'MERN Stack Integration',
      description: 'Connect React frontend with Node.js/Express backend and MongoDB.',
      category: 'Full Stack',
      priority: 'critical',
      difficulty: 5,
      estimatedHours: 80,
      skills: ['React', 'Node.js', 'Express', 'MongoDB', 'REST APIs', 'Authentication'],
      prerequisites: ['frontend-react-basics', 'backend-express-framework'],
      resources: [
        {
          type: 'course',
          title: 'MERN Stack Complete Guide',
          url: 'https://example.com/mern-course',
          duration: '30 hours'
        },
        {
          type: 'project',
          title: 'Social Media App',
          url: 'https://example.com/social-app',
          duration: '40 hours'
        }
      ],
      tags: ['mern', 'fullstack', 'integration'],
      targetRoles: ['fullstack-developer']
    },
    {
      id: 'fullstack-deployment',
      title: 'Application Deployment',
      description: 'Deploy full-stack applications to cloud platforms with CI/CD.',
      category: 'DevOps',
      priority: 'high',
      difficulty: 4,
      estimatedHours: 35,
      skills: ['Docker', 'AWS', 'Heroku', 'CI/CD', 'Environment Variables'],
      prerequisites: ['fullstack-mern-stack'],
      resources: [
        {
          type: 'course',
          title: 'Docker for Developers',
          url: 'https://example.com/docker-course',
          duration: '10 hours'
        },
        {
          type: 'article',
          title: 'Deploying to AWS',
          url: 'https://example.com/aws-deploy',
          duration: '2 hours'
        }
      ],
      tags: ['deployment', 'devops', 'cloud'],
      targetRoles: ['fullstack-developer', 'backend-developer']
    }
  ],

  'data-scientist': [
    {
      id: 'data-python-basics',
      title: 'Python for Data Science',
      description: 'Learn Python programming with focus on data analysis libraries.',
      category: 'Programming',
      priority: 'critical',
      difficulty: 3,
      estimatedHours: 50,
      skills: ['Python', 'NumPy', 'Pandas', 'Matplotlib', 'Jupyter'],
      prerequisites: [],
      resources: [
        {
          type: 'course',
          title: 'Python Data Science Handbook',
          url: 'https://example.com/python-ds-course',
          duration: '25 hours'
        },
        {
          type: 'book',
          title: 'Python for Data Analysis',
          url: 'https://example.com/python-analysis-book',
          duration: '40 hours'
        }
      ],
      tags: ['python', 'data-analysis', 'programming'],
      targetRoles: ['data-scientist']
    },
    {
      id: 'data-machine-learning',
      title: 'Machine Learning Fundamentals',
      description: 'Learn supervised and unsupervised learning algorithms.',
      category: 'Machine Learning',
      priority: 'high',
      difficulty: 5,
      estimatedHours: 70,
      skills: ['Scikit-learn', 'Machine Learning', 'Statistics', 'Model Evaluation'],
      prerequisites: ['data-python-basics'],
      resources: [
        {
          type: 'course',
          title: 'Machine Learning A-Z',
          url: 'https://example.com/ml-course',
          duration: '35 hours'
        },
        {
          type: 'project',
          title: 'Predictive Model Project',
          url: 'https://example.com/ml-project',
          duration: '25 hours'
        }
      ],
      tags: ['machine-learning', 'algorithms', 'modeling'],
      targetRoles: ['data-scientist']
    }
  ]
};

export function getMilestoneTemplatesForRole(role: string): MilestoneTemplate[] {
  return MILESTONE_TEMPLATES[role] || [];
}

export function createMilestoneFromTemplate(template: MilestoneTemplate): Omit<Milestone, 'id'> {
  return {
    title: template.title,
    description: template.description,
    status: 'backlog',
    priority: template.priority,
    difficulty: template.difficulty,
    estimatedHours: template.estimatedHours,
    skills: template.skills,
    prerequisites: template.prerequisites,
    resources: template.resources,
    progress: 0,
    tags: template.tags,
    category: template.category
  };
}

export function getRecommendedMilestones(
  currentSkills: string[],
  targetRole: string,
  maxRecommendations: number = 5
): MilestoneTemplate[] {
  const templates = getMilestoneTemplatesForRole(targetRole);
  
  // Score templates based on skill gaps and prerequisites
  const scoredTemplates = templates.map(template => {
    let score = 0;
    
    // Higher score for templates that teach skills we don't have
    const newSkills = template.skills.filter(skill => 
      !currentSkills.some(current => 
        current.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(current.toLowerCase())
      )
    );
    score += newSkills.length * 2;
    
    // Lower score if we already have most skills
    const existingSkills = template.skills.filter(skill =>
      currentSkills.some(current =>
        current.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(current.toLowerCase())
      )
    );
    score -= existingSkills.length;
    
    // Boost score for high priority items
    if (template.priority === 'critical') score += 3;
    if (template.priority === 'high') score += 2;
    if (template.priority === 'medium') score += 1;
    
    // Slight penalty for very difficult items (to balance learning curve)
    if (template.difficulty >= 4) score -= 1;
    
    return { template, score };
  });
  
  return scoredTemplates
    .sort((a, b) => b.score - a.score)
    .slice(0, maxRecommendations)
    .map(item => item.template);
}