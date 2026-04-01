# ── Stage 1: Instalar dependencias ──────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copiar solo los archivos de dependencias para cachear la capa
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── Stage 2: Imagen final de producción ────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Crear usuario no-root para seguridad
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Crear directorio para la llave SSH (se monta como volumen/secreto)
RUN mkdir -p /app/ssh && chown appuser:appgroup /app/ssh

# Copiar dependencias desde la etapa anterior
COPY --from=deps /app/node_modules ./node_modules

# Copiar código fuente
COPY package.json ./
COPY src ./src

# El archivo .env se pasa mediante docker-compose o --env-file en runtime
# La llave SSH se monta como volumen/secreto en runtime

# Exponer el puerto de la aplicación (por defecto 3000)
EXPOSE 3000

# Cambiar a usuario no-root
USER appuser

# Health check para monitorear la aplicación
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/test-db/db1 || exit 1

# Iniciar la aplicación
CMD ["node", "src/index.js"]
