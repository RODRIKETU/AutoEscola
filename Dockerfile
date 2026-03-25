FROM node:20-alpine

# Dependências nativas do better-sqlite3 precisam de python/make/g++
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Garante que o diretório de dados existe
RUN mkdir -p /app/data

# Diretório onde o SQLite será persistido via volume
VOLUME ["/app/data"]

EXPOSE 3000

CMD ["node", "server.js"]
