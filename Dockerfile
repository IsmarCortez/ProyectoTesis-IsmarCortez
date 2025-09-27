# Dockerfile ultra simple para Railway
FROM node:18-alpine

WORKDIR /app

# Copiar solo lo necesario
COPY minimal.js ./

# Exponer puerto
EXPOSE 8080

# Comando de inicio directo
CMD ["node", "minimal.js"]
