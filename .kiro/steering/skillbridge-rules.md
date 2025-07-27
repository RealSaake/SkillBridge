# SkillBridge AI Steering Rules

## GitHub Integration Rules

### High Priority
- **GitHub Analysis Requests**: Use github-projects MCP to fetch real data, never mock
- **Portfolio Generation**: Combine github-projects + portfolio-analyzer MCPs for comprehensive analysis

### Medium Priority  
- **Skill Gap Analysis**: Use portfolio-analyzer MCP with target role parameter

## Career Guidance Rules

### High Priority
- **Skill Roadmap Requests**: Call roadmap-data MCP and route to roadmap-curator agent
- **Resume Help**: Activate resume-tips MCP and resume-generator agent

### Medium Priority
- **ATS Optimization**: Use resume-tips MCP with technical category focus

## Development Workflow Rules

### High Priority
- **Sprint 1 Tasks**: Focus on authentication, database setup, and MCP integration
- **Sprint 2 Tasks**: Prioritize GitHub API integration and data sync reliability

### Medium Priority
- **Tech Stack Questions**: Reference design.md rationale and steering/tech.md guidelines

## Anti-Hallucination Safeguards

### Always Do
- Validate MCP responses against expected schema
- Log all AI-generated content for review
- Provide fallback when external APIs fail

### Never Do
- Generate fake GitHub data or mock career advice
- Proceed without user authentication in production features

## Fallback Strategies

- **MCP Failure**: Display warning about external service unavailability, use cached data
- **GitHub API Limit**: Implement exponential backoff and inform user of delay
- **Database Error**: Log error, show user-friendly message, attempt retry

## Development Safety

- Require tests for all new features
- Enforce TypeScript for type safety
- Validate all API responses
- Log all MCP calls for debugging