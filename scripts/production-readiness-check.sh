#!/bin/bash

# Production Readiness Check for SkillBridge
# This script verifies that all systems are ready for production deployment

set -e

echo "🔍 SkillBridge Production Readiness Check"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
WARNINGS=0

# Helper functions
check_pass() {
    echo -e "${GREEN}✅ $1${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
}

check_fail() {
    echo -e "${RED}❌ $1${NC}"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
}

check_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    WARNINGS=$((WARNINGS + 1))
}

check_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo ""
echo "📋 Checking Core Files..."

# Check if essential files exist
if [ -f "package.json" ]; then
    check_pass "package.json exists"
else
    check_fail "package.json missing"
fi

if [ -f "src/App.tsx" ]; then
    check_pass "React app entry point exists"
else
    check_fail "React app entry point missing"
fi

if [ -f "src/hooks/useMCP.ts" ]; then
    check_pass "MCP client hooks exist"
else
    check_fail "MCP client hooks missing"
fi

if [ -f "src/config/mcpConfig.ts" ]; then
    check_pass "MCP configuration exists"
else
    check_fail "MCP configuration missing"
fi

echo ""
echo "🔧 Checking MCP Servers..."

# Check MCP servers
MCP_SERVERS=("githubFetcher.ts" "portfolioAnalyzer.ts" "resumeTipsProvider.ts" "roadmapProvider.ts")
for server in "${MCP_SERVERS[@]}"; do
    if [ -f "mcp-servers/$server" ]; then
        check_pass "MCP server $server exists"
    else
        check_fail "MCP server $server missing"
    fi
done

# Check compiled MCP servers
echo ""
echo "📦 Checking Compiled MCP Servers..."
if [ -d "dist/mcp-servers" ]; then
    check_pass "MCP servers build directory exists"
    
    for server in "${MCP_SERVERS[@]}"; do
        compiled_server="dist/mcp-servers/${server%.ts}.js"
        if [ -f "$compiled_server" ]; then
            check_pass "Compiled server ${server%.ts}.js exists"
            
            # Check if executable
            if [ -x "$compiled_server" ]; then
                check_pass "Server ${server%.ts}.js is executable"
            else
                check_warn "Server ${server%.ts}.js is not executable"
            fi
        else
            check_fail "Compiled server ${server%.ts}.js missing"
        fi
    done
else
    check_fail "MCP servers not built - run 'npm run build:mcp'"
fi

echo ""
echo "🗄️ Checking Database Configuration..."

# Check server directory and database setup
if [ -d "server" ]; then
    check_pass "Server directory exists"
    
    if [ -f "server/prisma/schema.prisma" ]; then
        check_pass "Database schema exists"
    else
        check_fail "Database schema missing"
    fi
    
    if [ -f "server/src/index.ts" ]; then
        check_pass "Server entry point exists"
    else
        check_fail "Server entry point missing"
    fi
    
    if [ -f "server/package.json" ]; then
        check_pass "Server package.json exists"
    else
        check_fail "Server package.json missing"
    fi
else
    check_fail "Server directory missing"
fi

echo ""
echo "🔐 Checking Authentication System..."

# Check auth files
if [ -f "server/src/routes/auth.ts" ]; then
    check_pass "Authentication routes exist"
else
    check_fail "Authentication routes missing"
fi

if [ -f "server/src/config/passport.ts" ]; then
    check_pass "Passport configuration exists"
else
    check_fail "Passport configuration missing"
fi

if [ -f "src/contexts/AuthContext.tsx" ]; then
    check_pass "Frontend auth context exists"
else
    check_fail "Frontend auth context missing"
fi

echo ""
echo "🧪 Checking Test Configuration..."

# Check test files
if [ -f "src/setupTests.ts" ]; then
    check_pass "Test setup configuration exists"
else
    check_warn "Test setup configuration missing"
fi

if [ -d "src/__tests__" ]; then
    check_pass "Test directory exists"
    
    # Count test files
    test_count=$(find src/__tests__ -name "*.test.tsx" -o -name "*.test.ts" | wc -l)
    if [ "$test_count" -gt 0 ]; then
        check_pass "Found $test_count test files"
    else
        check_warn "No test files found"
    fi
else
    check_warn "Test directory missing"
fi

echo ""
echo "📝 Checking Configuration Files..."

# Check configuration files
if [ -f ".kiro/settings/mcp.json" ]; then
    check_pass "MCP configuration file exists"
else
    check_warn "MCP configuration file missing"
fi

if [ -f "tailwind.config.js" ]; then
    check_pass "Tailwind configuration exists"
else
    check_fail "Tailwind configuration missing"
fi

if [ -f "tsconfig.json" ]; then
    check_pass "TypeScript configuration exists"
else
    check_fail "TypeScript configuration missing"
fi

echo ""
echo "📚 Checking Documentation..."

if [ -f "README.md" ]; then
    check_pass "README.md exists"
else
    check_warn "README.md missing"
fi

if [ -f "docs/PRODUCTION_DEPLOYMENT.md" ]; then
    check_pass "Production deployment guide exists"
else
    check_warn "Production deployment guide missing"
fi

echo ""
echo "🔍 Checking Dependencies..."

# Check if node_modules exists
if [ -d "node_modules" ]; then
    check_pass "Dependencies installed"
else
    check_fail "Dependencies not installed - run 'npm install'"
fi

# Check if server dependencies exist
if [ -d "server/node_modules" ]; then
    check_pass "Server dependencies installed"
else
    check_warn "Server dependencies not installed - run 'cd server && npm install'"
fi

echo ""
echo "🏗️ Checking Build System..."

# Check if build scripts exist
if grep -q "build:mcp" package.json; then
    check_pass "MCP build script configured"
else
    check_fail "MCP build script missing"
fi

if grep -q "build:production" package.json; then
    check_pass "Production build script configured"
else
    check_fail "Production build script missing"
fi

# Check if build directory exists (if built)
if [ -d "build" ]; then
    check_pass "React build directory exists"
    
    if [ -f "build/index.html" ]; then
        check_pass "React build output exists"
    else
        check_warn "React build incomplete"
    fi
else
    check_info "React app not built yet - run 'npm run build'"
fi

echo ""
echo "========================================"
echo "📊 Production Readiness Summary"
echo "========================================"

echo -e "${GREEN}✅ Checks Passed: $CHECKS_PASSED${NC}"
if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
fi
if [ $CHECKS_FAILED -gt 0 ]; then
    echo -e "${RED}❌ Checks Failed: $CHECKS_FAILED${NC}"
fi

echo ""

# Determine overall status
if [ $CHECKS_FAILED -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}🚀 PRODUCTION READY!${NC}"
        echo "All systems are go for production deployment."
    else
        echo -e "${YELLOW}⚠️  MOSTLY READY${NC}"
        echo "Ready for production with minor warnings to address."
    fi
    echo ""
    echo "Next steps:"
    echo "1. Set up environment variables"
    echo "2. Configure database connection"
    echo "3. Set up GitHub OAuth app"
    echo "4. Deploy to your hosting provider"
    echo ""
    echo "See docs/PRODUCTION_DEPLOYMENT.md for detailed instructions."
    exit 0
else
    echo -e "${RED}❌ NOT READY FOR PRODUCTION${NC}"
    echo "Please fix the failed checks before deploying."
    echo ""
    echo "Common fixes:"
    echo "- Run 'npm install' to install dependencies"
    echo "- Run 'npm run build:mcp' to build MCP servers"
    echo "- Check that all required files are present"
    exit 1
fi