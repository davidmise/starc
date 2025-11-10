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

#### 2.4 File Upload with S3

```javascript
// config/multer-s3.js
const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET,
    acl: 'public-read',
    key: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `uploads/${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    }
  }),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and videos are allowed.'));
    }
  }
});

module.exports = upload;
```

### Phase 3: Mobile App Production Build

#### 3.1 App Configuration

```json
// app.json
{
  "expo": {
    "name": "Star Corporate",
    "slug": "star-corporate",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#000000"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.starcorporate.app",
      "buildNumber": "1",
      "infoPlist": {
        "NSCameraUsageDescription": "This app uses the camera to capture photos and videos for posts.",
        "NSMicrophoneUsageDescription": "This app uses the microphone for live streaming and video recording.",
        "NSPhotoLibraryUsageDescription": "This app accesses your photo library to select images and videos for posts."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#000000"
      },
      "package": "com.starcorporate.app",
      "versionCode": 1,
      "permissions": [
        "CAMERA",
        "RECORD_AUDIO",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    "web": {
      "favicon": "./assets/images/favicon.png",
      "bundler": "metro"
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",
          "color": "#000000"
        }
      ]
    ],
    "extra": {
      "apiUrl": "https://api.starcorporate.com",
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

#### 3.2 EAS Build Configuration

```json
// eas.json
{
  "cli": {
    "version": ">= 5.4.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "autoIncrement": true,
      "env": {
        "API_URL": "https://api.starcorporate.com"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "your-apple-team-id"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account-key.json",
        "track": "internal"
      }
    }
  }
}
```

### Phase 4: CI/CD Pipeline Setup

#### 4.1 GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: password
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: backend/package-lock.json

    - name: Install dependencies
      run: |
        cd backend
        npm ci

    - name: Run tests
      run: |
        cd backend
        npm test
      env:
        DATABASE_URL: postgresql://postgres:password@localhost:5432/test_db

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Build Docker image
      run: |
        docker build -f Dockerfile.prod -t starcorporate:${{ github.sha }} .

    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1

    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v1

    - name: Push image to ECR
      run: |
        docker tag starcorporate:${{ github.sha }} $ECR_REGISTRY/starcorporate:${{ github.sha }}
        docker tag starcorporate:${{ github.sha }} $ECR_REGISTRY/starcorporate:latest
        docker push $ECR_REGISTRY/starcorporate:${{ github.sha }}
        docker push $ECR_REGISTRY/starcorporate:latest
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}

    - name: Deploy to production
      run: |
        echo "Deploying to production servers..."
        # Add deployment commands here
```

### Phase 5: Monitoring & Logging

#### 5.1 Application Monitoring

```javascript
// middleware/monitoring.js
const winston = require('winston');
const { createLogger, format, transports } = winston;

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  defaultMeta: { service: 'starcorporate-api' },
  transports: [
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' }),
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    })
  ]
});

// Performance monitoring middleware
const performanceMonitoring = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });
  
  next();
};

module.exports = { logger, performanceMonitoring };
```

#### 5.2 Health Check Endpoints

```javascript
// routes/health.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/health', async (req, res) => {
  try {
    // Check database connection
    await pool.query('SELECT 1');
    
    // Check Redis connection if using
    // await redis.ping();
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/health/db', async (req, res) => {
  try {
    const start = Date.now();
    await pool.query('SELECT 1');
    const duration = Date.now() - start;
    
    res.status(200).json({
      status: 'healthy',
      responseTime: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
```

### Phase 6: SSL/Security Configuration

#### 6.1 Nginx Configuration

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:5000;
    }
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/s;
    
    server {
        listen 80;
        server_name api.starcorporate.com;
        return 301 https://$server_name$request_uri;
    }
    
    server {
        listen 443 ssl http2;
        server_name api.starcorporate.com;
        
        ssl_certificate /etc/ssl/cert.pem;
        ssl_certificate_key /etc/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        
        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        
        # Rate limiting
        location /api/auth/ {
            limit_req zone=auth burst=20 nodelay;
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        location /api/ {
            limit_req zone=api burst=50 nodelay;
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # WebSocket support for Socket.IO
        location /socket.io/ {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## 📱 Mobile App Store Deployment Scripts

### iOS Deployment

```bash
#!/bin/bash
# scripts/deploy-ios.sh

echo "🍎 Building iOS app for App Store..."

# Install dependencies
npm install

# Build for production
npx eas build --platform ios --profile production

# Wait for build to complete
echo "✅ Build completed. Submitting to App Store..."

# Submit to App Store
npx eas submit --platform ios --profile production

echo "🚀 iOS app submitted to App Store!"
```

### Android Deployment

```bash
#!/bin/bash
# scripts/deploy-android.sh

echo "🤖 Building Android app for Play Store..."

# Install dependencies
npm install

# Build for production
npx eas build --platform android --profile production

# Wait for build to complete
echo "✅ Build completed. Submitting to Play Store..."

# Submit to Play Store
npx eas submit --platform android --profile production

echo "🚀 Android app submitted to Play Store!"
```

## 📊 Cost Monitoring & Optimization

### AWS Cost Alerts

```json
{
  "Type": "AWS::Budgets::Budget",
  "Properties": {
    "Budget": {
      "BudgetName": "StarCorporate-Monthly-Budget",
      "BudgetLimit": {
        "Amount": 500,
        "Unit": "USD"
      },
      "TimeUnit": "MONTHLY",
      "BudgetType": "COST",
      "CostFilters": {
        "Service": [
          "Amazon Elastic Compute Cloud - Compute",
          "Amazon Relational Database Service",
          "Amazon Simple Storage Service"
        ]
      }
    },
    "NotificationsWithSubscribers": [
      {
        "Notification": {
          "NotificationType": "ACTUAL",
          "ComparisonOperator": "GREATER_THAN",
          "Threshold": 80
        },
        "Subscribers": [
          {
            "SubscriptionType": "EMAIL",
            "Address": "admin@starcorporate.com"
          }
        ]
      }
    ]
  }
}
```

## 🔄 Backup & Disaster Recovery

### Database Backup Script

```bash
#!/bin/bash
# scripts/backup-database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_starsc_$DATE.sql"
S3_BUCKET="starcorporate-backups"

echo "📦 Creating database backup..."

# Create backup
pg_dump $DATABASE_URL > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Upload to S3
aws s3 cp $BACKUP_FILE.gz s3://$S3_BUCKET/database/

# Clean up local files older than 7 days
find . -name "backup_starsc_*.sql.gz" -mtime +7 -delete

echo "✅ Database backup completed and uploaded to S3"
```

---

This comprehensive implementation guide provides all the technical details needed to deploy Star Corporate to production with proper scalability, security, and monitoring in place. The setup supports both mobile app store deployment and can handle significant user growth.