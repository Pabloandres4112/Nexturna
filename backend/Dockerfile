# syntax=docker/dockerfile:1

# ---- Etapa 1: build ----
# Version de Node y pnpm fijas a un patch exacto: un rebuild dentro de 6 meses
# no debe traer un Node/pnpm distinto por sorpresa. Alpine tambien queda fijo
# (node:22-alpine sin version pisa el "ultimo Alpine disponible" en cada build).
FROM node:22.12.0-alpine3.21 AS builder

# Herramientas de compilacion nativa: bcrypt (bcrypt.hash/compare en AuthService)
# compila un addon nativo en install. Solo existen en esta etapa, no en runtime.
RUN apk add --no-cache python3 make g++

RUN npm install -g pnpm@10.28.0

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# Deja node_modules solo con dependencias de produccion, conservando los
# binarios nativos ya compilados para este mismo Alpine/musl.
RUN pnpm prune --prod

# ---- Etapa 2: runtime ----
# Imagen limpia: sin compiladores, sin devDependencies, sin codigo fuente TS.
FROM node:22.12.0-alpine3.21 AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# No correr como root dentro del contenedor.
RUN addgroup -S nodejs && adduser -S nestjs -G nodejs

COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1', (r) => process.exit(r.statusCode < 500 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "dist/main.js"]
