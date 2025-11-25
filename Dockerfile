
# syntax = docker/dockerfile:1

ARG NODE_VERSION=20.18.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"
WORKDIR /app
ENV NODE_ENV="production"

# --- Build Stage ---
FROM base AS build

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

# Instala dependências do backend
COPY backend/package.json backend/package-lock.json* ./backend/
WORKDIR /app/backend
RUN npm install

# Instala dependências e build do frontend
COPY frontend/package.json frontend/package-lock.json* ./frontend/
WORKDIR /app/frontend
RUN npm install && npm run build

# Copia o build do frontend para o backend
WORKDIR /app/backend
RUN rm -rf public && mkdir public && cp -r /app/frontend/dist/* public/

# Copia o restante dos códigos
WORKDIR /app
COPY backend ./backend

# --- Production Image ---
FROM base
WORKDIR /app/backend

COPY --from=build /app/backend ./

EXPOSE 3000
CMD ["npm", "start"]
