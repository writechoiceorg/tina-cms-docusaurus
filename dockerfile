# Estágio 1: Construção do Frontend (Docusaurus)
FROM node:20-bullseye-slim AS builder
WORKDIR /app

# Instala ferramentas básicas de build
RUN apt-get update && apt-get install -y python3 make g++

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .

# --- CORREÇÃO: Pula o 'tinacms build' ---
# Como o cliente já existe em tina/__generated__, rodamos apenas o build do site.
# Deixamos as variáveis dummy apenas para evitar erros caso algum plugin leia a config.
ENV TINA_PUBLIC_IS_LOCAL=true
ENV TINA_CLIENT_ID=self-hosted
ENV TINA_TOKEN=self-hosted
ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN npm run build
# ----------------------------------------

# Estágio 2: Servidor de Produção
FROM node:20-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Instala dependências para compilar o SQLite (better-sqlite3) no boot
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
# Instala dependências de produção (compila o SQLite aqui)
RUN npm ci --omit=dev --legacy-peer-deps

# Copia o servidor e o site estático gerado
COPY server/ ./server/
COPY --from=builder /app/build ./build

# Cria pasta para o volume do banco
RUN mkdir -p /app/data

EXPOSE 3000
CMD ["node", "server/server.js"]