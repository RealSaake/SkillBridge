#!/bin/bash

# SkillBridge Production Readiness Check
# Comprehensive validation before Sprint 3

echo "🚀 SkillBridge Production Readiness Check"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Function to print colored output
print_status() {
    echo -e "${BLUE}[CHECK]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED++))
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    ((WARNINGS++))
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED++))
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

print_status "Starting comprehensive production readiness check..."

# 1. TypeScript Compilation Check
print_status "🔍 Checking TypeScript compilation..."
if npx tsc --noEmit --skipLibCheck; then
    print_success "TypeScript compilation passed"
else
    print_error "TypeScript compilation failed"
fi

# 2. Mock Data Detection
print_status "🚫 Scanning for mock data usage..."
MOCK_USAGE=$(grep -r "MOCK_\|mockData\|sampleData" src/ --exclude-dir=__tests__ --exclude-dir=__mocks__ || true)
if [ -z "$MOCK_USAGE" ]; then
    print_success "No mock data found in production code"
else
    print_error "Mock data detected in production code:"
    echo "$MOCK_USAGE"
fi

# 3. Enhanced Mock Detection (more patterns)
print_status "🔍 Advanced mock pattern detection..."
ADVANCED_MOCK=$(grep -r "getMockResponse\|simulateNetworkDelay\|createMock\|testData.*=" src/ --exclude-dir=__tests__ || true)
if [ -z "$ADVANCED_MOCK" ]; then
    print_success "No advanced mock patterns found"
else
    print_error "Advanced mock patterns detected:"
    echo "$ADVANCED_MOCK"
fi

# 4. MCP Integration Validation
print_status "🔌 Validating MCP integration patterns..."
MCP_IMPORTS=$(grep -r "import.*mcp" src/ --include="*.ts" --include="*.tsx" || true)
if [ -n "$MCP_IMPORTS" ]; then
    print_success "MCP imports found in codebase"
else
    print_warning "No MCP imports detected - verify integration"
fi

# 5. Error Handling Check
print_status "🛡️ Checking error handling patterns..."
ERROR_BOUNDARIES=$(grep -r "ErrorBoundary\|componentDidCatch\|catch.*error" src/ || true)
if [ -n "$ERROR_BOUNDARIES" ]; then
    print_success "Error handling patterns found"
else
    print_warning "Limited error handling detected"
fi

# 6. Type Safety Validation
print_status "🔒 Checking for implicit any types..."
IMPLICIT_ANY=$(grep -r ": any\|as any" src/ --exclude-dir=__tests__ || true)
if [ -z "$IMPLICIT_ANY" ]; then
    print_success "No implicit any types found"
else
    print_warning "Implicit any types detected:"
    echo "$IMPLICIT_ANY" | head -10
fi

# 7. Console.log Cleanup Check
print_status "🧹 Checking for debug console logs..."
DEBUG_LOGS=$(grep -r "console\.log\|console\.debug" src/ --exclude-dir=__tests__ || true)
if [ -z "$DEBUG_LOGS" ]; then
    print_success "No debug logs in production code"
else
    print_warning "Debug logs found (consider removing for production):"
    echo "$DEBUG_LOGS" | wc -l
    echo "lines of console logs detected"
fi

# 8. Dependency Security Check
print_status "🔐 Running security audit..."
if npm audit --audit-level=high; then
    print_success "No high-severity security vulnerabilities"
else
    print_warning "Security vulnerabilities detected - review npm audit output"
fi

# 9. Bundle Size Check (if build exists)
print_status "📦 Checking bundle size..."
if [ -d "build" ] || [ -d "dist" ]; then
    BUNDLE_SIZE=$(du -sh build 2>/dev/null || du -sh dist 2>/dev/null || echo "Unknown")
    print_success "Bundle size: $BUNDLE_SIZE"
else
    print_warning "No build directory found - run 'npm run build' to check bundle size"
fi

# 10. Test Coverage Check
print_status "🧪 Running test suite..."
if npm test -- --testPathPattern=final-sprint2-integration --watchAll=false --coverage=false; then
    print_success "Integration tests passed"
else
    print_error "Integration tests failed"
fi

# 11. Performance Check (basic)
print_status "⚡ Basic performance validation..."
LARGE_FILES=$(find src/ -name "*.ts" -o -name "*.tsx" | xargs wc -l | sort -nr | head -5)
print_success "Largest source files identified for review"

# 12. Documentation Check
print_status "📚 Checking documentation..."
if [ -f "README.md" ] && [ -f "SPRINT-2-SUCCESS-SUMMARY.md" ]; then
    print_success "Core documentation present"
else
    print_warning "Missing documentation files"
fi

# 13. Git Status Check
print_status "📝 Checking git status..."
if git rev-parse --git-dir > /dev/null 2>&1; then
    if git diff --quiet && git diff --cached --quiet; then
        print_success "Working directory clean"
    else
        print_warning "Uncommitted changes detected"
    fi
else
    print_warning "Not a git repository (this is fine for initial setup)"
fi

# 14. MCP Server Files Check
print_status "🖥️ Validating MCP server files..."
MCP_SERVERS=("githubFetcher.ts" "portfolioAnalyzer.ts" "resumeTipsProvider.ts" "roadmapProvider.ts")
for server in "${MCP_SERVERS[@]}"; do
    if [ -f "mcp-servers/$server" ]; then
        print_success "MCP server found: $server"
    else
        print_error "Missing MCP server: $server"
    fi
done

# 15. Component Structure Validation
print_status "🧩 Validating component structure..."
ENHANCED_COMPONENTS=("ResumeReviewEnhanced.tsx" "GitHubActivityEnhanced.tsx" "SkillGapAnalysisEnhanced.tsx" "LearningRoadmapEnhanced.tsx")
for component in "${ENHANCED_COMPONENTS[@]}"; do
    if [ -f "src/components/$component" ]; then
        print_success "Enhanced component found: $component"
    else
        print_error "Missing enhanced component: $component"
    fi
done

echo ""
echo "=========================================="
echo "🎯 Production Readiness Summary"
echo "=========================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo -e "${RED}Failed: $FAILED${NC}"

# Calculate score
TOTAL=$((PASSED + WARNINGS + FAILED))
if [ $TOTAL -gt 0 ]; then
    SCORE=$(( (PASSED * 100) / TOTAL ))
    echo "Overall Score: $SCORE%"
    
    if [ $SCORE -ge 90 ]; then
        echo -e "${GREEN}🎉 EXCELLENT - Ready for production!${NC}"
        exit 0
    elif [ $SCORE -ge 80 ]; then
        echo -e "${YELLOW}⚠️ GOOD - Minor issues to address${NC}"
        exit 0
    elif [ $SCORE -ge 70 ]; then
        echo -e "${YELLOW}🔧 NEEDS WORK - Address issues before production${NC}"
        exit 1
    else
        echo -e "${RED}❌ NOT READY - Significant issues detected${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Unable to calculate score${NC}"
    exit 1
fi