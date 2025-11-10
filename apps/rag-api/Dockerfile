# Multi-stage build for minimal production image
FROM node:18-alpine AS base

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/rag-api/package.json ./apps/rag-api/
COPY packages/rag-core/package.json ./packages/rag-core/
COPY packages/rag-providers/package.json ./packages/rag-providers/
COPY packages/typescript-config ./packages/typescript-config/

# ===================================
# Dependencies stage
# ===================================
FROM base AS deps

# Install all dependencies (including dev)
RUN pnpm install --frozen-lockfile

# ===================================
# Builder stage
# ===================================
FROM base AS builder

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/rag-api/node_modules ./apps/rag-api/node_modules
COPY --from=deps /app/packages/rag-core/node_modules ./packages/rag-core/node_modules
COPY --from=deps /app/packages/rag-providers/node_modules ./packages/rag-providers/node_modules

# Copy source code
COPY packages/rag-core ./packages/rag-core
COPY packages/rag-providers ./packages/rag-providers
COPY apps/rag-api ./apps/rag-api
COPY turbo.json ./

# Build packages
RUN pnpm build --filter=@rag-pipeline/core
RUN pnpm build --filter=@rag-pipeline/providers
RUN pnpm build --filter=@rag-pipeline/api

# ===================================
# Production stage
# ===================================
FROM node:18-alpine AS runner

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/rag-api/package.json ./apps/rag-api/
COPY packages/rag-core/package.json ./packages/rag-core/
COPY packages/rag-providers/package.json ./packages/rag-providers/

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built files from builder
COPY --from=builder /app/packages/rag-core/dist ./packages/rag-core/dist
COPY --from=builder /app/packages/rag-providers/dist ./packages/rag-providers/dist
COPY --from=builder /app/apps/rag-api/dist ./apps/rag-api/dist

# Create data directory for filesystem vector store
RUN mkdir -p /app/data/vectors && chown -R nodejs:nodejs /app/data

# Switch to app user
USER nodejs

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "apps/rag-api/dist/index.js"]
