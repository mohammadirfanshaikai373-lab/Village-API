// Demo Client Application - Shows how to use the Village Data API
'use client';

import { useState } from 'react';

export default function DemoClient() {
  const [apiKey, setApiKey] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('search');

  const searchVillages = async () => {
    if (!apiKey || !searchQuery) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/v1/address/search?q=${encodeURIComponent(searchQuery)}&limit=20`,
        {
          headers: { 'X-API-Key': apiKey }
        }
      );
      const data = await response.json();
      setSearchResults(data.data || []);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!apiKey) return;

    try {
      const response = await fetch(`/api/analytics?days=7`, {
        headers: { 'X-API-Key': apiKey }
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Village Data API - Demo Client</h1>
          <p className="text-slate-400">Interactive demo to test the API integration</p>
        </div>

        {/* API Key Input */}
        {!apiKey ? (
          <div className="bg-slate-700/50 rounded-lg border border-slate-600 p-8 max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Get Started</h2>
            <p className="text-slate-400 mb-6">
              Enter your API key to start exploring the API. Don't have one?{' '}
              <a href="/register" className="text-blue-400 hover:text-blue-300">
                Register here
              </a>
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="Enter your API key (village_...)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1 px-4 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => {
                  if (apiKey) fetchStats();
                }}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
              >
                Connect
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Connected Header */}
            <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 mb-8">
              <div className="flex justify-between items-center">
                <p className="text-green-400 font-medium">✓ Connected to API</p>
                <button
                  onClick={() => setApiKey('')}
                  className="px-4 py-2 bg-red-900/50 border border-red-700 text-red-400 rounded hover:bg-red-900 transition-colors text-sm"
                >
                  Disconnect
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-slate-700">
              {['search', 'analytics', 'code'].map(tab => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    if (tab === 'analytics') fetchStats();
                  }}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === tab
                      ? 'text-blue-400 border-b-2 border-blue-400'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Search Tab */}
            {activeTab === 'search' && (
              <div className="space-y-6">
                <div className="bg-slate-700/50 rounded-lg border border-slate-600 p-6">
                  <h3 className="text-white font-semibold mb-4">Search Villages</h3>
                  <div className="flex gap-2 mb-6">
                    <input
                      type="text"
                      placeholder="Search by village, district, state..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchVillages()}
                      className="flex-1 px-4 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={searchVillages}
                      disabled={loading}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white rounded font-medium transition-colors"
                    >
                      {loading ? 'Searching...' : 'Search'}
                    </button>
                  </div>

                  {/* Results */}
                  {searchResults.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-slate-300 text-sm">Found {searchResults.length} results</p>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {searchResults.map((result, idx) => (
                          <div key={idx} className="bg-slate-800 rounded p-3 border border-slate-600">
                            <p className="text-white font-medium">{result.name}</p>
                            <div className="text-slate-400 text-sm mt-1">
                              {result.hierarchy && (
                                <p>
                                  {result.hierarchy.state}
                                  {result.hierarchy.district && ` → ${result.hierarchy.district}`}
                                  {result.hierarchy.subDistrict && ` → ${result.hierarchy.subDistrict}`}
                                </p>
                              )}
                              <p>Code: {result.censusCode}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && stats && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                    <p className="text-slate-400 text-sm">Total Requests</p>
                    <p className="text-2xl font-bold text-white">{stats.summary.totalRequests}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                    <p className="text-slate-400 text-sm">Success Rate</p>
                    <p className="text-2xl font-bold text-green-400">{stats.summary.successRate}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                    <p className="text-slate-400 text-sm">Avg Response Time</p>
                    <p className="text-2xl font-bold text-blue-400">{stats.summary.avgResponseTime}ms</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                    <p className="text-slate-400 text-sm">Plan</p>
                    <p className="text-2xl font-bold text-purple-400">{stats.plan.toUpperCase()}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Code Examples Tab */}
            {activeTab === 'code' && (
              <div className="space-y-6">
                <div className="bg-slate-700/50 rounded-lg border border-slate-600 p-6">
                  <h3 className="text-white font-semibold mb-4">JavaScript Example</h3>
                  <pre className="bg-slate-800 rounded p-4 text-slate-300 text-sm overflow-x-auto">
{`const apiKey = '${apiKey}';

// Search villages
async function searchVillages(query) {
  const response = await fetch(
    \`/api/v1/address/search?q=\${query}&limit=20\`,
    { headers: { 'X-API-Key': apiKey } }
  );
  return response.json();
}

// Get analytics
async function getAnalytics() {
  const response = await fetch(
    '/api/analytics?days=7',
    { headers: { 'X-API-Key': apiKey } }
  );
  return response.json();
}

// Example usage
searchVillages('Delhi').then(console.log);`}
                  </pre>
                </div>

                <div className="bg-slate-700/50 rounded-lg border border-slate-600 p-6">
                  <h3 className="text-white font-semibold mb-4">Python Example</h3>
                  <pre className="bg-slate-800 rounded p-4 text-slate-300 text-sm overflow-x-auto">
{`import requests

API_KEY = '${apiKey}'
BASE_URL = '/api/v1'

headers = {'X-API-Key': API_KEY}

# Search villages
response = requests.get(
    f'{BASE_URL}/address/search?q=Delhi&limit=20',
    headers=headers
)
results = response.json()

# Get analytics
response = requests.get(
    '/api/analytics?days=7',
    headers=headers
)
analytics = response.json()`}
                  </pre>
                </div>

                <div className="bg-slate-700/50 rounded-lg border border-slate-600 p-6">
                  <h3 className="text-white font-semibold mb-4">cURL Example</h3>
                  <pre className="bg-slate-800 rounded p-4 text-slate-300 text-sm overflow-x-auto">
{`# Search villages
curl -H "X-API-Key: ${apiKey}" \\
  "https://api.example.com/api/v1/address/search?q=Delhi&limit=20"

# Get analytics
curl -H "X-API-Key: ${apiKey}" \\
  "https://api.example.com/api/analytics?days=7"`}
                  </pre>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
