# syntax=docker/dockerfile:1

FROM node:24-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# 1. Install every package, exactly as locked in package-lock.json.
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# 2. Compile the app.
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Only satisfies the startup check in env.ts; nothing connects during the build.
ENV DATABASE_URL=postgres://build:build@localhost:5432/build
RUN npm run build

# 3. Tools: migrations and creating the first Administrator.
FROM build AS tools
CMD ["npx", "dbmate", "--help"]

# 4. The app itself: only the compiled output, run as a non-root user.
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]