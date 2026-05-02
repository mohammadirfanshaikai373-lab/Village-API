// Admin Dashboard - B2B Client Management
'use client';

import { useState, useEffect } from 'react';

interface ApiKey {
  id: number;
  apiKey: string;
  plan: string;
  isActive: boolean;
  client: { name: string; email: string };
  createdAt: string;
  lastUsedAt: string | null;
}

export default function AdminDashboard() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/admin/api-keys', {
        headers: {
          'X-Admin-Token': process.env.NEXT_PUBLIC_ADMIN_TOKEN || ''
        }
      });
      const data = await response.json();
      setKeys(data.keys || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-slate-400">Manage B2B API Keys and Client Access</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-slate-700">
          {['overview', 'keys', 'analytics'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
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

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
              <h3 className="text-slate-400 text-sm font-medium">Total API Keys</h3>
              <p className="text-3xl font-bold text-white mt-2">{keys.length}</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
              <h3 className="text-slate-400 text-sm font-medium">Active Keys</h3>
              <p className="text-3xl font-bold text-green-400 mt-2">
                {keys.filter(k => k.isActive).length}
              </p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
              <h3 className="text-slate-400 text-sm font-medium">Premium Plans</h3>
              <p className="text-3xl font-bold text-purple-400 mt-2">
                {keys.filter(k => k.plan !== 'free').length}
              </p>
            </div>
          </div>
        )}

        {/* Keys Tab */}
        {activeTab === 'keys' && (
          <div className="bg-slate-700/50 rounded-lg border border-slate-600 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800 border-b border-slate-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Client</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Plan</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">API Key</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Last Used</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-600">
                  {keys.map(key => (
                    <tr key={key.id} className="hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-3 text-sm text-white">{key.client.name}</td>
                      <td className="px-6 py-3 text-sm text-slate-300">{key.client.email}</td>
                      <td className="px-6 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          key.plan === 'enterprise' ? 'bg-purple-900 text-purple-300' :
                          key.plan === 'pro' ? 'bg-blue-900 text-blue-300' :
                          'bg-gray-900 text-gray-300'
                        }`}>
                          {key.plan.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm font-mono text-slate-300">{key.apiKey}</td>
                      <td className="px-6 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          key.isActive ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                        }`}>
                          {key.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-400">
                        {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="bg-slate-700/50 rounded-lg border border-slate-600 p-6">
            <h2 className="text-xl font-bold text-white mb-4">System Analytics</h2>
            <p className="text-slate-400">View detailed analytics on usage patterns, performance metrics, and client engagement.</p>
            <div className="mt-6 text-slate-300 text-sm">
              <ul className="space-y-2">
                <li>✓ Daily request counts by plan</li>
                <li>✓ API response time distribution</li>
                <li>✓ Top endpoints by usage</li>
                <li>✓ Error rate tracking</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
