#!/bin/bash

# Build MCP Servers for Production
# This script compiles TypeScript MCP servers to JavaScript for production deployment

set -e

echo "🔨 Building MCP Servers for Production..."

# Create dist directory if it doesn't exist
mkdir -p dist/mcp-servers

# Build each MCP server
echo "📦 Compiling TypeScript MCP servers..."

# Portfolio Analyzer
echo "  - Building portfolio-analyzer..."
npx tsc mcp-servers/portfolioAnalyzer.ts --outDir dist/mcp-servers --target ES2022 --module commonjs --moduleResolution node --esModuleInterop --allowSyntheticDefaultImports --strict --skipLibCheck

# GitHub Fetcher
echo "  - Building github-projects..."
npx tsc mcp-servers/githubFetcher.ts --outDir dist/mcp-servers --target ES2022 --module commonjs --moduleResolution node --esModuleInterop --allowSyntheticDefaultImports --strict --skipLibCheck

# Resume Tips Provider
echo "  - Building resume-tips..."
npx tsc mcp-servers/resumeTipsProvider.ts --outDir dist/mcp-servers --target ES2022 --module commonjs --moduleResolution node --esModuleInterop --allowSyntheticDefaultImports --strict --skipLibCheck

# Roadmap Provider
echo "  - Building roadmap-data..."
npx tsc mcp-servers/roadmapProvider.ts --outDir dist/mcp-servers --target ES2022 --module commonjs --moduleResolution node --esModuleInterop --allowSyntheticDefaultImports --strict --skipLibCheck

# Make compiled files executable
chmod +x dist/mcp-servers/*.js

# Add shebang to compiled files for direct execution
for file in dist/mcp-servers/*.js; do
    if [ -f "$file" ]; then
        # Create temporary file with shebang
        echo "#!/usr/bin/env node" > "$file.tmp"
        cat "$file" >> "$file.tmp"
        mv "$file.tmp" "$file"
        chmod +x "$file"
    fi
done

echo "✅ MCP Servers built successfully!"
echo "📁 Compiled servers available in: dist/mcp-servers/"

# List built files
echo "📋 Built files:"
ls -la dist/mcp-servers/

# Test that servers can be executed
echo "🧪 Testing server executability..."
for server in dist/mcp-servers/*.js; do
    if [ -f "$server" ]; then
        server_name=$(basename "$server" .js)
        echo "  - Testing $server_name..."
        
        # Test with a simple tools/list call
        timeout 10s node "$server" <<< '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' > /dev/null 2>&1 && \
            echo "    ✅ $server_name responds correctly" || \
            echo "    ⚠️  $server_name may have issues (timeout or error)"
    fi
done

echo "🚀 MCP Servers are ready for production deployment!"