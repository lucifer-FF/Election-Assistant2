# Election Assistant - Backend Documentation

## 🔒 Security Architecture

This production-grade backend implements enterprise-level security controls:

### Authentication & Authorization
- **JWT with Refresh Tokens**: 15-minute access tokens, 7-day refresh tokens
- **Argon2 Password Hashing**: Military-grade password hashing
- **Role-Based Access Control (RBAC)**: voter, poll_officer, admin roles
- **Session Management**: Multi-device session tracking and revocation
- **Device Fingerprinting**: Detect unauthorized login attempts

### Data Protection
- **AES-256-GCM Encryption**: Encrypt sensitive data at rest
- **HTTPS/TLS Enforcement**: All communications encrypted in transit
- **Input Validation & Sanitization**: Prevent XSS and injection attacks
- **MongoDB Injection Prevention**: Automatic sanitization
- **CSRF Protection**: Token-based CSRF defense

### Rate Limiting & DoS Protection
- **API Rate Limiting**: 100 requests per 15 seconds per IP
- **Auth Rate Limiting**: 5 login attempts per 15 minutes
- **Throttling**: Gradual slowdown after 50 requests

### Monitoring & Logging
- **Audit Logging**: All state-changing operations logged
- **Security Event Logging**: Suspicious activities detected
- **HTTP Request Logging**: Complete request/response tracking
- **Error Tracking**: Centralized error logging

### API Security Headers
- **Helmet.js**: Comprehensive security headers
- **Content-Security-Policy**: Prevent inline scripts
- **HSTS**: Force HTTPS
- **X-Frame-Options**: Prevent clickjacking
- **X-Content-Type-Options**: Prevent MIME sniffing

## 🚀 Getting Started

### Prerequisites
- Node.js >= 16.x
- MongoDB >= 5.0
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Update .env with your configuration
# CRITICAL: Change JWT secrets, database credentials, API keys

# Run migrations
npm run migrate

# Start development server
npm run dev

# Start production server
npm start
```

### Environment Variables

See `.env.example` for all required variables. Critical ones:

```env
NODE_ENV=production
JWT_SECRET=<min-32-chars>
JWT_REFRESH_SECRET=<min-32-chars>
API_KEY_ENCRYPTION_SECRET=<min-32-chars>
MONGODB_URI=mongodb://user:pass@host:port/db
ALLOWED_ORIGINS=https://yourdomain.com
```

## 📚 API Endpoints

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "fullName": "John Doe",
  "phone": "9876543210",
  "state": "West Bengal",
  "constituency": "Kolkata"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "deviceId": "optional-device-id"
}

Response:
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": "15m",
  "user": { ... }
}
```

#### Refresh Token
```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <accessToken>
```

### Voter Information

#### Verify Email
```http
POST /api/auth/verify-email
{
  "token": "verification-token"
}
```

#### Request Phone OTP
```http
POST /api/auth/request-phone-otp
Authorization: Bearer <accessToken>
```

#### Verify Phone OTP
```http
POST /api/auth/verify-phone-otp
Authorization: Bearer <accessToken>

{
  "otp": "123456"
}
```

#### Check Eligibility
```http
POST /api/voter/check-eligibility
Authorization: Bearer <accessToken>

{
  "age": 25,
  "citizenship": true,
  "resident": true,
  "noConviction": true
}
```

#### Verify Voter
```http
POST /api/voter/verify
Authorization: Bearer <accessToken>

{
  "voterId": "ABC1234567",
  "partNo": "159"
}
```

### Candidates

#### Get Candidates by Constituency
```http
GET /api/candidates/constituency/159
Authorization: Bearer <accessToken>
```

#### Compare Candidates
```http
POST /api/candidates/compare
Authorization: Bearer <accessToken>

{
  "candidateIds": ["id1", "id2"],
  "compareBy": ["manifesto", "background", "promises"]
}
```

### Polling Booths

#### Find Polling Booth
```http
POST /api/polling-booths/find
Authorization: Bearer <accessToken>

{
  "voterId": "ABC1234567",
  "partNo": "159"
}
```

