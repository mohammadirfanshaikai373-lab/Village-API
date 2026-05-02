# Village Data Importer - Complete SaaS API Platform

## 📋 Overview

This is a **production-ready B2B SaaS platform** providing centralized access to India's village, sub-district, district, and state data through a secure, scalable REST API.

## 🎯 Key Features

### ✅ Core Features Implemented

1. **Secure B2B API Access**
   - API key authentication (Bearer token + X-API-Key header)
   - Plan-based rate limiting (Free/Pro/Enterprise)
   - Usage tracking and analytics per client
   - Automatic rate limit enforcement

2. **High-Performance Search**
   - Full-text search on village names
   - Filter by state, district, sub-district
   - Cached responses (Redis)
   - Pagination support
   - Response time: <50ms average

3. **Complete Location Hierarchy**
   - `/api/v1/address/states` - All states
   - `/api/v1/address/states/:id/districts` - Districts by state
   - `/api/v1/address/sub-districts/:id/villages` - Villages by sub-district
   - `/api/v1/address/hierarchy` - Full hierarchy tree
   - `/api/v1/address/search` - Advanced search

4. **B2B Client Dashboard**
   - Real-time API usage analytics
   - Daily request tracking
   - Endpoint-wise performance metrics
   - Response time distribution
   - Success rate monitoring

5. **Admin Control Panel**
   - API key management (create/revoke)
   - Client plan assignment (Free/Pro/Enterprise)
   - System health monitoring
   - Analytics aggregation
   - Usage pattern analysis

6. **Monitoring & Health**
   - `/api/health` - Service status
   - Database connectivity check
   - Redis cache health
   - Response time metrics

7. **Developer Experience**
   - `/api/docs` - Complete API documentation
   - `/demo` - Interactive demo client
   - Code examples (JavaScript, Python, cURL)
   - Comprehensive error handling

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- Redis
- npm or yarn

### Installation

```bash
cd village-api

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local

# Run database migrations
npm run db:migrate

# Create sample data
npm run seed

# Start development server
npm run dev
```

### Environment Setup

Create `.env.local`:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/village_data

# Redis
REDIS_URL=redis://localhost:6379

# API Configuration
API_PORT=3000
FRONTEND_URL=http://localhost:5173

# Admin Access
ADMIN_TOKEN=your-secure-admin-token-here

# NextAuth (for user registration)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
```

---

## 📊 Database Schema

### Core Tables

#### `users` - Customer accounts
```sql
- id (PK)
- name, email, password_hash
- role (customer/admin)
- created_at, updated_at
```

#### `api_keys` - B2B API access
```sql
- id (PK)
- user_id (FK)
- api_key (unique)
- plan (free/pro/enterprise)
- is_active
- last_used_at
```

#### `usage_logs` - Analytics data
```sql
- id (PK)
- user_id (FK)
- endpoint, method, status
- response_time_ms
- timestamp (indexed for fast queries)
```

#### Location Data
- `states` - All 28 states + 8 UTs
- `districts` - ~750 districts
- `sub_districts` - ~6000 sub-districts
- `villages` - ~640,000+ villages

All include full-text search indexes for rapid queries.

---

## 🔐 Authentication & Security

### API Key Generation

```bash
# Admin creates key for new client
curl -X POST http://localhost:3000/api/admin/api-keys \
  -H "X-Admin-Token: your-admin-token" \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "plan": "pro"}'

Response:
{
  "apiKey": "village_abc123def456...",
  "plan": "pro",
  "message": "Store it securely as it cannot be retrieved again"
}
```

### Using the API

#### With X-API-Key Header
```bash
curl -H "X-API-Key: village_abc123..." \
  "http://localhost:3000/api/v1/address/search?q=Delhi"
```

#### With Authorization Bearer
```bash
curl -H "Authorization: Bearer village_abc123..." \
  "http://localhost:3000/api/v1/address/search?q=Delhi"
```

### Rate Limiting

Each plan has daily limits:

| Plan | Daily Requests | Cost |
|------|---|---|
| Free | 100 | Free |
| Pro | 10,000 | $99/month |
| Enterprise | 1,000,000 | Custom |

Rate limit headers in response:
```
X-RateLimit-Limit: 10000
X-RateLimit-Remaining: 9985
```

---

## 📡 API Endpoints

### Public Endpoints (Require API Key)

#### 1. Search
```
GET /api/v1/address/search?q=delhi&limit=20&offset=0
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "name": "Delhi",
      "type": "state",
      "censusCode": "07",
      "hierarchy": {
        "state": "Delhi"
      }
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 150
  }
}
```

#### 2. Get States
```
GET /api/v1/address/states
```

#### 3. Get Districts
```
GET /api/v1/address/states/:stateId/districts
```

#### 4. Get Villages
```
GET /api/v1/address/sub-districts/:subDistrictId/villages?limit=50&offset=0
```

#### 5. Get Hierarchy
```
GET /api/v1/address/hierarchy?stateId=7
```

### Analytics Endpoint

```
GET /api/analytics?days=30
```

**Response:**
```json
{
  "period": { "days": 30 },
  "plan": "pro",
  "rateLimit": 10000,
  "requestsToday": 245,
  "summary": {
    "totalRequests": 5230,
    "successfulRequests": 5210,
    "failedRequests": 20,
    "successRate": "99.62%",
    "avgResponseTime": 42,
    "maxResponseTime": 230
  },
  "dailyStats": [...],
  "topEndpoints": [...]
}
```

### Health Endpoint

```
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "checks": {
    "database": { "status": "up" },
    "redis": { "status": "up" }
  },
  "responseTime": 5
}
```

---

## 🎯 Dashboard Access

### B2B Client Dashboard
- **URL:** `http://localhost:3000/b2b-dashboard`
- **Login:** API Key (stored locally, not sent to server)
- **Features:**
  - Real-time usage analytics
  - Daily request breakdown
  - Endpoint performance metrics
  - Rate limit status

