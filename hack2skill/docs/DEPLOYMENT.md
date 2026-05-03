# Deployment Guide

## 🚀 Production Deployment Checklist

### Pre-Deployment

- [ ] Change all default secrets in `.env`
- [ ] Review and update `.env` for production
- [ ] Enable HTTPS/TLS certificates (Let's Encrypt)
- [ ] Configure MongoDB with strong credentials
- [ ] Set up email service (SMTP)
- [ ] Set up SMS service (Twilio)
- [ ] Enable database backups
- [ ] Configure monitoring and alerts
- [ ] Set up CDN for static files
- [ ] Configure DNS records
- [ ] Review CORS origins
- [ ] Enable rate limiting
- [ ] Setup CI/CD pipeline
- [ ] Create database indexes
- [ ] Test all API endpoints

### Environment Configuration

```bash
# Production .env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Change these to your actual production secrets (min 32 chars)
JWT_SECRET=<generate-random-secret>
JWT_REFRESH_SECRET=<generate-random-secret>
API_KEY_ENCRYPTION_SECRET=<generate-random-secret>

# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/election-assistant
MONGODB_USER=election_user
MONGODB_PASSWORD=<strong-password>

# CORS & Security
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
CSRF_PROTECTION=true
RATE_LIMIT_WINDOW_MS=15000
RATE_LIMIT_MAX_REQUESTS=100

# Email Configuration
EMAIL_FROM=noreply@yourdomain.com
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=your-email@gmail.com
EMAIL_SERVICE_PASSWORD=<app-specific-password>

# Twilio (SMS)
TWILIO_ACCOUNT_SID=<your-account-sid>
TWILIO_AUTH_TOKEN=<your-auth-token>
TWILIO_PHONE_NUMBER=+1234567890

# APIs
GEMINI_API_KEY=<encrypted-key>
GOOGLE_MAPS_API_KEY=<encrypted-key>

# Admin
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_INITIAL_PASSWORD=<temporary-password>

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
AUDIT_LOG_FILE=logs/audit.log
```

## 🐳 Docker Deployment

### Build and Run

```bash
# Build Docker image
docker build -t election-assistant:1.0.0 .

# Run container
docker run -d \
  --name election-app \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e MONGODB_URI=mongodb://mongo:27017/election \
  -e JWT_SECRET=your-secret \
  election-assistant:1.0.0
```

### Docker Compose

```yaml
version: '3.9'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      MONGODB_URI: mongodb://mongo:27017/election-assistant
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - mongo
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs

  mongo:
    image: mongo:5.0
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: election_user
      MONGO_INITDB_ROOT_PASSWORD: ${MONGODB_PASSWORD}
      MONGO_INITDB_DATABASE: election-assistant
    volumes:
      - mongo-data:/data/db
    restart: unless-stopped

  nginx:
    image: nginx:latest
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/nginx/certs
    depends_on:
      - app
    restart: unless-stopped

volumes:
  mongo-data:
```

## 🌐 AWS Deployment

### EC2 Setup

```bash
# Connect to EC2 instance
ssh -i your-key.pem ubuntu@your-instance.ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
curl https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
sudo apt install -y mongodb-org

# Install Nginx
sudo apt install -y nginx

# Clone repository
cd /opt
sudo git clone <your-repo> election-assistant
cd election-assistant/backend
sudo npm install
```

### Environment Variables (AWS Secrets Manager)

```bash
# Store in AWS Secrets Manager
aws secretsmanager create-secret \
  --name election-assistant/production \
  --secret-string '{"JWT_SECRET":"...","MONGODB_URI":"..."}'
```

### PM2 Process Manager

```bash
# Install PM2
sudo npm install -g pm2

# Create ecosystem.config.js
cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: 'election-assistant',
    script: './server.js',
    instances: 4,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log'
  }]
};
EOF

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🔒 SSL/TLS Configuration

### Let's Encrypt with Certbot

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Nginx HTTPS Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📊 Monitoring & Logging

### CloudWatch (AWS)

```javascript
const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch();

// Log custom metrics
cloudwatch.putMetricData({
  Namespace: 'ElectionAssistant',
  MetricData: [{
    MetricName: 'LoginAttempts',
    Value: 100,
    Unit: 'Count'
  }]
}, (err) => {
  if (err) console.log(err);
});
```

### New Relic Integration

```javascript
const newrelic = require('newrelic');

// Transactions logged automatically
app.get('/api/users', (req, res) => {
  // Monitored automatically
});
```

### ELK Stack (Elasticsearch, Logstash, Kibana)

```bash
# Docker Compose for ELK
docker-compose up -d elasticsearch logstash kibana
```

## 🚨 Alerts & Monitoring

### Key Metrics to Monitor
- Server response time (< 200ms)
- Error rate (< 1%)
- CPU usage (< 80%)
- Memory usage (< 85%)
- Database connection pool
- Failed authentication attempts
- Rate limit violations

### Alert Thresholds
```
- Error rate > 5%: Page
- High CPU (> 90%): Page
- Database down: Immediate page
- Security event (failed auth > 10): Immediate page
```

## 🔄 Zero-Downtime Deployment

### Rolling Update Strategy

```bash
# Using PM2
pm2 startOrRestart ecosystem.config.js

# Using Kubernetes (helm)
helm upgrade election-assistant ./chart --values production-values.yaml

# Using Docker Swarm
docker service update --image election-assistant:2.0.0 election-app
```

## 📈 Scaling Strategy

### Horizontal Scaling
```bash
# Load Balancer (AWS ELB)
- Min: 2 instances
- Max: 10 instances
- Target: CPU 60-70%

# Database Replication
- Primary (write)
- Secondary (read) x 2
- Backup (read) x 1

# Cache Layer
- Redis cluster (3 nodes minimum)
- TTL: 1 hour default
```

## 🛡️ Security Hardening

### Firewall Rules
```
- Allow: 80 (HTTP → HTTPS redirect)
- Allow: 443 (HTTPS)
- Allow: 22 (SSH - restricted IPs)
- Deny: All other ports
```

### Database Security
```bash
# Enable authentication
mongod --auth

# Create admin user
db.createUser({
  user: "admin",
  pwd: "strongpassword",
  roles: ["root"]
})

# Enable encryption
mongod --sslMode requireSSL --sslPEMKeyFile /path/to/cert.pem
```

## ✅ Testing in Production

### Synthetic Monitoring
```bash
# Test API endpoints
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'

# Check response time
time curl https://api.yourdomain.com/api/health

# Load testing
ab -n 10000 -c 100 https://api.yourdomain.com/api/health
```

## 📋 Post-Deployment Verification

- [ ] All APIs responding with correct headers
- [ ] HTTPS working (no mixed content)
- [ ] Compression enabled (gzip)
- [ ] CORS headers correct
- [ ] Rate limiting working
- [ ] Logging functioning
- [ ] Database backups running
- [ ] Monitoring alerts active
- [ ] Email service working
- [ ] SMS service working
- [ ] Admin panel accessible
- [ ] User registration flow complete
- [ ] Login/logout working
- [ ] Session management working
- [ ] Token refresh working

## 🔄 Rollback Procedure

```bash
# Quick rollback using PM2
pm2 delete election-assistant
git checkout previous-commit
npm install
pm2 start ecosystem.config.js

# Or using Docker
docker service rollback election-app
```

## 📞 Support & Emergency

**Emergency Contact**: ops@yourdomain.com  
**On-Call**: Check PagerDuty  
**War Room**: war-room.yourdomain.com

---

**Document Version**: 1.0  
**Last Updated**: May 3, 2026
