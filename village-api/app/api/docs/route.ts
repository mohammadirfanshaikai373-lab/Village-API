// API Documentation endpoint
import { NextResponse } from 'next/server';
import { jsonError } from '@/lib/api-response';

export async function GET() {
  try {
    const apiDoc = {
      api: 'Village Data Importer API',
      version: '1.0.0',
      baseUrl: 'https://your-api-domain.com/api',
      authentication: {
        type: 'API Key',
        methods: [
          'X-API-Key: <your-api-key>',
          'Authorization: Bearer <your-api-key>'
        ],
        rateLimits: {
          free: '100 requests/day',
          pro: '10,000 requests/day',
          enterprise: '1,000,000 requests/day'
        }
      },
      endpoints: [
        {
          name: 'Search Villages',
          path: '/v1/address/search',
          method: 'GET',
          description: 'Search villages, sub-districts, districts, or states',
          params: {
            q: 'Search query (partial match on name)',
            state: 'Filter by state name or census code',
            district: 'Filter by district name or census code',
            sub_district: 'Filter by sub-district name or census code',
            limit: 'Results per page (max 100, default 20)',
            offset: 'Pagination offset (default 0)'
          },
          response: {
            success: true,
            data: [
              {
                id: 1,
                name: 'Village Name',
                type: 'village',
                censusCode: '123456',
                hierarchy: { state: 'State Name', district: 'District Name', subDistrict: 'Sub-District Name' }
              }
            ],
            pagination: { limit: 20, offset: 0, total: 150 }
          },
          rateLimit: '1 request'
        },
        {
          name: 'Get All States',
          path: '/v1/address/states',
          method: 'GET',
          description: 'Get list of all states',
          params: {},
          response: {
            data: [
              { id: 1, name: 'Andhra Pradesh', censusCode: '01' },
              { id: 2, name: 'Arunachal Pradesh', censusCode: '02' }
            ]
          },
          rateLimit: '1 request',
          cache: 'Cached for 24 hours'
        },
        {
          name: 'Get Districts',
          path: '/v1/address/states/:stateId/districts',
          method: 'GET',
          description: 'Get all districts of a state',
          params: {
            stateId: 'State ID (path parameter)'
          },
          response: {
            data: [
              { id: 1, name: 'District Name', censusCode: '01' }
            ]
          },
          rateLimit: '1 request'
        },
        {
          name: 'Get Sub-Districts',
          path: '/v1/address/sub-districts/:subDistrictId/villages',
          method: 'GET',
          description: 'Get all villages under a sub-district',
          params: {
            subDistrictId: 'Sub-District ID (path parameter)',
            limit: 'Results per page (default 50)',
            offset: 'Pagination offset (default 0)'
          },
          response: {
            data: [
              { id: 1, name: 'Village Name', censusCode: '123456' }
            ]
          },
          rateLimit: '1 request per village'
        },
        {
          name: 'Get Hierarchy',
          path: '/v1/address/hierarchy',
          method: 'GET',
          description: 'Get complete hierarchy (state → district → sub-district → village)',
          params: {
            stateId: 'Filter by state ID'
          },
          response: {
            data: {
              state: { id: 1, name: 'State Name' },
              districts: [
                {
                  id: 1,
                  name: 'District Name',
                  subDistricts: [
                    {
                      id: 1,
                      name: 'Sub-District Name',
                      villageCount: 250
                    }
                  ]
                }
              ]
            }
          },
          rateLimit: '1 request'
        },
        {
          name: 'Get Analytics',
          path: '/analytics',
          method: 'GET',
          description: 'Get your API usage analytics',
          params: {
            days: 'Number of days to get stats for (default 7)'
          },
          response: {
            period: { days: 7, fromDate: '2024-01-01', toDate: '2024-01-08' },
            plan: 'pro',
            rateLimit: 10000,
            requestsToday: 145,
            summary: {
              totalRequests: 2150,
              successfulRequests: 2145,
              failedRequests: 5,
              successRate: '99.77%',
              avgResponseTime: 45,
              maxResponseTime: 230
            },
            dailyStats: [],
            topEndpoints: []
          },
          rateLimit: '1 request'
        },
        {
          name: 'Health Check',
          path: '/health',
          method: 'GET',
          description: 'Check API and service health',
          params: {},
          response: {
            status: 'healthy',
            timestamp: '2024-01-08T10:30:00Z',
            checks: {
              database: { status: 'up' },
              redis: { status: 'up' }
            },
            responseTime: 5
          },
          rateLimit: 'Unlimited'
        }
      ],
      errorCodes: {
        400: 'Bad Request - Invalid parameters',
        401: 'Unauthorized - Invalid or missing API key',
        429: 'Rate Limit Exceeded - Too many requests',
        500: 'Internal Server Error'
      },
      examples: {
        curl: [
          'curl -H "X-API-Key: your-api-key" "https://api.example.com/api/v1/address/search?q=Delhi"',
          'curl -H "Authorization: Bearer your-api-key" "https://api.example.com/api/health"'
        ],
        python: `
import requests
headers = {'X-API-Key': 'your-api-key'}
response = requests.get('https://api.example.com/api/v1/address/search?q=Delhi', headers=headers)
print(response.json())
        `,
        javascript: `
const apiKey = 'your-api-key';
const response = await fetch('https://api.example.com/api/v1/address/search?q=Delhi', {
  headers: { 'X-API-Key': apiKey }
});
const data = await response.json();
        `
      },
      support: {
        documentation: 'https://docs.example.com',
        email: 'support@example.com',
        slack: 'https://slack.example.com'
      }
    };

    return NextResponse.json(apiDoc);
  } catch (error) {
    console.error('Docs error:', error);
    return jsonError('Failed to load API documentation');
  }
}
