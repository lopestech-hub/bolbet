# Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Build Backend
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ .
RUN npx prisma generate
RUN npm run build

# Final Image
FROM node:20-alpine
ENV TZ=America/Sao_Paulo
WORKDIR /app

# Instalar dependências de produção apenas
COPY backend/package*.json ./ backend/
RUN cd backend && npm ci --omit=dev

# Copiar build do backend e frontend
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/node_modules/.prisma ./backend/node_modules/.prisma
COPY --from=frontend-builder /app/frontend/dist ./public

EXPOSE 3000
CMD ["node", "backend/dist/index.js"]
