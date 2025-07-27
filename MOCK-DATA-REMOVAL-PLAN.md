# Mock Data Removal & Real MCP Integration Plan

## 🎯 **Objective**
Remove all mock data from the SkillBridge platform and establish real MCP server integration to ensure production readiness and accurate testing.

## 🚨 **Why This is Critical**
- **Test Drift**: Mock data may not match real MCP server responses
- **Production Bugs**: Components may break when connected to real servers
- **Inaccurate Assumptions**: Mock data creates false confidence in functionality
- **Technical Debt**: Mock code adds complexity and maintenance overhead

## 📋 **Phase 1: Mock Data Audit & Inventory**

### **Files Containing Mock Data**
- ✅ `src/hooks/useMCP.ts` - Contains `getMockResponse` method with extensive mock data
- ✅ `src/utils/test-utils.tsx` - Contains `MockMCPClient` and mock factories
- ✅ `src/components/__tests__/GitHubActivityEnhanced.test.tsx` - Uses mock data for testing
- 🔍 **Need to audit**: Other test files that may use mock data

### **Mock Data Structures to Remove**
```typescript
// From useMCP.ts - TO BE REMOVED
const responses: Record<string, Record<string, (params: any) => any>> = {
  'portfolio-analyzer': { /* mock responses */ },
  'github-projects': { /* mock responses */ },
  'resume-tips': { /* mock responses */ },
  'roadmap-data': { /* mock responses */ }
};

// From test-utils.tsx - TO BE REMOVED
export class MockMCPClient { /* entire class */ }
export const createMockGitHubRepo = () => { /* factory */ }
export const createMockGitHubActivity = () => { /* factory */ }
```

## 🔧 **Phase 2: Real MCP Client Implementation**

### **Step 1: Replace MCPClient Class**
```typescript
// BEFORE (Mock Implementation)
class MCPClient {
  private async callMCP<T>() {
    await this.simulateNetworkDelay();
    return this.getMockResponse<T>();
  }
}

// AFTER (Real Implementation)
class MCPClient {
  private async callMCP<T>(serverName: string, toolName: string, params: any) {
    const server = this.getServer(serverName);
    const request = {
      jsonrpc: "2.0",
      id: generateId(),
      method: `tools/${toolName}`,
      params
    };
    return await server.request(request);
  }
}
```

### **Step 2: MCP Server Connection Management**
```typescript
interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
}

class MCPServerManager {
  private servers: Map<string, MCPServer> = new Map();
  
  async startServer(config: MCPServerConfig): Promise<MCPServer> {
    // Start MCP server process
    // Set up stdio transport
    // Handle server lifecycle
  }
}
```

### **Step 3: Error Handling for Real Servers**
```typescript
// Handle real MCP server errors
interface MCPServerError {
  code: number;
  message: string;
  data?: any;
}

// Map MCP errors to user-friendly messages
const errorMessages = {
  [-32601]: "MCP server method not found",
  [-32602]: "Invalid parameters sent to MCP server",
  [-32603]: "MCP server internal error"
};
```

## 🤝 **Phase 3: Contract Testing Implementation**

### **Step 1: Set up Pact.js Contract Tests**
```typescript
// __tests__/contracts/mcp-portfolio-analyzer.pact.ts
import { Pact } from '@pact-foundation/pact';
import { GitHubActivityAnalysis } from '../../src/types/mcp-types';

const provider = new Pact({
  consumer: 'skillbridge-frontend',
  provider: 'portfolio-analyzer-mcp',
  port: 1234,
});

describe('Portfolio Analyzer MCP Contract', () => {
  test('analyze_github_activity contract', async () => {
    await provider
      .given('user has active GitHub profile')
      .uponReceiving('GitHub activity analysis request')
      .withRequest({
        method: 'POST',
        path: '/tools/analyze_github_activity',
        body: { username: 'testuser', targetRole: 'frontend' }
      })
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          jsonrpc: '2.0',
          id: 1,
          result: {
            profile: { name: 'Test User', followers: 10, publicRepos: 5 },
            activity: { totalStars: 50, languages: ['JavaScript', 'TypeScript'] },
            insights: { experienceLevel: 'Intermediate', activityLevel: 'High' }
          }
        }
      });

    // Verify contract with real MCP call
    const result = await mcpClient.call<GitHubActivityAnalysis>(
      'portfolio-analyzer', 
      'analyze_github_activity', 
      { username: 'testuser', targetRole: 'frontend' }
    );

    expect(result.profile.name).toBeDefined();
    expect(result.activity.totalStars).toBeGreaterThanOrEqual(0);
  });
});
```

