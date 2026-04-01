# ── Etapa 1: Instalar dependencias ──
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── Etapa 2: Imagen final ──
FROM node:20-alpine

WORKDIR /app

# Crear usuario no-root para mayor seguridad
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copiar dependencias de producción
COPY --from=deps /app/node_modules ./node_modules

# Copiar código fuente
COPY package.json ./
COPY src ./src

# Crear directorio para la llave SSH (se monta como volumen)
RUN mkdir -p /app/ssh-keys && chown -R appuser:appgroup /app

# Cambiar a usuario no-root
USER appuser

# Puerto por defecto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/test-db/db1 || exit 1

# Iniciar la aplicación
CMD ["node", "src/index.js"]
