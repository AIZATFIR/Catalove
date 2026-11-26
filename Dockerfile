# Build a minimal, non-root Next.js image for Cloud Run.
FROM node:22-slim AS base

FROM base AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# These are public browser configuration, never server secrets.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_CATALOVE_SUPABASE_PROJECT_REF
RUN env -u NEXT_PUBLIC_SUPABASE_URL \
  -u NEXT_PUBLIC_SUPABASE_ANON_KEY \
  -u NEXT_PUBLIC_CATALOVE_SUPABASE_PROJECT_REF \
  npm test

RUN test -n "$NEXT_PUBLIC_SUPABASE_URL" \
  && test -n "$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  && test -n "$NEXT_PUBLIC_CATALOVE_SUPABASE_PROJECT_REF" \
  && NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  NEXT_PUBLIC_CATALOVE_SUPABASE_PROJECT_REF="$NEXT_PUBLIC_CATALOVE_SUPABASE_PROJECT_REF" \
  npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=8080 HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 8080
CMD ["node", "server.js"]
