# Dockerfile para aplicación full-stack
FROM node:18-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Instalar dependencias
RUN npm ci
RUN cd frontend && npm ci

# Copiar código fuente
COPY frontend/ ./frontend/
COPY backend/ ./backend/
COPY complete-full-stack-server.js ./

# Construir frontend
RUN cd frontend && npm run build

# Exponer puerto
EXPOSE 8080

# Comando de inicio
CMD ["node", "complete-full-stack-server.js"]
