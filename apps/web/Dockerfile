# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install pnpm
RUN corepack enable pnpm

# Copy package files first
COPY apps/web/package.json ./

# Install dependencies
RUN pnpm install

# Copy config files needed for build
COPY apps/web/postcss.config.js apps/web/tailwind.config.js apps/web/next.config.js apps/web/tsconfig.json apps/web/next-env.d.ts ./

# Copy source files (excluding node_modules due to .dockerignore)
COPY apps/web/app ./app
COPY apps/web/components ./components
COPY apps/web/public ./public

# Build the application
RUN pnpm build

# Production stage
FROM node:20-alpine AS runner

# Set working directory
WORKDIR /app

# Install pnpm in production image
RUN corepack enable pnpm

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application from builder stage  
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Set up environment
ENV NODE_ENV=production
ENV PORT=3333
ENV HOSTNAME=0.0.0.0

# Expose port
EXPOSE 3333

# Switch to non-root user
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3333/api/status || exit 1

# Start the application
CMD ["node", "server.js"]