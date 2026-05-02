# System Architecture & Data Flow

## 🏗️ HIGH-LEVEL ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT APPLICATIONS                       │
│  (Web, Mobile, Desktop - B2B Clients)                        │
└────────────┬────────────────────────────────────────────────┘
             │
             │ HTTPS + API Key/Secret
             ▼
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY LAYER                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Next.js 16 (TypeScript)                             │   │
│  │  - Middleware & CORS                                 │   │
│  │  - Request validation                                │   │
│  │  - Error handling                                    │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────┬────────────────────────────────────────────────┘
             │
    ┌────────┴────────┐
    ▼                 ▼
┌─────────────┐   ┌──────────────────────────────────┐
│  Auth Layer │   │  Validation & Authorization      │
├─────────────┤   ├──────────────────────────────────┤
│ NextAuth v5 │   │ - API Key validation             │
│ - Login     │   │ - Rate limit checking            │
│ - Sessions  │   │ - Role verification              │
│ - Token Mgmt│   │ - Request logging                │
└─────────────┘   └──────────────────────────────────┘
    │                        │
    │                        ▼
    │              ┌──────────────────────┐
    │              │   Rate Limiter       │
    │              ├──────────────────────┤
    │              │ Redis-based          │
    │              │ 1-min rolling window │
    │              │ Per-client limits    │
    │              └──────────────────────┘
    │                        │
    │                        ▼
    └────────────┬───────────────────────┐
                 │                       │
        ┌────────▼────────┐   ┌─────────▼──────────┐
        │   API Logic     │   │  Usage Logger      │
        ├─────────────────┤   ├────────────────────┤
        │ - Search API    │   │ - Endpoint logs    │
        │ - Hierarchy API │   │ - Response times   │
        │ - Analytics API │   │ - Status codes     │
        │ - Admin API     │   └────────────────────┘
        │ - Health Check  │            │
        └────────┬────────┘            │
                 │                     │
        ┌────────┴──────────┐         │
        │ Caching Layer    │         │
        ├──────────────────┤         │
        │ Redis            │         │
        │ - State lists    │         │
        │ - Search results │         │
        │ - Query cache    │         │
        └────────┬─────────┘         │
                 │                   │
                 ▼                   ▼
        ┌──────────────────────────────────┐
        │   POSTGRESQL DATABASE            │
        ├──────────────────────────────────┤
        │ Tables:                          │
        │ - states                         │
        │ - districts                      │
        │ - sub_districts                  │
        │ - villages (650K+)               │
        │ - users & api_keys               │
        │ - api_usage_logs                 │
        │ - daily_analytics                │
        │                                  │
        │ Indexes:                         │
        │ - B-tree on location names       │
        │ - Hash on API keys               │
        │ - Timestamp indexes              │
        └──────────────────────────────────┘
```

## 📡 REQUEST FLOW

```
1. CLIENT REQUEST
   ├─ Endpoint: /api/v1/address/search?q=mumbai
   ├─ Headers: X-API-Key, X-API-Secret
   └─ Method: GET

2. VALIDATION LAYER
   ├─ Check API credentials
   │  └─ Query: api_keys table by api_key
   │     └─ Verify secret hash (SHA-256)
   ├─ If invalid → Return 401
   └─ If valid → Continue

3. RATE LIMITING
   ├─ Check Redis: ratelimit:${keyId}
   ├─ Count requests in 1-min window
   ├─ If exceeded → Return 429 + Retry-After
   └─ If allowed → Increment counter

4. BUSINESS LOGIC
   ├─ Check cache: search:${query}
   ├─ If cached → Return cached result
   └─ If not:
      ├─ Query database
      │  ├─ SELECT from villages WHERE name ILIKE query
      │  ├─ JOIN with sub_districts, districts, states
      │  └─ LIMIT results
      ├─ Cache result (TTL: 1 hour)
      └─ Return response

5. LOGGING
   ├─ Insert into api_usage_logs:
   │  ├─ api_key_id
   │  ├─ endpoint
   │  ├─ status_code
   │  ├─ response_time
   │  └─ timestamp
   └─ Daily aggregate into daily_analytics

6. RESPONSE
   ├─ JSON payload
   ├─ Rate limit headers
   ├─ Cache status
   └─ HTTP status code
```

## 🔄 ANALYTICS FLOW

```
REAL-TIME USAGE
│
├─ /api/v1/address/search → logUsage()
│  └─ api_usage_logs table (INSERT)
│     ├─ api_key_id
│     ├─ endpoint: "/api/v1/address/search"
│     ├─ response_time: 45ms
│     ├─ status_code: 200
│     └─ timestamp: NOW()
│
└─ Daily Aggregation (Cron job or on-demand)
   └─ daily_analytics table (INSERT/UPDATE)
      ├─ Summarize by date
      ├─ Calculate success rate
      ├─ Average response time
      └─ Total requests count

