"use client";

import { useEffect, useState } from 'react';
import StreakBadge from '@/components/ui/streak';
import { useSession } from 'next-auth/react';

type StreakSummary = {
  current: number;
  longest: number;
  lastDate: string | null;
  last7Days?: { date: string; active: boolean }[];
};

export default function StreakTestPage() {
  const [testData, setTestData] = useState<StreakSummary | null>(null);
  const [manualData, setManualData] = useState<StreakSummary | null>(null);
  const { data: session, status } = useSession();

  const testAPI = async () => {
    try {
      // Test the streak API directly
      const response = await fetch('/api/users/me/streak');
      const data = await response.json();
      console.log('Streak API Response:', data);
      setTestData(data);
    } catch (error) {
      console.error('Error fetching streak data:', error);
    }
  };

  const pingStreak = async () => {
    try {
      const response = await fetch('/api/users/me/streak', { method: 'POST' });
      const data = await response.json();
      console.log('Streak Ping Response:', data);
      setTestData(data);
      
      // Dispatch custom event to update streak badge
      window.dispatchEvent(new CustomEvent('streak:updated', { detail: data }));
    } catch (error) {
      console.error('Error pinging streak:', error);
    }
  };

  // Simulate streak data that should show orange circles
  const simulateStreakData = () => {
    const today = new Date();
    const last7Days = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setUTCDate(date.getUTCDate() - i);
      // Make last 3 days active (should show orange)
      const active = i <= 2;
      last7Days.push({ 
        date: date.toISOString(), 
        active 
      });
    }

    const mockData = {
      current: 3,
      longest: 5,
      lastDate: today.toISOString(),
      last7Days
    };

    setManualData(mockData);
    
    // Dispatch the event to update the streak badge
    window.dispatchEvent(new CustomEvent('streak:updated', { detail: mockData }));
    console.log('Simulated streak data:', mockData);
  };

  useEffect(() => {
    // Only try API if user is authenticated
    if (status === 'authenticated') {
      testAPI();
    }
  }, [status]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Streak Test Page</h1>
      
      <div className="mb-6">
        <div className="text-sm mb-2">
          Authentication Status: {status} 
          {session?.user?.email && ` (${session.user.email})`}
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Streak Badge Component</h2>
        <div className="p-4 border rounded-lg bg-white">
          <StreakBadge />
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <button 
          onClick={testAPI}
          disabled={status !== 'authenticated'}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Test API {status !== 'authenticated' && '(Login Required)'}
        </button>
        
        <button 
          onClick={pingStreak}
          disabled={status !== 'authenticated'}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 ml-4"
        >
          Ping Streak {status !== 'authenticated' && '(Login Required)'}
        </button>

        <button 
          onClick={simulateStreakData}
          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 ml-4"
        >
          Simulate Streak Data
        </button>
      </div>

      {(testData || manualData) && (
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="text-lg font-semibold mb-2">Streak Data</h3>
          <div className="space-y-4">
            {testData && (
              <div>
                <h4 className="font-medium">API Response:</h4>
                <pre className="text-sm bg-white p-2 rounded overflow-auto">
                  {JSON.stringify(testData, null, 2)}
                </pre>
              </div>
            )}
            {manualData && (
              <div>
                <h4 className="font-medium">Simulated Data:</h4>
                <pre className="text-sm bg-white p-2 rounded overflow-auto">
                  {JSON.stringify(manualData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
