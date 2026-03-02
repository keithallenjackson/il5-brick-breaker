# Stage 1: Build
FROM node:22-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY tsconfig.json tsconfig.node.json vite.config.ts ./
COPY src/ src/
COPY index.html ./

RUN npm run build

# Stage 2: Serve
FROM nginx:1.27-alpine AS production

# Copy custom nginx config and security headers
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY security-headers.conf /etc/nginx/security-headers.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Run as non-root
USER 1001

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
