# --- Build stage ---------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Build the static site
COPY . .
RUN npm run build

# --- Serve stage ---------------------------------------------------------
FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
EXPOSE 80
