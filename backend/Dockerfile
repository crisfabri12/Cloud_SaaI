FROM node:18-alpine
WORKDIR /app

# Copiamos solo package.json y package-lock.json si lo tienes:
COPY package.json package-lock.json ./

# Instalamos con npm
RUN npm ci --only=production

# Copiamos el resto del código
COPY . .

EXPOSE 3000
CMD ["node", "index.js"]
