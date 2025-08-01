#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    CallToolRequest
} from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
    {
        name: 'github-fetcher',
        version: '0.1.0',
    },
    {
        capabilities: {
            tools: {}
        }
    }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'fetch_github_repos',
                description: 'Fetch GitHub repositories for a user or organization',
                inputSchema: {
                    type: 'object',
                    properties: {
                        username: {
                            type: 'string',
                            description: 'GitHub username or organization name',
                        },
                        type: {
                            type: 'string',
                            enum: ['user', 'org'],
                            description: 'Whether to fetch user or organization repos',
                            default: 'user',
                        },
                    },
                    required: ['username'],
                },
            },
            {
                name: 'fetch_github_profile',
                description: 'Fetch GitHub user profile information',
                inputSchema: {
                    type: 'object',
                    properties: {
                        username: {
                            type: 'string',
                            description: 'GitHub username',
                        },
                    },
                    required: ['username'],
                },
            },
        ],
    };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
    const { name, arguments: args } = request.params;

    try {
        switch (name) {
            case 'fetch_github_repos': {
                const { username, type = 'user' } = args as { username: string; type?: string };

                // Use type parameter for org vs user endpoints
                const endpoint = type === 'org' ? 'orgs' : 'users';
                const url = `https://api.github.com/${endpoint}/${username}/repos`;

                try {
                    const response = await fetch(url, {
                        headers: {
                            'User-Agent': 'SkillBridge-MCP/1.0',
                            ...(process.env.GITHUB_TOKEN && {
                                'Authorization': `token ${process.env.GITHUB_TOKEN}`
                            })
                        }
                    });

                    if (response.status === 403) {
                        // Rate limit hit - implement exponential backoff
                        const resetTime = response.headers.get('X-RateLimit-Reset');
                        const waitTime = resetTime ? new Date(parseInt(resetTime) * 1000) : new Date(Date.now() + 60000);
                        throw new Error(`GitHub API rate limit exceeded. Please try again after ${waitTime.toLocaleTimeString()}.`);
                    }

                    if (response.status === 404) {
                        throw new Error(`GitHub user or organization '${username}' not found.`);
                    }

                    if (!response.ok) {
                        throw new Error(`GitHub API error: ${response.status} - ${response.statusText}`);
                    }

                    const repos = await response.json();
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify(repos, null, 2),
                            },
                        ],
                    };
                } catch (fetchError) {
                    console.error(`GitHub API fetch failed for ${username}:`, fetchError);
                    
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({ error: 'Failed to fetch GitHub repositories. Please check your GitHub connection and try again.' }, null, 2),
                            },
                        ],
                        isError: true,
                    };
                }
            }

            case 'fetch_github_profile': {
                const { username } = args as { username: string };
                const url = `https://api.github.com/users/${username}`;

                try {
                    const response = await fetch(url, {
                        headers: {
                            'User-Agent': 'SkillBridge-MCP/1.0',
                            ...(process.env.GITHUB_TOKEN && {
                                'Authorization': `token ${process.env.GITHUB_TOKEN}`
                            })
                        }
                    });

                    if (response.status === 403) {
                        const resetTime = response.headers.get('X-RateLimit-Reset');
                        const waitTime = resetTime ? new Date(parseInt(resetTime) * 1000) : new Date(Date.now() + 60000);
                        throw new Error(`GitHub API rate limit exceeded. Please try again after ${waitTime.toLocaleTimeString()}.`);
                    }

                    if (response.status === 404) {
                        throw new Error(`GitHub user '${username}' not found.`);
                    }

                    if (!response.ok) {
                        throw new Error(`GitHub API error: ${response.status} - ${response.statusText}`);
                    }

                    const profile = await response.json();
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify(profile, null, 2),
                            },
                        ],
                    };
                } catch (fetchError) {
                    console.error(`GitHub API fetch failed for ${username}:`, fetchError);
                    
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({ error: 'Failed to fetch GitHub profile. Please check your GitHub connection and try again.' }, null, 2),
                            },
                        ],
                        isError: true,
                    };
                }
            }

            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    } catch (error) {
        console.error(`GitHub Fetcher error for tool ${name}:`, error);

        // Provide user-friendly error messages
        let userMessage = 'Something went wrong. Our team has been notified and we\'re working on a fix.';

        if (error instanceof Error) {
            if (error.message.includes('rate limit')) {
                userMessage = 'We\'re experiencing high demand. Please try again in a few minutes.';
            } else if (error.message.includes('not found')) {
                userMessage = error.message;
            } else if (error.message.includes('GitHub API')) {
                userMessage = 'Unable to connect to GitHub. Please check your connection and try again.';
            }
        }

        return {
            content: [
                {
                    type: 'text',
                    text: `Error: ${userMessage}`,
                },
            ],
            isError: true,
        };
    }
});

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('GitHub Fetcher MCP server running on stdio');
}

main().catch(console.error);