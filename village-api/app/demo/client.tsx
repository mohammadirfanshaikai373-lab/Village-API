// Demo Client - Shows API Integration
'use client';

import { useState } from 'react';

export default function DemoClient() {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [tab, setTab] = useState<'search' | 'analytics'>('search');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey || !apiSecret || !searchQuery) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/v1/address/search?q=${encodeURIComponent(searchQuery)}`,
        {
          headers: {
            'X-API-Key': apiKey,
            'X-API-Secret': apiSecret,
          },
        }
      );

      const data = await response.json();
      if (response.ok) {
        setResults(data.results || []);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert(`Search failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGetAnalytics = async () => {
    if (!apiKey || !apiSecret) return;

    setLoading(true);
    try {
      const response = await fetch('/api/analytics?days=7', {
        headers: {
          'X-API-Key': apiKey,
          'X-API-Secret': apiSecret,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setStats(data);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert(`Failed to fetch analytics: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">Village API - Demo Client</h1>

        {/* Credentials Input */}
        <div className="bg-slate-700/50 rounded-lg border border-slate-600 p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">API Credentials</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="password"
              placeholder="API Key (village_...)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <input
              type="password"
              placeholder="API Secret"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setTab('search')}
            className={`px-6 py-2 rounded font-semibold transition-colors ${
              tab === 'search'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Search Demo
          </button>
          <button
            onClick={() => {
              setTab('analytics');
              handleGetAnalytics();
            }}
            className={`px-6 py-2 rounded font-semibold transition-colors ${
              tab === 'analytics'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Analytics
          </button>
        </div>

        {/* Search Tab */}
        {tab === 'search' && (
          <div className="bg-slate-700/50 rounded-lg border border-slate-600 p-6 mb-8">
            <form onSubmit={handleSearch} className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search villages, districts, states..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 font-semibold"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </form>

            {results.length > 0 && (
              <div>
                <p className="text-slate-400 mb-4">{results.length} results found</p>
                <div className="space-y-2">
                  {results.map((result, idx) => (
                    <div key={idx} className="bg-slate-800 p-4 rounded border border-slate-600">
                      <p className="text-white font-semibold">{result.name}</p>
                      <p className="text-slate-400 text-sm">
                        Type: {result.type} | State: {result.state} | District: {result.district}
                      </p>
                      {result.pincode && (
                        <p className="text-slate-400 text-sm">Pincode: {result.pincode}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {tab === 'analytics' && stats && (
          <div className="bg-slate-700/50 rounded-lg border border-slate-600 p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Usage Statistics (Last 7 Days)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-800 p-4 rounded">
                <p className="text-slate-400 text-sm">Total Requests</p>
                <p className="text-3xl font-bold text-blue-400">{stats.summary?.totalRequests || 0}</p>
              </div>
              <div className="bg-slate-800 p-4 rounded">
                <p className="text-slate-400 text-sm">Success Rate</p>
                <p className="text-3xl font-bold text-green-400">{stats.summary?.successRate || '0%'}</p>
              </div>
              <div className="bg-slate-800 p-4 rounded">
                <p className="text-slate-400 text-sm">Avg Response Time</p>
                <p className="text-3xl font-bold text-purple-400">{stats.summary?.avgResponseTime || 0}ms</p>
              </div>
            </div>

            {stats.topEndpoints?.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-white mb-3">Top Endpoints</h4>
                <div className="space-y-2">
                  {stats.topEndpoints.map((ep: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-slate-300 text-sm border-b border-slate-600 pb-2">
                      <span>{ep.endpoint}</span>
                      <span>{ep.request_count} requests</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