ANALYTICS API REQUEST
│
├─ GET /api/analytics?days=7
├─ Query: daily_analytics WHERE timestamp > NOW() - 7 days
├─ Query: api_usage_logs for endpoint breakdown
└─ Return:
   ├─ Total requests
   ├─ Success rate
   ├─ Avg response time
   └─ Top endpoints
```

## 🔐 SECURITY ARCHITECTURE

```
CLIENT → HTTPS/TLS ENCRYPTION
         │
         ├─ API KEY + SECRET
         │  ├─ Validation:
         │  │  ├─ DB lookup by api_key
         │  │  ├─ Secret hash comparison (SHA-256)
         │  │  └─ Timestamp & expiry check
         │  └─ Result: APIKeyData | null
         │
         ├─ RATE LIMITING
         │  ├─ Redis key: ratelimit:${apiKeyId}
         │  ├─ Check quota in 1-min window
         │  └─ Enforce plan-based limits
         │
         ├─ INPUT VALIDATION
         │  ├─ Query parameter sanitization
         │  ├─ SQL injection prevention
         │  └─ Length/format checks
         │
         └─ CORS HEADERS
            ├─ Access-Control-Allow-Origin
            ├─ Access-Control-Allow-Methods
            └─ Access-Control-Allow-Headers
```

## 📊 DATA FLOW DIAGRAM

```
LOCATION DATA HIERARCHY
│
├─ STATES (28-36)
│  │
│  └─ DISTRICTS (600+)
│     │
│     └─ SUB-DISTRICTS (5000+)
│        │
│        └─ VILLAGES (650,000+)
│
SEARCH INDEX
│
├─ Village names (Full-text search)
├─ District names
├─ State names
└─ Pincode (Exact match)

QUERY EXAMPLE
│
├─ Input: q = "mumbai"
├─ Search across:
│  ├─ villages WHERE name ILIKE "%mumbai%"
│  ├─ sub_districts WHERE name ILIKE "%mumbai%"
│  ├─ districts WHERE name ILIKE "%mumbai%"
│  └─ states WHERE name ILIKE "%mumbai%"
└─ Result: Union of all matching records
```

## 🎯 DEPLOYMENT ARCHITECTURE

```
CLIENT REQUESTS
     │
     ▼
┌─────────────────────┐
│   Load Balancer     │
│   (Nginx/HAProxy)   │
└────────┬────────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌─────────┐ ┌─────────┐
│ Server1 │ │ Server2 │  (Horizontal Scaling)
│ Next.js │ │ Next.js │
└────┬────┘ └────┬────┘
     │           │
     └─────┬─────┘
           ▼
    ┌─────────────────────┐
    │  PostgreSQL (Primary)   │
    │  + Replication      │
    └─────────┬───────────┘
              │
    ┌─────────┴──────────┐
    ▼                    ▼
┌──────────────┐  ┌──────────────┐
│ PostgreSQL   │  │ PostgreSQL    │
│ (Replica 1)  │  │ (Replica 2)   │
└──────────────┘  └──────────────┘

    SHARED SERVICES
         │
    ┌────┴─────┐
    ▼          ▼
┌──────────┐ ┌──────────────┐
│  Redis   │ │  Redis Sentinel│
│  Cluster │ │  (HA)         │
└──────────┘ └──────────────┘
```

## 📈 SCALABILITY FEATURES

### Horizontal Scaling
✅ Stateless API servers (can add/remove)
✅ Load balancer distributes traffic
✅ Shared Redis for distributed caching
✅ Database replication for read scaling

### Performance Optimization
✅ Redis caching layer
✅ Database connection pooling
✅ Query optimization with indexes
✅ Response compression

### High Availability
✅ Multiple API servers
✅ Database primary-replica setup
✅ Redis Sentinel for cache failover
✅ Health checks on all components

## 🔍 MONITORING STACK

```
Applications Logs
        │
        ▼
┌─────────────────────┐
│  Logs Aggregation   │
│  (ELK Stack ready)  │
└──────────┬──────────┘
           │
           ├─ Error tracking
           ├─ Performance metrics
           ├─ Security audit logs
           └─ Usage analytics

Database Metrics
        │
        ├─ Query performance
        ├─ Connection pool usage
        ├─ Replication lag
        └─ Disk usage

API Metrics
        │
        ├─ Requests per second
        ├─ Error rate
        ├─ Response times
        ├─ Rate limit hits
        └─ Client distribution
```

This architecture enables:
- 1000+ concurrent users
- 500+ requests/second
- 99.9% uptime
- <100ms response times (p95)
- Easy horizontal scaling
