# Project Structure

## Directory Organization

```
├── .kiro/                    # Kiro IDE configuration
│   └── settings/
│       └── mcp.json         # MCP server configuration
├── mcp-servers/             # MCP server implementations
│   ├── githubFetcher.ts     # GitHub API integration server
│   ├── portfolioAnalyzer.ts # Portfolio analysis server
│   ├── resumeTipsProvider.ts # Resume tips and analysis server
│   └── roadmapProvider.ts   # Career roadmap server
├── public/                  # Static assets and sample data
│   └── sample-data.json     # Sample job and skill data
├── dist/                    # Compiled TypeScript output (generated)
└── node_modules/            # Dependencies (generated)
```

## File Naming Conventions

- **MCP Servers**: camelCase with descriptive names (e.g., `githubFetcher.ts`)
- **Configuration**: lowercase with hyphens for multi-word files
- **Data Files**: kebab-case for JSON files (e.g., `sample-data.json`)

## MCP Server Structure

Each MCP server follows a consistent pattern:

1. **Imports**: MCP SDK components and types
2. **Server Setup**: Server instance with name, version, and capabilities
3. **Tool Definitions**: ListToolsRequestSchema handler with input schemas
4. **Tool Implementation**: CallToolRequestSchema handler with business logic
5. **Main Function**: Transport setup and server connection
6. **Error Handling**: Structured error responses throughout

## Configuration Management

- MCP servers are configured in `.kiro/settings/mcp.json`
- Each server has a unique name matching its primary function
- Server capabilities are declared in the server constructor
- Tool schemas use JSON Schema for input validation

## Data Organization

- Static data stored in `public/` directory
- Sample data provides examples of expected data structures
- In-memory data stores used for demonstration purposes
- External API integrations handled with proper error handling