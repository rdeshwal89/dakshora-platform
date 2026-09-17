# =============================================================================
# DAKSHORA 2.0 - BACKEND FASTIFY API GATEWAY DOCKERFILE
# Multi-stage optimized production image
# =============================================================================

FROM node:20-alpine AS builder
WORKDIR /app

# Install build dependencies
COPY package*.json tsconfig.json ./
RUN npm ci

# Copy source and scripts
COPY src ./src
COPY scripts ./scripts

# Build TypeScript to dist/
RUN npm run build

# Production runner stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled artifacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/scripts ./scripts

# Expose API Gateway port
EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

CMD ["npm", "start"]
