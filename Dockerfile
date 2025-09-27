# Dockerfile para servidor nativo
FROM node:18-alpine

WORKDIR /app

# Copiar código fuente
COPY native-server.js ./

# Exponer puerto
EXPOSE 8080

# Comando de inicio
CMD ["node", "native-server.js"]
