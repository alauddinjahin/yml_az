# =============================================================================
# 1. PHP LARAVEL WITH VITE APPLICATION
# =============================================================================

# --- DEVELOPMENT VERSION ---
# Dockerfile.dev
FROM php:8.2-fpm-alpine AS laravel-dev

LABEL maintainer="dev-team@company.com"
LABEL version="1.0.0-dev"
LABEL description="Laravel Development Environment with Vite"

# Install system dependencies and security updates
RUN apk update && apk upgrade && apk add --no-cache \
    git \
    curl \
    libpng-dev \
    libxml2-dev \
    zip \
    unzip \
    nodejs \
    npm \
    oniguruma-dev \
    postgresql-dev \
    mysql-client \
    && docker-php-ext-install pdo pdo_mysql pdo_pgsql mbstring exif pcntl bcmath gd \
    && rm -rf /var/cache/apk/*

# Install Composer
COPY --from=composer:2.6 /usr/bin/composer /usr/bin/composer

# Create non-root user
RUN addgroup -g 1001 -S laravel && \
    adduser -S laravel -u 1001 -G laravel

WORKDIR /var/www/html

# Copy dependency files first (better layer caching)
COPY --chown=laravel:laravel composer*.json ./
COPY --chown=laravel:laravel package*.json ./

# Install dependencies
RUN composer install --no-scripts --no-autoloader
RUN npm ci

# Copy application code
COPY --chown=laravel:laravel . .

# Generate autoloader and optimize
RUN composer dump-autoload --optimize

# Set proper permissions
RUN chown -R laravel:laravel /var/www/html && \
    chmod -R 755 /var/www/html && \
    chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

USER laravel

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000

CMD ["sh", "-c", "npm run dev & php artisan serve --host=0.0.0.0 --port=8000"]

# --- PRODUCTION VERSION ---
# Dockerfile.prod
FROM php:8.2-fpm-alpine AS laravel-prod

LABEL maintainer="ops-team@company.com"
LABEL version="1.0.0"
LABEL description="Laravel Production Environment"

# Security: Update and install minimal dependencies
RUN apk update && apk upgrade && apk add --no-cache \
    curl \
    libpng \
    libxml2 \
    postgresql-libs \
    mysql-client \
    && docker-php-ext-install pdo pdo_mysql pdo_pgsql mbstring exif pcntl bcmath gd opcache \
    && rm -rf /var/cache/apk/* /tmp/*

# Production PHP configuration
RUN echo "opcache.enable=1" >> /usr/local/etc/php/conf.d/opcache.ini && \
    echo "opcache.memory_consumption=128" >> /usr/local/etc/php/conf.d/opcache.ini && \
    echo "opcache.interned_strings_buffer=8" >> /usr/local/etc/php/conf.d/opcache.ini && \
    echo "opcache.max_accelerated_files=4000" >> /usr/local/etc/php/conf.d/opcache.ini

# Multi-stage build for assets
FROM node:18-alpine AS asset-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Final production stage
FROM php:8.2-fpm-alpine AS final

# Copy PHP extensions from previous stage
COPY --from=laravel-prod /usr/local/lib/php/extensions/ /usr/local/lib/php/extensions/
COPY --from=laravel-prod /usr/local/etc/php/conf.d/ /usr/local/etc/php/conf.d/

# Install runtime dependencies only
RUN apk add --no-cache \
    curl \
    libpng \
    libxml2 \
    postgresql-libs \
    && rm -rf /var/cache/apk/*

# Copy Composer
COPY --from=composer:2.6 /usr/bin/composer /usr/bin/composer

# Create non-root user
RUN addgroup -g 1001 -S laravel && \
    adduser -S laravel -u 1001 -G laravel

WORKDIR /var/www/html

# Copy optimized dependencies
COPY --chown=laravel:laravel composer*.json ./
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Copy built assets
COPY --from=asset-builder --chown=laravel:laravel /app/public/build ./public/build

# Copy application code
COPY --chown=laravel:laravel . .

# Security: Remove sensitive files
RUN rm -rf .env.example tests/ .git/ .gitignore README.md

# Set permissions
RUN chown -R laravel:laravel /var/www/html && \
    chmod -R 755 /var/www/html && \
    chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

USER laravel

# Production environment
ENV APP_ENV=production
ENV APP_DEBUG=false
ENV LOG_CHANNEL=stdout

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000

CMD ["php-fpm"]

# =============================================================================
# 2. REACT + NODE.JS + MYSQL APPLICATION
# =============================================================================

# --- DEVELOPMENT VERSION ---
# Dockerfile.dev (Backend)
FROM node:18-alpine AS backend-dev

LABEL maintainer="dev-team@company.com"
LABEL version="1.0.0-dev"
LABEL description="Node.js Backend Development"

# Security updates
RUN apk update && apk upgrade && apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

WORKDIR /app

# Copy package files for better caching
COPY --chown=nodejs:nodejs package*.json ./
RUN npm ci --include=dev

# Copy source code
COPY --chown=nodejs:nodejs . .

USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

EXPOSE 3001

ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "dev"]

# Dockerfile.frontend.dev (React)
FROM node:18-alpine AS frontend-dev

LABEL maintainer="dev-team@company.com"
LABEL version="1.0.0-dev"
LABEL description="React Frontend Development"

RUN apk update && apk upgrade && rm -rf /var/cache/apk/*

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

WORKDIR /app

COPY --chown=nodejs:nodejs package*.json ./
RUN npm ci

COPY --chown=nodejs:nodejs . .

USER nodejs

EXPOSE 3000

CMD ["npm", "start"]

# --- PRODUCTION VERSION ---
# Dockerfile.prod (Backend)
FROM node:18-alpine AS backend-deps

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS backend-prod

RUN apk update && apk upgrade && apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/* /tmp/*

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

WORKDIR /app

# Copy production dependencies
COPY --from=backend-deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy source code
COPY --chown=nodejs:nodejs . .

# Remove development files
RUN rm -rf tests/ .git/ .gitignore README.md *.test.js

USER nodejs

ENV NODE_ENV=production
ENV PORT=3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

EXPOSE 3001

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]

# Dockerfile.frontend.prod (React)
FROM node:18-alpine AS frontend-build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.25-alpine AS frontend-prod

RUN apk update && apk upgrade && rm -rf /var/cache/apk/*

# Copy built assets
COPY --from=frontend-build /app/dist /usr/share/nginx/html

# Custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# =============================================================================
# 3. NEXT.JS + POSTGRESQL APPLICATION
# =============================================================================

# --- DEVELOPMENT VERSION ---
# Dockerfile.dev
FROM node:18-alpine AS nextjs-dev

LABEL maintainer="dev-team@company.com"
LABEL version="1.0.0-dev"
LABEL description="Next.js Development Environment"

RUN apk update && apk upgrade && apk add --no-cache \
    curl \
    && rm -rf /var/cache/apk/*

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

WORKDIR /app

# Copy package files
COPY --chown=nextjs:nodejs package*.json ./
RUN npm ci

# Copy source code
COPY --chown=nextjs:nodejs . .

USER nextjs

ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

EXPOSE 3000

CMD ["npm", "run", "dev"]

# --- PRODUCTION VERSION ---
# Dockerfile.prod
FROM node:18-alpine AS nextjs-deps

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS nextjs-builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Build the application
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:18-alpine AS nextjs-prod

RUN apk update && apk upgrade && apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/* /tmp/*

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

WORKDIR /app

# Copy production dependencies
COPY --from=nextjs-deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=nextjs-builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=nextjs-builder --chown=nextjs:nodejs /app/public ./public
COPY --from=nextjs-builder --chown=nextjs:nodejs /app/package*.json ./

# Remove development files
RUN rm -rf tests/ .git/ .gitignore README.md

USER nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]

# =============================================================================
# DOCKER COMPOSE FILES
# =============================================================================

# docker-compose.dev.yml
version: '3.8'

services:
  # Laravel Development
  laravel-dev:
    build:
      context: ./laravel-app
      dockerfile: Dockerfile.dev
    ports:
      - "8000:8000"
    volumes:
      - ./laravel-app:/var/www/html
      - /var/www/html/node_modules
    environment:
      - APP_ENV=local
      - DB_CONNECTION=mysql
      - DB_HOST=mysql-dev
    secrets:
      - db_password
      - app_key
    depends_on:
      - mysql-dev
      - redis-dev

  # React + Node Development
  backend-dev:
    build:
      context: ./react-node-app/backend
      dockerfile: Dockerfile.dev
    ports:
      - "3001:3001"
    volumes:
      - ./react-node-app/backend:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - DB_HOST=mysql-dev
    secrets:
      - db_password
    depends_on:
      - mysql-dev

  frontend-dev:
    build:
      context: ./react-node-app/frontend
      dockerfile: Dockerfile.frontend.dev
    ports:
      - "3000:3000"
    volumes:
      - ./react-node-app/frontend:/app
      - /app/node_modules
    environment:
      - REACT_APP_API_URL=http://localhost:3001
    depends_on:
      - backend-dev

  # Next.js Development
  nextjs-dev:
    build:
      context: ./nextjs-app
      dockerfile: Dockerfile.dev
    ports:
      - "3002:3000"
    volumes:
      - ./nextjs-app:/app
      - /app/node_modules
      - /app/.next
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres-dev:5432/nextjs_dev
    secrets:
      - nextauth_secret
    depends_on:
      - postgres-dev

  # Databases
  mysql-dev:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD_FILE=/run/secrets/db_root_password
      - MYSQL_PASSWORD_FILE=/run/secrets/db_password
      - MYSQL_USER=appuser
      - MYSQL_DATABASE=app_dev
    secrets:
      - db_root_password
      - db_password
    volumes:
      - mysql_dev_data:/var/lib/mysql
    ports:
      - "3306:3306"

  postgres-dev:
    image: postgres:15-alpine
    environment:
      - POSTGRES_PASSWORD_FILE=/run/secrets/postgres_password
      - POSTGRES_USER=postgres
      - POSTGRES_DB=nextjs_dev
    secrets:
      - postgres_password
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis-dev:
    image: redis:7-alpine
    ports:
      - "6379:6379"

secrets:
  db_password:
    file: ./secrets/db_password.txt
  db_root_password:
    file: ./secrets/db_root_password.txt
  postgres_password:
    file: ./secrets/postgres_password.txt
  app_key:
    file: ./secrets/app_key.txt
  nextauth_secret:
    file: ./secrets/nextauth_secret.txt

volumes:
  mysql_dev_data:
  postgres_dev_data:

# docker-compose.prod.yml
version: '3.8'

services:
  # Laravel Production
  laravel-prod:
    build:
      context: ./laravel-app
      dockerfile: Dockerfile.prod
    deploy:
      replicas: 2
      restart_policy:
        condition: on-failure
        max_attempts: 3
    environment:
      - APP_ENV=production
      - APP_DEBUG=false
      - DB_CONNECTION=mysql
      - DB_HOST=mysql-prod
    secrets:
      - db_password
      - app_key
    depends_on:
      - mysql-prod
      - redis-prod

  laravel-nginx:
    image: nginx:1.25-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/laravel.conf:/etc/nginx/conf.d/default.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - laravel-prod

  # React + Node Production
  backend-prod:
    build:
      context: ./react-node-app/backend
      dockerfile: Dockerfile.prod
    deploy:
      replicas: 2
      restart_policy:
        condition: on-failure
    environment:
      - NODE_ENV=production
      - DB_HOST=mysql-prod
    secrets:
      - db_password
    depends_on:
      - mysql-prod

  frontend-prod:
    build:
      context: ./react-node-app/frontend
      dockerfile: Dockerfile.frontend.prod
    ports:
      - "8080:80"
    deploy:
      restart_policy:
        condition: on-failure

  # Next.js Production
  nextjs-prod:
    build:
      context: ./nextjs-app
      dockerfile: Dockerfile.prod
    ports:
      - "3002:3000"
    deploy:
      replicas: 2
      restart_policy:
        condition: on-failure
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres-prod:5432/nextjs_prod
    secrets:
      - nextauth_secret
    depends_on:
      - postgres-prod

  # Production Databases
  mysql-prod:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD_FILE=/run/secrets/db_root_password
      - MYSQL_PASSWORD_FILE=/run/secrets/db_password
      - MYSQL_USER=appuser
      - MYSQL_DATABASE=app_prod
    secrets:
      - db_root_password
      - db_password
    volumes:
      - mysql_prod_data:/var/lib/mysql
    deploy:
      restart_policy:
        condition: on-failure

  postgres-prod:
    image: postgres:15-alpine
    environment:
      - POSTGRES_PASSWORD_FILE=/run/secrets/postgres_password
      - POSTGRES_USER=postgres
      - POSTGRES_DB=nextjs_prod
    secrets:
      - postgres_password
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data
    deploy:
      restart_policy:
        condition: on-failure

  redis-prod:
    image: redis:7-alpine
    deploy:
      restart_policy:
        condition: on-failure

secrets:
  db_password:
    external: true
    name: app_db_password
  db_root_password:
    external: true
    name: app_db_root_password
  postgres_password:
    external: true
    name: app_postgres_password
  app_key:
    external: true
    name: laravel_app_key
  nextauth_secret:
    external: true
    name: nextjs_nextauth_secret

volumes:
  mysql_prod_data:
  postgres_prod_data:

# =============================================================================
# TESTING CONFIGURATIONS
# =============================================================================

# docker-compose.test.yml
version: '3.8'

services:
  # Laravel Testing
  laravel-test:
    build:
      context: ./laravel-app
      dockerfile: Dockerfile.test
    volumes:
      - ./laravel-app:/var/www/html
    environment:
      - APP_ENV=testing
      - DB_CONNECTION=mysql
      - DB_HOST=mysql-test
    depends_on:
      - mysql-test
    command: |
      sh -c "
        vendor/bin/phpunit --testsuite=Unit &&
        vendor/bin/phpunit --testsuite=Feature &&
        php artisan dusk
      "

  # React + Node Testing
  backend-test:
    build:
      context: ./react-node-app/backend
      dockerfile: Dockerfile.test
    volumes:
      - ./react-node-app/backend:/app
    environment:
      - NODE_ENV=test
    command: |
      sh -c "
        npm run test:unit &&
        npm run test:integration &&
        npm run test:e2e
      "

  frontend-test:
    build:
      context: ./react-node-app/frontend
      dockerfile: Dockerfile.frontend.test
    volumes:
      - ./react-node-app/frontend:/app
    command: |
      sh -c "
        npm run test:unit &&
        npm run test:integration &&
        npm run test:e2e
      "

  # Next.js Testing
  nextjs-test:
    build:
      context: ./nextjs-app
      dockerfile: Dockerfile.test
    volumes:
      - ./nextjs-app:/app
    environment:
      - NODE_ENV=test
    depends_on:
      - postgres-test
    command: |
      sh -c "
        npm run test:unit &&
        npm run test:integration &&
        npm run test:e2e
      "

  # Test Databases
  mysql-test:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=rootpassword
      - MYSQL_PASSWORD=password
      - MYSQL_USER=testuser
      - MYSQL_DATABASE=test_db
    tmpfs:
      - /var/lib/mysql

  postgres-test:
    image: postgres:15-alpine
    environment:
      - POSTGRES_PASSWORD=password
      - POSTGRES_USER=postgres
      - POSTGRES_DB=test_db
    tmpfs:
      - /var/lib/postgresql/data

# =============================================================================
# DOCKERFILE.TEST EXAMPLES
# =============================================================================

# Dockerfile.test (Laravel)
FROM php:8.2-fpm-alpine AS laravel-test

# Install dependencies including Chrome for Dusk
RUN apk add --no-cache \
    git \
    curl \
    libpng-dev \
    libxml2-dev \
    zip \
    unzip \
    nodejs \
    npm \
    oniguruma-dev \
    postgresql-dev \
    chromium \
    chromium-chromedriver \
    && docker-php-ext-install pdo pdo_mysql pdo_pgsql mbstring exif pcntl bcmath gd

# Install Composer
COPY --from=composer:2.6 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy and install dependencies
COPY composer*.json package*.json ./
RUN composer install
RUN npm ci

# Copy source code
COPY . .

# Set Chrome environment for Dusk
ENV CHROME_BIN=/usr/bin/chromium-browser
ENV CHROME_DRIVER=/usr/bin/chromedriver

CMD ["vendor/bin/phpunit"]

# Dockerfile.test (Node.js Backend)
FROM node:18-alpine AS backend-test

RUN apk add --no-cache curl chromium
ENV CHROME_BIN=/usr/bin/chromium-browser

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

CMD ["npm", "test"]

# Dockerfile.test (React Frontend)
FROM node:18-alpine AS frontend-test

RUN apk add --no-cache chromium
ENV CHROME_BIN=/usr/bin/chromium-browser

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

CMD ["npm", "test"]

# Dockerfile.test (Next.js)
FROM node:18-alpine AS nextjs-test

RUN apk add --no-cache chromium
ENV CHROME_BIN=/usr/bin/chromium-browser

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

CMD ["npm", "test"]

# =============================================================================
# CI/CD PIPELINE CONFIGURATION
# =============================================================================

# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

  code-quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: SonarQube Scan
        uses: sonarqube-quality-gate-action@master
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}

  test-laravel:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build test environment
        run: docker-compose -f docker-compose.test.yml build laravel-test
      
      - name: Run tests
        run: |
          docker-compose -f docker-compose.test.yml run --rm laravel-test \
          sh -c "
            vendor/bin/phpunit --coverage-clover=coverage.xml &&
            php artisan dusk --env=testing
          "
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage.xml

  test-react-node:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Test Backend
        run: |
          docker-compose -f docker-compose.test.yml run --rm backend-test
      
      - name: Test Frontend
        run: |
          docker-compose -f docker-compose.test.yml run --rm frontend-test

  test-nextjs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Next.js tests
        run: |
          docker-compose -f docker-compose.test.yml run --rm nextjs-test

  image-security:
    runs-on: ubuntu-latest
    needs: [test-laravel, test-react-node, test-nextjs]
    steps:
      - uses: actions/checkout@v4
      
      - name: Build production images
        run: |
          docker-compose -f docker-compose.prod.yml build
      
      - name: Run Trivy on images
        run: |
          docker images --format "table {{.Repository}}:{{.Tag}}" | grep -v REPOSITORY | while read image; do
            trivy image --severity HIGH,CRITICAL --no-progress --format table $image
          done

  deploy:
    runs-on: ubuntu-latest
    needs: [security-scan, code-quality, image-security]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to production
        run: |
          # Deploy logic here
          echo "Deploying to production..."

# =============================================================================
# SECURITY AND CONFIGURATION FILES
# =============================================================================

# .dockerignore
.git
.gitignore
README.md
.env
.env.local
.env.*.local
npm-debug.log*
yarn-debug.log*
yarn-error.log*
node_modules
coverage
.nyc_output
*.log
.DS_Store
.vscode
.idea
*.swp
*.swo
*~

# secrets/
secrets/
*.pem
*.key

# test files
test/
tests/
__tests__/
*.test.js
*.spec.js

# documentation
docs/
*.md

# nginx.conf (for React production)
server {
    listen 80;
    server_name localhost;
    
    root /usr/share/nginx/html;
    index index.html;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# trivy.yaml
timeout: 10m
cache:
  redis:
    addr: redis://localhost:6379
db:
  repository: ghcr.io/aquasecurity/trivy-db
java-db:
  repository: ghcr.io/aquasecurity/trivy-java-db
format: json
severity:
  - CRITICAL
  - HIGH
vulnerability:
  type:
    - os
    - library
secret:
  config: .trivyignore
misconfig:
  include-non-failures: false
  scanners:
    - dockerfile
    - kubernetes

# sonar-project.properties
sonar.projectKey=professional-docker-apps
sonar.organization=your-org
sonar.host.url=https://sonarcloud.io
sonar.sources=.
sonar.exclusions=**/node_modules/**,**/vendor/**,**/*.test.js,**/*.spec.js
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.php.coverage.reportPaths=coverage.xml
sonar.typescript.lcov.reportPaths=coverage/lcov.info