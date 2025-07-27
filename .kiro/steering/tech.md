# Technology Stack

## Core Technologies

- **Runtime**: Node.js with TypeScript
- **MCP SDK**: @modelcontextprotocol/sdk for server implementation
- **Build System**: TypeScript compiler (tsc)
- **Development**: tsx for TypeScript execution and hot reloading

## Project Configuration

- **TypeScript**: ES2022 target, ESNext modules, strict mode enabled
- **Module Resolution**: Node.js style with synthetic default imports
- **Output**: Compiled to `./dist` directory from `./mcp-servers` source

## Common Commands

```bash
# Install dependencies
npm install

# Development with hot reload
npm run dev

# Build TypeScript to JavaScript
npm run build

# Test individual MCP servers
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | npx tsx mcp-servers/[serverName].ts
```

## MCP Server Architecture

- Each server follows the MCP protocol specification
- Servers use stdio transport for communication
- Standard pattern: ListToolsRequestSchema and CallToolRequestSchema handlers
- Error handling with structured error responses
- JSON-RPC 2.0 protocol compliance

## Development Patterns

- Shebang (`#!/usr/bin/env node`) for executable scripts
- Async/await for all asynchronous operations
- Structured error handling with try/catch blocks
- Type-safe argument destructuring with TypeScript interfaces