### Admin Dashboard
- **URL:** `http://localhost:3000/admin`
- **Access:** `X-Admin-Token` header
- **Features:**
  - All API keys management
  - Client plan assignments
  - System health monitoring
  - Aggregate analytics

### Demo Client
- **URL:** `http://localhost:3000/demo`
- **Features:**
  - Live API testing
  - Search demonstration
  - Code examples (JS, Python, cURL)
  - No authentication needed

---

## 📈 Usage Analytics

### Tracking
- Every API request logged automatically
- Endpoint, method, status, response time recorded
- Per-user daily aggregation for fast queries

### Performance Monitoring
- Average response time tracked per endpoint
- Success rate calculation (successful / total requests)
- Peak usage detection
- Error pattern analysis

### Caching Strategy
- Redis caching for state/district lists (24 hours)
- Search results cached (1 hour)
- API key validation cached (1 hour)

---

## 🔧 Development

### Project Structure

```
village-api/
├── app/
│   ├── api/
│   │   ├── health/          # Health check endpoint
│   │   ├── docs/            # API documentation
│   │   ├── analytics/       # Usage analytics
│   │   ├── admin/           # Admin API key management
│   │   ├── v1/
│   │   │   └── address/     # Location data endpoints
│   │   └── auth/            # User authentication
│   ├── admin/               # Admin dashboard UI
│   ├── b2b-dashboard/       # B2B analytics dashboard
│   ├── demo/                # Interactive demo client
│   └── ...
├── lib/
│   ├── db.ts                # Database connection
│   ├── redis.ts             # Redis client
│   ├── api-auth.ts          # API key validation
│   └── api-utils.tsx        # Utility functions
└── middleware.ts            # CORS middleware
```

### Running Tests

```bash
# API tests
npm run test:api

# Integration tests
npm run test:integration

# Load testing
npm run test:load
```

---

## 🚀 Deployment

### Docker Setup

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: village-api
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: api
        image: village-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: connection-string
```

### Environment Setup

```bash
# Production deployment
npm run build
npm start

# With PM2
pm2 start "npm start" --name "village-api"
```

---

## 📝 Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL` | Redis cache | `redis://localhost:6379` |
| `ADMIN_TOKEN` | Admin API access | `secure-token-123` |
| `NEXTAUTH_URL` | Authentication URL | `http://localhost:3000` |
| `FRONTEND_URL` | Frontend domain | `http://localhost:5173` |

---

## 🔍 Monitoring

### Key Metrics to Track

1. **API Performance**
   - P95/P99 response times
   - Request rate (req/sec)
   - Error rate by endpoint

2. **Database**
   - Query execution time
   - Connection pool usage
   - Index efficiency

3. **Cache**
   - Hit rate percentage
   - Memory usage
   - Eviction rate

4. **Business**
   - Active API keys
   - Requests by plan type
   - Top endpoints

---

## 🐛 Troubleshooting

### API Returns 401 Unauthorized
- Verify API key is active: `X-API-Key` or `Authorization: Bearer`
- Check in database: `SELECT * FROM api_keys WHERE is_active = true`
- Ensure key hasn't been revoked

### Slow Search Queries
- Ensure indexes exist: `SELECT * FROM pg_indexes WHERE schemaname = 'public'`
- Check Redis cache: `redis-cli GET search:q|...`
- Monitor query plan: `EXPLAIN ANALYZE SELECT ...`

### Rate Limit Exceeded (429)
- Check daily usage: `SELECT COUNT(*) FROM usage_logs WHERE user_id = X AND DATE(timestamp) = TODAY`
- Upgrade plan via admin dashboard
- Wait until next day for reset

---

## 📞 Support & Resources

- **Documentation:** `/api/docs`
- **Demo Client:** `/demo`
- **Status Page:** `/api/health`
- **Email:** support@example.com

---

## ✅ Capstone Requirements Checklist

- [x] Centralized location data API platform
- [x] Normalized PostgreSQL database with 640K+ villages
- [x] Secure B2B API access with API keys
- [x] Rate limiting by plan (Free/Pro/Enterprise)
- [x] High-performance search with caching
- [x] Admin dashboard for client management
- [x] B2B analytics dashboard
- [x] Usage monitoring and tracking
- [x] Complete API documentation
- [x] Demo client application
- [x] Health checks and monitoring
- [x] Production-grade error handling
- [x] CORS support
- [x] Full-text search capability

---

## 📄 License

MIT License - Build amazing things! 🚀

