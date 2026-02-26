# Estágio 1: Construção do Frontend (Docusaurus)
FROM node:20-bullseye-slim AS builder
WORKDIR /app

# Instala ferramentas básicas de build
RUN apt-get update && apt-get install -y python3 make g++

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .

# Node params para evitar falta de memória no build
ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN npm run build

# Estágio 2: Servidor de Produção
FROM node:20-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Instala dependências para compilar o SQLite (better-sqlite3) no boot
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

COPY server/ ./server/
COPY --from=builder /app/build ./build

RUN mkdir -p /app/data

EXPOSE 3000
CMD ["node", "server/server.js"]