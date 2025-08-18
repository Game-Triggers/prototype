"use client";

import { useEffect, useState } from 'react';

type StreakSummary = {
  current: number;
  longest: number;
  lastDate: string | null;
  last7Days?: { date: string; active: boolean }[];
};

export default function StreakDebugPage() {
  const [summary, setSummary] = useState<StreakSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStreak = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching streak data...');
      
      const res = await fetch('/api/users/me/streak', { cache: 'no-store' });
      console.log('Response status:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('Received streak data:', data);
        setSummary(data);
      } else {
        const errorText = await res.text();
        console.error('Failed to fetch streak:', res.status, errorText);
        setError(`Failed to fetch: ${res.status} ${errorText}`);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(`Error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const pingStreak = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Pinging streak...');
      
      const res = await fetch('/api/users/me/streak', { 
        method: 'POST',
        cache: 'no-store' 
      });
      console.log('Ping response status:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('Ping result:', data);
        setSummary(data);
      } else {
        const errorText = await res.text();
        console.error('Failed to ping streak:', res.status, errorText);
        setError(`Failed to ping: ${res.status} ${errorText}`);
      }
    } catch (err) {
      console.error('Ping error:', err);
      setError(`Error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreak();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Streak Debug Page</h1>
      
      <div className="space-y-4 mb-8">
        <button 
          onClick={fetchStreak}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Fetch Streak Data'}
        </button>
        
        <button 
          onClick={pingStreak}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 ml-4"
        >
          {loading ? 'Loading...' : 'Ping Streak'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {summary && (
        <div className="space-y-6">
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Streak Summary</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-600">Current Streak</div>
                <div className="text-2xl font-bold">{summary.current}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Longest Streak</div>
                <div className="text-2xl font-bold">{summary.longest}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Last Date</div>
                <div className="text-sm">{summary.lastDate || 'None'}</div>
              </div>
            </div>
          </div>

          {summary.last7Days && (
            <div className="bg-gray-100 p-4 rounded">
              <h2 className="text-lg font-semibold mb-4">Last 7 Days Activity</h2>
              <div className="space-y-2">
                {summary.last7Days.map((day, index) => {
                  const date = new Date(day.date);
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                  const dateStr = date.toLocaleDateString('en-US');
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded">
                      <div>
                        <span className="font-medium">{dayName}</span>
                        <span className="text-gray-600 ml-2">{dateStr}</span>
                      </div>
                      <div className="flex items-center">
                        <div 
                          className={`w-4 h-4 rounded-full border ${
                            day.active 
                              ? 'bg-orange-500 border-orange-600' 
                              : 'bg-gray-300 border-gray-400'
                          }`}
                        />
                        <span className="ml-2 text-sm">
                          {day.active ? '🟠 Active' : '⚪ Inactive'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-gray-100 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Raw Data</h2>
            <pre className="text-sm bg-white p-2 rounded overflow-auto">
              {JSON.stringify(summary, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