#### Get Nearest Polling Booths
```http
GET /api/polling-booths/nearest?latitude=22.5355&longitude=88.3472&radius=5
Authorization: Bearer <accessToken>
```

### Reminders

#### Setup Reminder
```http
POST /api/reminders/setup
Authorization: Bearer <accessToken>

{
  "email": "user@example.com",
  "types": ["registration", "campaign", "voting", "results"],
  "phoneNumber": "9876543210",
  "enableSMS": true
}
```

### Chatbot

#### Send Message
```http
POST /api/chatbot/message

{
  "message": "How do I register to vote?",
  "history": [
    { "role": "user", "text": "Hi" },
    { "role": "assistant", "text": "Hello! How can I help?" }
  ]
}
```

### Admin Endpoints

#### Get Dashboard Stats
```http
GET /api/admin/dashboard
Authorization: Bearer <adminToken>
```

#### Get All Users
```http
GET /api/admin/users
Authorization: Bearer <adminToken>
```

#### Update User Role
```http
PUT /api/admin/users/:userId/role
Authorization: Bearer <adminToken>

{
  "role": "poll_officer"
}
```

#### View Audit Logs
```http
GET /api/admin/audit-logs?page=1&limit=50
Authorization: Bearer <adminToken>
```

#### View Security Events
```http
GET /api/admin/security-events?severity=high
Authorization: Bearer <adminToken>
```

## 🛡️ Security Best Practices

### Password Requirements
- Minimum 12 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&)

### Token Security
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Refresh tokens rotate on each use
- Tokens include session ID for session validation
- Token signatures verified with secret key

### Session Management
- Limited to 5 concurrent sessions per user
- Sessions tracked with device fingerprint
- Sessions revoked on logout or password reset
- Unknown devices flagged for verification

### Rate Limiting
- Global: 100 req/15s per IP
- Auth: 5 attempts/15min per email
- API: 30 req/60s per authenticated user
- Requests from localhost are exempted

## 📊 Monitoring

### Logging
- **Console**: Development environment
- **File**: logs/app.log and logs/error.log
- **Winston**: Structured JSON logging
- **Morgan**: HTTP request/response logging

### Audit Trail
All user actions are logged:
```json
{
  "timestamp": "2026-05-03T10:00:00Z",
  "action": "user_login",
  "userId": "6476a4b8c5f8e9a2b3c4d5e6",
  "email": "user@example.com",
  "ip": "192.168.1.1",
  "deviceFingerprint": "a1b2c3d4e5f6...",
  "path": "/api/auth/login",
  "statusCode": 200
}
```

### Security Events
- Failed login attempts
- Invalid tokens
- CSRF violations
- Rate limit violations
- Unauthorized access attempts
- Account lockouts
- Password changes

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- authController.test.js

# Run with coverage
npm test -- --coverage

# Security audit
npm run test:security
```

## 🚢 Deployment

### Production Checklist
- [ ] Change all default secrets in .env
- [ ] Enable HTTPS/TLS certificates
- [ ] Configure MongoDB with authentication
- [ ] Set up email service (SMTP)
- [ ] Set up SMS service (Twilio)
- [ ] Enable database backups
- [ ] Configure monitoring and alerts
- [ ] Set up CDN for static files
- [ ] Enable rate limiting
- [ ] Review CORS origins
- [ ] Set NODE_ENV=production
- [ ] Configure CI/CD pipeline

### Docker Deployment

```bash
# Build image
docker build -t election-assistant-backend .

# Run container
docker run -d \
  -e NODE_ENV=production \
  -e MONGODB_URI=mongodb://mongo:27017/election \
  -e JWT_SECRET=your-secret \
  -p 3000:3000 \
  election-assistant-backend
```

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Check connection string in .env
- Ensure MongoDB is running
- Verify network connectivity
- Check firewall rules

### JWT Token Errors
- Ensure JWT_SECRET matches between token generation and verification
- Check token expiration time
- Verify Authorization header format: `Bearer <token>`

### CORS Errors
- Add frontend URL to ALLOWED_ORIGINS in .env
- Ensure credentials: true is set if needed
- Check preflight OPTIONS requests

## 📝 License

MIT

## 🆘 Support

For issues and questions, please open an issue on GitHub or contact the development team.
