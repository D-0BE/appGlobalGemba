FROM node:20-alpine
WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar código fuente
COPY src/ ./src/

EXPOSE 3001
CMD ["node", "src/index.js"]