### **Step 2: JSON Schema Contract Validation**
```typescript
// scripts/generate-mcp-schemas.ts
import { zodToJsonSchema } from 'zod-to-json-schema';
import { GitHubActivitySchema, ResumeAnalysisSchema } from '../src/schemas/mcp-schemas';

// Generate JSON schemas from Zod schemas
const schemas = {
  'portfolio-analyzer': {
    'analyze_github_activity': zodToJsonSchema(GitHubActivitySchema)
  },
  'resume-tips': {
    'get_resume_tips': zodToJsonSchema(ResumeAnalysisSchema)
  }
};

// Validate MCP server responses against schemas
export function validateMCPContract(serverName: string, toolName: string, response: any) {
  const schema = schemas[serverName]?.[toolName];
  if (!schema) throw new Error(`No schema found for ${serverName}.${toolName}`);
  
  // Use AJV or similar for validation
  return ajv.validate(schema, response);
}
```

## 🧪 **Phase 4: Testing Infrastructure Overhaul**

### **Step 1: Remove Mock Testing**
```typescript
// REMOVE from test files
import { MockMCPClient, createMockGitHubActivity } from '../utils/test-utils';

// REPLACE with MSW or real test server
import { setupServer } from 'msw/node';
import { mcpHandlers } from '../__mocks__/mcp-handlers';
```

### **Step 2: Implement MSW for HTTP Mocking**
```typescript
// __mocks__/mcp-handlers.ts
import { rest } from 'msw';

export const mcpHandlers = [
  rest.post('/mcp/portfolio-analyzer', (req, res, ctx) => {
    return res(ctx.json({
      jsonrpc: "2.0",
      id: req.body.id,
      result: { /* real schema-compliant data */ }
    }));
  })
];
```

### **Step 3: Create MCP Test Server**
```typescript
// __tests__/mcp-test-server.ts
class MCPTestServer {
  private servers: Map<string, TestMCPServer> = new Map();
  
  async setupTestServer(serverName: string) {
    // Start test MCP server with real schema
    // Use actual MCP protocol
    // Return schema-validated responses
  }
}
```

## 📊 **Phase 4: Schema Validation & Type Safety**

### **Step 1: Runtime Schema Validation**
```typescript
import { z } from 'zod';

// Define Zod schemas matching TypeScript interfaces
const GitHubActivitySchema = z.object({
  profile: z.object({
    name: z.string(),
    followers: z.number(),
    // ... rest of schema
  }),
  // ... rest of schema
});

// Validate MCP responses at runtime
function validateMCPResponse<T>(data: unknown, schema: z.ZodSchema<T>): T {
  return schema.parse(data);
}
```

### **Step 2: MCP Response Validation**
```typescript
// In useMCP.ts
async call<T>(serverName: string, toolName: string, params: any): Promise<T> {
  const response = await this.callMCP(serverName, toolName, params);
  
  // Validate response matches expected schema
  const schema = getSchemaForTool(serverName, toolName);
  return validateMCPResponse(response.result, schema);
}
```

## 🗂️ **Phase 5: File Cleanup & Organization**

