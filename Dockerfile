# Uxie API (server/) for Render. The web app deploys separately to Netlify.
# Build context is the repo root: the server reads ../avatars and the UX principles skill.
FROM node:26-bookworm-slim
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev && npx playwright install --with-deps chromium && rm -rf /var/lib/apt/lists/*
COPY server/src ./src
COPY avatars ../avatars
COPY .agents/skills/tullis-albert-ux-metrics/SKILL.md ../.agents/skills/tullis-albert-ux-metrics/SKILL.md
ENV NODE_ENV=production
# Render free (512 MB) fits one browser at a time; raise on a bigger plan via the dashboard.
ENV MAX_PARALLEL_VISITORS=1
# Lighter browser and no replays on 512 MB; set UXIE_LITE=0 on a bigger plan.
ENV UXIE_LITE=1
CMD ["node", "src/index.ts"]
