// Quick Start Guide for Developers
# Quick Start Guide - Village Data API

## 🚀 Get Started in 5 Minutes

### 1. Register & Get API Keys
```
POST /api/auth/register
{
  "email": "your@email.com",
  "password": "secure_password",
  "name": "Your Name"
}
```

### 2. Create API Key
Visit `/b2b-dashboard` or:
```bash
curl -X POST https://api.village-api.com/api/admin/api-keys \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Your Company",
    "plan": "pro"
  }'
```

You'll receive:
```json
{
  "apiKey": "village_xxxxxxxxxxxx",
  "apiSecret": "xxxxxxxxxxxxxxx",
  "warning": "Save your secret now. You won't see it again!"
}
```

### 3. Make Your First Request
```bash
curl -X GET "https://api.village-api.com/api/v1/address/search?q=mumbai" \
  -H "X-API-Key: village_xxxxxxxxxxxx" \
  -H "X-API-Secret: xxxxxxxxxxxxxxx"
```

## 📋 API Plans

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Requests/min | 1,000 | 10,000 | 100,000 |
| Response Time | Standard | Priority | Dedicated |
| Support | Email | Priority | 24/7 Phone |
| Price | Free | $99/mo | Custom |

## 🔍 Search Examples

### Search Villages
```bash
GET /api/v1/address/search?q=village_name
```

### Search with Filters
```bash
GET /api/v1/address/search?q=delhi&state=Delhi&limit=50
```

### Pagination
```bash
GET /api/v1/address/search?q=delhi&limit=20&offset=40
```

## 📊 View Your Analytics
```bash
GET /api/analytics?days=7
```

Response includes:
- Total requests
- Success rate
- Average response time
- Top endpoints
- Request breakdown

## 🔗 Integrate with Your App

### JavaScript
```javascript
async function searchVillages(query) {
  const response = await fetch(
    `https://api.village-api.com/api/v1/address/search?q=${query}`,
    {
      headers: {
        'X-API-Key': process.env.VILLAGE_API_KEY,
        'X-API-Secret': process.env.VILLAGE_API_SECRET
      }
    }
  );
  return response.json();
}
```

### Python
```python
import requests

def search_villages(query):
    headers = {
        'X-API-Key': os.environ.get('VILLAGE_API_KEY'),
        'X-API-Secret': os.environ.get('VILLAGE_API_SECRET')
    }
    response = requests.get(
        f'https://api.village-api.com/api/v1/address/search?q={query}',
        headers=headers
    )
    return response.json()
```

## ⚠️ Rate Limiting

API responses include rate limit info:
```
X-RateLimit-Limit: 10000
X-RateLimit-Remaining: 9999
X-RateLimit-Reset: 1234567890
```

When limit exceeded (HTTP 429):
```
Retry-After: 45
```

## 🆘 Troubleshooting

### Error: Invalid API credentials
✓ Check API key format (should start with `village_`)
✓ Verify secret hasn't been modified
✓ Ensure key is active

### Error: Rate limit exceeded
✓ Wait for reset time
✓ Upgrade to higher plan
✓ Implement caching in your app

### Error: No results found
✓ Check spelling of search query
✓ Try broader search terms
✓ Use exact location names

## 📞 Support
- **Docs**: https://api.village-api.com/docs
- **Email**: support@village-api.com
- **Status**: https://status.village-api.com

Happy coding! 🎉