### **Files to Modify**
1. **`src/hooks/useMCP.ts`**
   - Remove `getMockResponse` method (200+ lines)
   - Remove `simulateNetworkDelay` function
   - Remove `validateParams` mock validation
   - Replace `MCPClient` with real implementation

2. **`src/utils/test-utils.tsx`**
   - Remove `MockMCPClient` class
   - Remove `createMock*` factory functions
   - Keep only theme provider and generic test utilities

3. **`src/components/__tests__/*.test.tsx`**
   - Update all test files to use MSW or real test server
   - Remove mock data imports
   - Add integration test scenarios

### **Files to Archive/Delete**
- Any standalone mock files (if they exist)
- Mock data JSON files
- Development-only mock utilities

## 🎭 **Phase 6: End-to-End Flow Testing**

### **Step 1: Playwright E2E Test Suite**
```typescript
// e2e/complete-user-flows.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Complete SkillBridge User Flows', () => {
  test('GitHub connect → skill analysis → roadmap → resume export', async ({ page }) => {
    // 1. Initial page load
    await page.goto('/');
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();

    // 2. Connect GitHub account
    await page.click('[data-testid="connect-github-btn"]');
    await page.fill('[data-testid="github-username"]', 'testuser');
    await page.click('[data-testid="analyze-btn"]');

    // 3. Wait for GitHub activity analysis
    await expect(page.locator('[data-testid="github-activity-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="language-chart"]')).toBeVisible();

    // 4. Verify skill gap analysis appears
    await expect(page.locator('[data-testid="skill-gaps-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="priority-skills"]')).toBeVisible();

    // 5. Generate learning roadmap
    await page.click('[data-testid="generate-roadmap-btn"]');
    await expect(page.locator('[data-testid="learning-roadmap-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="week-navigation"]')).toBeVisible();

    // 6. Upload and analyze resume
    await page.setInputFiles('[data-testid="resume-upload"]', 'test-fixtures/sample-resume.pdf');
    await expect(page.locator('[data-testid="resume-analysis-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="resume-score"]')).toBeVisible();

    // 7. Export enhanced resume
    await page.click('[data-testid="export-resume-btn"]');
    const downloadPromise = page.waitForEvent('download');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('enhanced-resume');
  });

  test('Handle edge cases: empty GitHub profile', async ({ page }) => {
    await page.goto('/');
    
    // Test with user who has no repositories
    await page.fill('[data-testid="github-username"]', 'empty-user');
    await page.click('[data-testid="analyze-btn"]');
    
    // Should show empty state, not crash
    await expect(page.locator('[data-testid="empty-github-state"]')).toBeVisible();
    await expect(page.locator('[data-testid="empty-state-message"]')).toContainText('No repositories found');
    
    // Should still allow manual skill input
    await expect(page.locator('[data-testid="manual-skills-input"]')).toBeVisible();
  });

  test('Error recovery: API failures and retries', async ({ page }) => {
    // Mock API failure
    await page.route('**/mcp/portfolio-analyzer', route => route.abort());
    
    await page.goto('/');
    await page.fill('[data-testid="github-username"]', 'testuser');
    await page.click('[data-testid="analyze-btn"]');
    
    // Should show error state
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-btn"]')).toBeVisible();
    
    // Restore API and retry
    await page.unroute('**/mcp/portfolio-analyzer');
    await page.click('[data-testid="retry-btn"]');
    
    // Should recover and show results
    await expect(page.locator('[data-testid="github-activity-card"]')).toBeVisible();
  });

  test('Performance: Large dataset handling', async ({ page }) => {
    // Test with user who has 100+ repositories
    await page.goto('/');
    await page.fill('[data-testid="github-username"]', 'prolific-user');
    await page.click('[data-testid="analyze-btn"]');
    
    // Should handle large datasets gracefully
    await expect(page.locator('[data-testid="github-activity-card"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="repo-count"]')).toContainText('100+');
    
    // UI should remain responsive
    await page.click('[data-testid="expand-repos-btn"]');
    await expect(page.locator('[data-testid="repo-list"]')).toBeVisible();
  });
});
```

