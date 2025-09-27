# Dockerfile para backend completo
FROM node:18-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY fixed-backend.js ./

# Exponer puerto
EXPOSE 8080

# Comando de inicio
CMD ["node", "fixed-backend.js"]
