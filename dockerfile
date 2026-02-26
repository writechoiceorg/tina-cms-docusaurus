# Docusaurus
FROM node:20-bullseye-slim AS builder
WORKDIR /app

# Build
RUN apt-get update && apt-get install -y python3 make g++

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .

ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN npm run build

# Server
FROM node:20-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Deps
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

COPY server/ ./server/
COPY --from=builder /app/build ./build

RUN mkdir -p /app/data

# Run auth server
EXPOSE 3000
CMD ["node", "server/server.js"]