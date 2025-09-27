# Dockerfile para servidor de producción
FROM node:18-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY simple-production.js ./

# Exponer puerto
EXPOSE 8080

# Comando de inicio
CMD ["node", "simple-production.js"]
