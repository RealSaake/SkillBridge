# Multi-stage Dockerfile for SkillBridge Production Deployment

# Stage 1: Build MCP Servers
FROM node:18-alpine AS mcp-builder
WORKDIR /app
COPY package*.json ./
COPY mcp-servers/ ./mcp-servers/
COPY scripts/build-mcp-servers.sh ./scripts/
RUN npm install
RUN chmod +x scripts/build-mcp-servers.sh
RUN npm run build:mcp

# Stage 2: Build Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
COPY public/ ./public/
COPY src/ ./src/
COPY tailwind.config.js ./
COPY tsconfig.json ./
RUN npm install
RUN npm run build

# Stage 3: Build Backend
FROM node:18-alpine AS backend-builder
WORKDIR /app
COPY server/package*.json ./server/
COPY server/src/ ./server/src/
COPY server/prisma/ ./server/prisma/
COPY server/tsconfig.json ./server/
RUN cd server && npm install
RUN cd server && npm run build

# Stage 4: Production Runtime
FROM node:18-alpine AS production
WORKDIR /app

# Install production dependencies
COPY server/package*.json ./server/
RUN cd server && npm ci --only=production

# Copy built applications
COPY --from=mcp-builder /app/dist/mcp-servers/ ./dist/mcp-servers/
COPY --from=frontend-builder /app/build/ ./build/
COPY --from=backend-builder /app/server/dist/ ./server/dist/
COPY --from=backend-builder /app/server/prisma/ ./server/prisma/

# Copy configuration files
COPY server/.env.example ./server/.env.example

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S skillbridge -u 1001
RUN chown -R skillbridge:nodejs /app
USER skillbridge

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "server/dist/index.js"]