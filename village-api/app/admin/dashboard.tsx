// Admin Dashboard - Manage Platform & Users
'use client';

import { useState, useEffect } from 'react';

interface PlatformStats {
  locationData: {
    total_states: number;
    total_districts: number;
    total_sub_districts: number;
    total_villages: number;
    active_api_keys: number;
    days_with_usage: number;
    requests_24h: number;
    requests_30d: number;
  };
  trendingEndpoints: any[];
  planDistribution: any[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <p className="text-white text-lg">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">Admin Dashboard</h1>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-700/50 rounded-lg border border-slate-600 p-6">
            <h3 className="text-slate-400 text-sm font-medium">Total Locations</h3>
            <p className="text-3xl font-bold text-blue-400 mt-2">
              {stats?.locationData.total_villages?.toLocaleString() || 0}
            </p>
            <p className="text-slate-500 text-xs mt-1">villages in database</p>
          </div>

          <div className="bg-slate-700/50 rounded-lg border border-slate-600 p-6">
            <h3 className="text-slate-400 text-sm font-medium">Active API Keys</h3>
            <p className="text-3xl font-bold text-green-400 mt-2">
              {stats?.locationData.active_api_keys || 0}
            </p>
            <p className="text-slate-500 text-xs mt-1">B2B clients</p>
          </div>

          <div className="bg-slate-700/50 rounded-lg border border-slate-600 p-6">
            <h3 className="text-slate-400 text-sm font-medium">Requests (24h)</h3>
            <p className="text-3xl font-bold text-purple-400 mt-2">
              {stats?.locationData.requests_24h?.toLocaleString() || 0}
            </p>
            <p className="text-slate-500 text-xs mt-1">API calls</p>
          </div>

          <div className="bg-slate-700/50 rounded-lg border border-slate-600 p-6">
            <h3 className="text-slate-400 text-sm font-medium">Requests (30d)</h3>
            <p className="text-3xl font-bold text-orange-400 mt-2">
              {stats?.locationData.requests_30d?.toLocaleString() || 0}
            </p>
            <p className="text-slate-500 text-xs mt-1">total</p>
          </div>
        </div>

        {/* Geographic Data */}
        <div className="bg-slate-700/50 rounded-lg border border-slate-600 p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Location Data Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-slate-400 text-sm">States</p>
              <p className="text-2xl font-bold text-white mt-2">{stats?.locationData.total_states}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Districts</p>
              <p className="text-2xl font-bold text-white mt-2">{stats?.locationData.total_districts?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Sub-Districts</p>
              <p className="text-2xl font-bold text-white mt-2">{stats?.locationData.total_sub_districts?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Villages</p>
              <p className="text-2xl font-bold text-white mt-2">{stats?.locationData.total_villages?.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Top Endpoints */}
        <div className="bg-slate-700/50 rounded-lg border border-slate-600 p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Most Used Endpoints (7 Days)</h2>
          <div className="space-y-3">
            {stats?.trendingEndpoints?.length ? (
              stats.trendingEndpoints.map((ep, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-800 p-4 rounded border border-slate-600">
                  <div>
                    <p className="text-white font-medium">{ep.endpoint}</p>
                    <p className="text-slate-400 text-sm">Avg response: {Math.round(ep.avg_time)}ms</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-400">{ep.count.toLocaleString()}</p>
                </div>
              ))
            ) : (
              <p className="text-slate-400">No data available</p>
            )}
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="bg-slate-700/50 rounded-lg border border-slate-600 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">API Key Plans Distribution</h2>
          <div className="space-y-2">
            {stats?.planDistribution?.length ? (
              stats.planDistribution.map((plan, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-slate-300 capitalize">{plan.plan}</span>
                  <span className="text-white font-semibold">{plan.count} keys</span>
                </div>
              ))
            ) : (
              <p className="text-slate-400">No data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