### **Step 2: Cross-browser E2E Testing**
```typescript
// playwright.config.ts
export default {
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 12'] } },
  ],
  
  // Test against real MCP servers
  webServer: {
    command: 'npm run start:with-mcp',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
};
```

## 🚀 **Phase 7: Integration Testing**

### **Step 1: MCP Server Integration Tests**
```typescript
describe('MCP Server Integration', () => {
  test('portfolio-analyzer returns valid GitHub activity', async () => {
    const result = await mcpClient.call('portfolio-analyzer', 'analyze_github_activity', {
      username: 'testuser',
      targetRole: 'frontend'
    });
    
    expect(result).toMatchSchema(GitHubActivitySchema);
    expect(result.profile.name).toBeDefined();
  });
});
```

### **Step 2: Component Integration Tests**
```typescript
describe('GitHubActivityEnhanced Integration', () => {
  test('renders with real MCP data', async () => {
    // Start real MCP test server
    const testServer = new MCPTestServer();
    await testServer.start();
    
    render(<GitHubActivityEnhanced username="testuser" targetRole="frontend" />);
    
    // Wait for real MCP call to complete
    await waitFor(() => {
      expect(screen.getByText(/GitHub Activity/)).toBeInTheDocument();
    });
  });
});
```

## 📈 **Success Metrics**

### **Code Quality Metrics**
- [ ] Zero mock data references in production code
- [ ] All MCP calls use real protocol implementation
- [ ] 100% schema validation coverage for MCP responses
- [ ] All tests pass with real MCP servers

### **Functional Metrics**
- [ ] All 4 enhanced components work with real MCP data
- [ ] Error handling works with real MCP server errors
- [ ] Performance is acceptable with real MCP calls (<2s response time)
- [ ] No breaking changes to component APIs

### **Testing Metrics**
- [ ] Integration tests cover all MCP server interactions
- [ ] Test coverage remains >80% after mock removal
- [ ] Tests run reliably with real MCP test servers
- [ ] No flaky tests due to mock/real data mismatches

## ⚠️ **Risk Mitigation**

### **High-Risk Areas**
1. **Component Breaking Changes**
   - Risk: Real MCP data structure differs from mocks
   - Mitigation: Validate schemas before removing mocks

2. **Performance Degradation**
   - Risk: Real MCP calls slower than mocks
   - Mitigation: Add caching and optimize MCP server performance

3. **Test Reliability**
   - Risk: Real MCP servers less reliable than mocks
   - Mitigation: Use test-specific MCP servers with controlled data

### **Rollback Plan**
- Keep mock data in git history for emergency rollback
- Feature flag real MCP integration for gradual rollout
- Maintain parallel mock and real implementations during transition

## 📅 **Implementation Timeline**

### **Week 1: Preparation & Audit**
- Day 1-2: Complete mock data audit
- Day 3-4: Set up real MCP server infrastructure
- Day 5: Create schema validation framework

### **Week 2: Implementation & Testing**
- Day 1-2: Replace MCPClient with real implementation
- Day 3-4: Update all components to work with real data
- Day 5: Implement integration testing framework

### **Week 3: Cleanup & Validation**
- Day 1-2: Remove all mock data and clean up files
- Day 3-4: Run comprehensive integration tests
- Day 5: Performance testing and optimization

## 🎯 **Definition of Done**

- [ ] Zero references to mock data in production code
- [ ] All MCP calls use real JSON-RPC 2.0 protocol
- [ ] All components render correctly with real MCP data
- [ ] Integration tests pass with real MCP servers
- [ ] Performance meets requirements (<2s for MCP calls)
- [ ] Error handling works with real MCP server errors
- [ ] Documentation updated to reflect real MCP usage
- [ ] Code review completed and approved

---

**This plan ensures a systematic and safe transition from mock data to real MCP integration, maintaining code quality and functionality throughout the process.**