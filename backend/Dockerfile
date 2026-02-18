FROM node:20-alpine

WORKDIR /app

# Install build tools needed for better-sqlite3 native addon
RUN apk add --no-cache python3 make g++

# Install ALL dependencies (tsx is a devDependency but needed at runtime)
COPY package*.json ./
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    npm ci

# Copy source files
COPY . .

# Copy entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Data directory for SQLite volume mount
RUN mkdir -p /data

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["npx", "tsx", "src/server.ts"]
