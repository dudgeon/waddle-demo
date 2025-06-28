# Build stage for backend
FROM node:20-alpine AS backend-builder

WORKDIR /app/server

# Copy server package files
COPY server/package*.json ./
RUN npm install --include=dev

# Copy server source code
COPY server/ .
RUN npm run build

# Build stage for frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy root package files but create a temporary one without postinstall
COPY package.json package-lock.json ./
RUN npm pkg delete scripts.postinstall
RUN rm -rf node_modules package-lock.json
RUN npm install

# Copy frontend source and build
COPY src/ ./src/
COPY chat-service-demo.tsx ./
COPY index.html tsconfig.json vite.config.ts ./
RUN npm run build:frontend

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install production dependencies for server
COPY server/package*.json ./
RUN npm install --omit=dev

# Copy built backend
COPY --from=backend-builder /app/server/dist ./dist

# Copy built frontend to the path expected by the server (../../dist from server/dist)
COPY --from=frontend-builder /app/dist ../dist

# Expose port
EXPOSE 3001

# Start the server
CMD ["npm", "start"]