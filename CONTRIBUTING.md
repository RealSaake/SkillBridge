# 🤝 Contributing to SkillBridge

Thank you for your interest in contributing to SkillBridge! This document provides guidelines and information for contributors.

## 🎯 Project Vision

SkillBridge aims to bridge the gap between current skills and career aspirations through AI-powered insights and personalized learning paths. We're building a production-grade platform that provides authentic, real-time career development guidance.

## 🏗️ Development Philosophy

### Core Principles
1. **Real Data First**: No mock data in production code
2. **Type Safety**: Complete TypeScript implementation
3. **Test-Driven**: Comprehensive test coverage with real data
4. **Performance**: Intelligent caching and optimization
5. **User-Centric**: Focus on genuine user value

### Quality Standards
- **Zero Mock Dependencies**: Production code must use real MCP integration
- **TypeScript Strict Mode**: No implicit any types allowed
- **Test Coverage**: 85%+ coverage with meaningful assertions
- **Error Handling**: Graceful degradation for all failure scenarios
- **Documentation**: Clear, up-to-date documentation for all features

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm
- Git
- Python 3.8+ (for MCP servers)
- Basic understanding of React, TypeScript, and MCP protocol

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/SkillBridge.git
   cd SkillBridge
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run Tests**
   ```bash
   npm test
   npm run test:final
   ```

4. **Start Development Server**
   ```bash
   npm start
   ```

5. **Validate Production Readiness**
   ```bash
   ./scripts/production-readiness-check.sh
   ```

## 📋 Contribution Types

### 🐛 Bug Reports
- Use the bug report template
- Include steps to reproduce
- Provide system information
- Include relevant logs/screenshots

### ✨ Feature Requests
- Use the feature request template
- Explain the use case and value
- Consider implementation complexity
- Align with project roadmap

### 🔧 Code Contributions
- Follow the development workflow below
- Ensure all tests pass
- Maintain code quality standards
- Update documentation as needed

## 🔄 Development Workflow

### 1. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Development Guidelines

#### Code Style
- Use TypeScript for all new code
- Follow existing naming conventions
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

#### Component Development
```typescript
// ✅ Good: TypeScript with proper types
interface ComponentProps {
  username: string;
  targetRole: string;
}

export const MyComponent: React.FC<ComponentProps> = ({ username, targetRole }) => {
  // Implementation
};

// ❌ Bad: No types, implicit any
export const MyComponent = ({ username, targetRole }) => {
  // Implementation
};
```

#### MCP Integration
```typescript
// ✅ Good: Real MCP integration with error handling
const { data, loading, error } = useMCP('server-name', 'tool-name', params);

if (error) {
  return <ErrorBoundary error={error} />;
}

// ❌ Bad: Mock data usage
const mockData = { /* ... */ };
```

### 3. Testing Requirements

#### Test Coverage
- Write tests for all new features
- Maintain 85%+ test coverage
- Use real data in integration tests
- Test error scenarios

#### Test Examples
```typescript
// ✅ Good: Real data integration test
it('validates component with real MCP data', async () => {
  render(<Component username="testuser" />);
  
  await waitFor(() => {
    expect(screen.getByText(/specific data point/i)).toBeInTheDocument();
  });
});

// ❌ Bad: Mock data test
it('validates component with mock data', () => {
  const mockData = { /* ... */ };
  // Don't do this
});
```

### 4. Quality Checks

Before submitting your PR, ensure:

```bash
# TypeScript compilation
npx tsc --noEmit

# Tests pass
npm test
npm run test:final

# No mock data
./scripts/detect-mock-usage.sh

# Production readiness
./scripts/production-readiness-check.sh
```

### 5. Commit Guidelines

#### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

#### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions/modifications
- `chore`: Build process or auxiliary tool changes

#### Examples
```bash
feat(mcp): add caching to GitHub API calls
fix(ui): resolve loading state in skill gap analysis
docs(readme): update installation instructions
test(integration): add error handling validation
```

### 6. Pull Request Process

#### PR Checklist
- [ ] Branch is up to date with main
- [ ] All tests pass
- [ ] No mock data in production code
- [ ] TypeScript compilation successful
- [ ] Documentation updated
- [ ] Self-review completed

#### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No mock data in production code
```

## 🏗️ Architecture Guidelines

### Component Structure
```
src/components/
├── ComponentName/
│   ├── index.ts              # Export
│   ├── ComponentName.tsx     # Main component
│   ├── ComponentName.test.tsx # Tests
│   └── types.ts              # Component-specific types
```

### MCP Integration Patterns
```typescript
// Use the established useMCP hook
const { data, loading, error, refetch } = useMCP(
  'server-name',
  'tool-name',
  parameters
);

// Handle all states
if (loading) return <LoadingState />;
if (error) return <ErrorState error={error} onRetry={refetch} />;
if (!data) return <EmptyState />;

return <DataComponent data={data} />;
```

### Error Handling
```typescript
// Implement error boundaries
<ErrorBoundary fallback={<ErrorFallback />}>
  <Component />
</ErrorBoundary>

// Handle async errors
try {
  const result = await mcpCall();
  return result;
} catch (error) {
  console.error('MCP call failed:', error);
  throw new MCPError(error);
}
```

## 📚 Resources

### Documentation
- [Sprint 2 Success Summary](./SPRINT-2-SUCCESS-SUMMARY.md)
- [Architecture Design](./docs/architecture.md)
- [MCP Integration Guide](./docs/mcp-integration.md)
- [Testing Strategy](./docs/testing.md)

### External Resources
- [MCP Protocol Documentation](https://modelcontextprotocol.io/)
- [React TypeScript Guide](https://react-typescript-cheatsheet.netlify.app/)
- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles)

## 🎯 Current Priorities

### Sprint 3 Focus Areas
1. **Authentication System**: User login and session management
2. **Personalization**: User-specific dashboards and preferences
3. **Advanced Analytics**: Deeper insights and recommendations
4. **Performance**: Further optimization and monitoring

### Help Wanted
- Authentication integration
- UI/UX improvements
- Performance optimization
- Documentation enhancements
- Test coverage expansion

## 🤔 Questions?

- **General Questions**: [GitHub Discussions](https://github.com/RealSaake/SkillBridge/discussions)
- **Bug Reports**: [GitHub Issues](https://github.com/RealSaake/SkillBridge/issues)
- **Feature Requests**: [GitHub Issues](https://github.com/RealSaake/SkillBridge/issues)

## 🙏 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for helping make SkillBridge better! 🚀