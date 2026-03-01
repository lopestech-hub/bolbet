# ==========================================
# 1. BUILD FRONTEND
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ==========================================
# 2. BUILD BACKEND
# ==========================================
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
# Gera o cliente Prisma antes do build TS
RUN npx prisma generate
RUN npm run build

# ==========================================
# 3. RUNTIME FINAL
# ==========================================
FROM node:20-alpine
WORKDIR /app

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3000

# Copia backend buildado
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY --from=backend-builder /app/backend/package.json ./package.json
COPY --from=backend-builder /app/backend/prisma ./prisma

# Copia frontend buildado para uma pasta estática que o backend irá servir
COPY --from=frontend-builder /app/frontend/dist ./public

# Exposição da porta
EXPOSE 3000

# Comando de inicialização (Roda migrações prisma se necessário e inicia)
CMD ["sh", "-c", "npx prisma generate && node dist/index.js"]
