# ---- deps: повні залежності для збірки ----
FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ---- build: компіляція TS -> dist ----
FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- production: тільки runtime-залежності + dist ----
FROM node:24-alpine AS production
# NODE_ENV і PORT — тут, а не в env Coolify: build-змінна NODE_ENV=production
# змусила б npm ci у стадії deps пропустити devDependencies, і nest build упав би.
ENV NODE_ENV=production
ENV PORT=3008
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3008
# Coolify бере healthcheck з образу: новий контейнер отримує трафік лише після
# успішної перевірки, а невдалий деплой лишає старий. start-period — запас на міграції.
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -q -O /dev/null "http://127.0.0.1:$PORT/health" || exit 1
CMD ["node", "dist/main"]
