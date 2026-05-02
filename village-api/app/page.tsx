"use client";
import { useState } from "react";

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/address/search?q=${encodeURIComponent(query)}&limit=20`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Village Search Dashboard</h1>
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="Type village name (e.g., Moshi)"
            className="flex-1 p-3 border rounded-lg shadow-sm"
          />
          <button
            onClick={search}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((item: any, idx) => (
              <div key={idx} className="bg-white p-4 rounded-lg shadow border">
                <div className="font-semibold text-lg">{item.area_name}</div>
                <div className="text-gray-600">
                  {item.sub_district}, {item.district}, {item.state}
                </div>
              </div>
            ))}
          </div>
        )}
        {results.length === 0 && query && !loading && (
          <div className="text-center text-gray-500">No villages found</div>
        )}
      </div>
    </main>
  );
}