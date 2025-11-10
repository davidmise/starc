# 🚀 Production Deployment Implementation Guide

## 📋 Step-by-Step Deployment Process

### Phase 1: Infrastructure Setup (DigitalOcean + AWS Hybrid)

#### 1.1 Create DigitalOcean Account & Resources

```bash
# Install doctl (DigitalOcean CLI)
# Windows PowerShell:
Invoke-WebRequest -Uri "https://github.com/digitalocean/doctl/releases/latest/download/doctl-1.99.0-windows-amd64.zip" -OutFile "doctl.zip"
Expand-Archive doctl.zip -DestinationPath C:\doctl
$env:PATH += ";C:\doctl"

# Authenticate
doctl auth init

# Create VPC
doctl vpcs create --name starsc-vpc --region nyc3

# Create Load Balancer
doctl load-balancer create \
  --name starsc-lb \
  --algorithm round_robin \
  --region nyc3 \
  --vpc-uuid YOUR_VPC_UUID \
  --forwarding-rules entry_protocol:https,entry_port:443,target_protocol:http,target_port:5000,certificate_id:YOUR_CERT_ID
```

#### 1.2 Create Production Servers

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.prod
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://username:password@db-host:5432/stars_corporate
      - REDIS_URL=redis://redis-host:6379
      - JWT_SECRET=${JWT_SECRET}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - S3_BUCKET=${S3_BUCKET}
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - app
    restart: unless-stopped
```

#### 1.3 Database Setup

```sql
-- Production database optimizations
-- postgresql.conf optimizations
shared_buffers = 1GB
effective_cache_size = 3GB
maintenance_work_mem = 256MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200

-- Create production indexes
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_users_username ON users(username);
CREATE INDEX CONCURRENTLY idx_sessions_status_created ON live_sessions(status, created_at);
CREATE INDEX CONCURRENTLY idx_sessions_user_id_created ON live_sessions(user_id, created_at);
CREATE INDEX CONCURRENTLY idx_comments_session_created ON comments(session_id, created_at);
CREATE INDEX CONCURRENTLY idx_likes_user_session ON likes(user_id, session_id);
CREATE INDEX CONCURRENTLY idx_notifications_user_read ON notifications(user_id, is_read, created_at);
```

### Phase 2: Code Optimization for Production

#### 2.1 Environment Configuration

```javascript
// config/production.js
module.exports = {
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    pool: {
      min: 5,
      max: 50,
      idle: 10000,
      acquire: 60000,
      evict: 1000
    },
    logging: false
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    db: 0,
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    enableOfflineQueue: false,
    maxmemoryPolicy: 'allkeys-lru'
  },
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    s3: {
      bucket: process.env.S3_BUCKET,
      cloudfrontDomain: process.env.CLOUDFRONT_DOMAIN
    }
  },
  app: {
    port: process.env.PORT || 5000,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiration: '7d',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || [],
    maxFileSize: 100 * 1024 * 1024, // 100MB
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000 // requests per window
    }
  }
};
```

#### 2.2 Production Dockerfile

```dockerfile
# Dockerfile.prod
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine

RUN addgroup -g 1001 -S nodejs
RUN adduser -S starsc -u 1001

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --chown=starsc:nodejs . .

USER starsc

EXPOSE 5000

CMD ["node", "server.js"]
```

#### 2.3 Rate Limiting & Security

```javascript
// middleware/security.js
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');

const securityMiddleware = (app) => {
  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "wss:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));

  // Compression
  app.use(compression());

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);

  // Stricter rate limiting for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 auth requests per windowMs
    message: 'Too many authentication attempts, please try again later.',
    skipSuccessfulRequests: true,
  });
  app.use('/api/auth/', authLimiter);
};

module.exports = securityMiddleware;
```

*** End of file