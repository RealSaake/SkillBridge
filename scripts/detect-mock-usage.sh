#!/bin/bash
# Mock Debt Detection Script
# Prevents mock usage in production code

echo "🔍 Scanning for mock usage in production code..."

# Check for mock imports (excluding test directories)
MOCK_IMPORTS=$(grep -r "import.*mock" src/ --exclude-dir=__tests__ --exclude-dir=__mocks__ --exclude="*.test.*" --exclude="*.spec.*" || true)

# Check for mock function calls
MOCK_CALLS=$(grep -r "getMockResponse\|MockMCP\|simulateNetworkDelay" src/ --exclude-dir=__tests__ --exclude-dir=__mocks__ --exclude="*.test.*" --exclude="*.spec.*" || true)

# Check for mock data structures
MOCK_DATA=$(grep -r "mockData\|mockResponse\|MOCK_" src/ --exclude-dir=__tests__ --exclude-dir=__mocks__ --exclude="*.test.*" --exclude="*.spec.*" || true)

if [ -n "$MOCK_IMPORTS" ] || [ -n "$MOCK_CALLS" ] || [ -n "$MOCK_DATA" ]; then
  echo "❌ Mock usage detected in production code:"
  
  if [ -n "$MOCK_IMPORTS" ]; then
    echo "📦 Mock Imports:"
    echo "$MOCK_IMPORTS"
    echo ""
  fi
  
  if [ -n "$MOCK_CALLS" ]; then
    echo "🔧 Mock Function Calls:"
    echo "$MOCK_CALLS"
    echo ""
  fi
  
  if [ -n "$MOCK_DATA" ]; then
    echo "📊 Mock Data Structures:"
    echo "$MOCK_DATA"
    echo ""
  fi
  
  echo "💡 Remove mock dependencies before committing"
  echo "📋 See MOCK-DEBT-BURNDOWN.md for cleanup checklist"
  exit 1
else
  echo "✅ No mock usage detected in production code"
  echo "🎉 Mock-free quality gate: PASSED"
fi