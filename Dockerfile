#use official Bun image current version 
# see all versions at https://hub.docker.com/r/oven/bun/tags

FROM oven/bun:1 AS builder
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM oven/bun:1-slim AS runner
WORKDIR /app

# Create non-root user
RUN groupadd -g 1001 appgroup && useradd -u 1001 -g appgroup -m appuser

COPY --from=builder --chown=appuser:appgroup /app/dist ./dist

USER appuser

ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321

CMD ["bun", "./dist/server/entry.mjs"]