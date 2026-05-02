// src/components/SearchBar.tsx
import { useState, useEffect, useRef } from 'react';

interface VillageResult {
  area_name: string;
  sub_district: string;
  district: string;
  state: string;
  country?: string;
}

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<VillageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchVillages = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }
    setLoading(true);
    try {
      // ✅ Now using relative path – proxy will forward to Next.js
      const res = await fetch(`/api/v1/address/search?q=${encodeURIComponent(searchTerm)}&limit=20`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResults(data.results || []);
      setShowResults(true);
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchVillages(query);
    }, 400);
  }, [query]);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <input
        type="text"
        placeholder="Search villages... e.g. Moshi"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
      />
      {loading && <div className="mt-2 text-gray-500 text-center">Searching...</div>}
      {showResults && results.length > 0 && (
        <div className="absolute z-20 w-full mt-1 bg-white border rounded-md shadow-lg max-h-80 overflow-y-auto">
          {results.map((item, idx) => (
            <div
              key={idx}
              className="p-3 border-b hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                setQuery(item.area_name);
                setShowResults(false);
              }}
            >
              <div className="font-semibold">{item.area_name}</div>
              <div className="text-sm text-gray-600">
                {item.sub_district}, {item.district}, {item.state}
              </div>
            </div>
          ))}
        </div>
      )}
      {showResults && results.length === 0 && query.length >= 2 && !loading && (
        <div className="absolute w-full mt-1 p-3 bg-white border rounded-md shadow-lg text-gray-500 text-center">
          No villages found.
        </div>
      )}
    </div>
  );
}