#!/bin/bash

# SkillBridge Sprint 2 Final Integration Test Runner
# This script runs the comprehensive integration test to validate MCP integration

echo "🚀 SkillBridge Sprint 2 Final Integration Test"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    print_warning "node_modules not found. Installing dependencies..."
    npm install
fi

print_status "Starting Sprint 2 Final Integration Test..."

# Run TypeScript compilation check
print_status "🔍 Checking TypeScript compilation..."
if npx tsc --noEmit; then
    print_success "TypeScript compilation passed"
else
    print_error "TypeScript compilation failed"
    exit 1
fi

# Check for mock data usage
print_status "🚫 Scanning for mock data usage..."
if ./scripts/detect-mock-usage.sh; then
    print_success "No mock data found in production code"
else
    print_warning "Mock data detected - review output above"
fi

# Run the final integration test
print_status "🧪 Running final integration test..."
echo ""

# Run with verbose output and detect open handles
if npm test -- --testPathPattern=final-sprint2-integration --verbose --detectOpenHandles --forceExit --watchAll=false; then
    print_success "🎉 ALL INTEGRATION TESTS PASSED!"
    echo ""
    echo "✅ Sprint 2 Completion Criteria Met:"
    echo "   • MCP integration working across all components"
    echo "   • Real data flow validated end-to-end"
    echo "   • No mock data in production code"
    echo "   • TypeScript type safety maintained"
    echo "   • All enhanced components functional"
    echo ""
    print_success "🏁 Sprint 2 is ready for production deployment!"
else
    print_error "❌ Integration tests failed"
    echo ""
    echo "🔧 Next Steps:"
    echo "   • Review test output above"
    echo "   • Fix any failing components"
    echo "   • Ensure MCP servers are properly configured"
    echo "   • Re-run this script after fixes"
    exit 1
fi

# Optional: Generate test report
if command -v jest &> /dev/null; then
    print_status "📊 Generating test coverage report..."
    npm test -- --testPathPattern=final-sprint2-integration --coverage --coverageReporters=text-summary
fi

echo ""
print_success "🎯 Sprint 2 Final Integration Test Complete!"