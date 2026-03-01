# Stage 1: Build
FROM registry1.dso.mil/ironbank/opensource/nodejs/nodejs22:22 AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY tsconfig.json tsconfig.node.json vite.config.ts ./
COPY src/ src/
COPY index.html ./

RUN npm run build

# Stage 2: Serve
FROM registry1.dso.mil/ironbank/opensource/nginx/nginx:1.27 AS production

# Copy custom nginx config and security headers
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY security-headers.conf /etc/nginx/security-headers.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Run as non-root
USER 1001

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
