# Dockerfile personalizado para Railway
FROM node:18-alpine

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Instalar dependencias
RUN npm ci
RUN cd backend && npm ci
RUN cd frontend && npm ci

# Copiar código fuente
COPY . .

# Construir frontend
RUN cd frontend && npm run build

# Exponer puerto
EXPOSE 8080

# Comando de inicio
CMD ["npm", "run", "start:production"]
