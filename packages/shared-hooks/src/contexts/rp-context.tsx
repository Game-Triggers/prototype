"use client";

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface RPData {
  total: number;
  earnedToday: number;
  lastEarned: Date | null;
  activities: Array<{
    type: string;
    amount: number;
    earnedAt: Date;
  }>;
}

interface RPContextType {
  rpData: RPData | null;
  loading: boolean;
  addRP: (activityType: string, amount: number) => Promise<void>;
  refreshRP: () => Promise<void>;
}

const RPContext = createContext<RPContextType | undefined>(undefined);

export function RPProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [rpData, setRPData] = useState<RPData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRPData = useCallback(async () => {
    if (status === 'loading') return;
    
    if (!session?.user) {
      setRPData(null);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/users/me/rp', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRPData(data);
      } else {
        console.error('Failed to fetch RP data:', response.statusText);
        setRPData(null);
      }
    } catch (error) {
      console.error('Error fetching RP data:', error);
      setRPData(null);
    } finally {
      setLoading(false);
    }
  }, [session, status]);

  const addRP = useCallback(async (activityType: string, amount: number) => {
    if (!session?.user) return;

    try {
      const response = await fetch('/api/users/me/rp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityType,
          amount,
        }),
      });

      if (response.ok) {
        const updatedData = await response.json();
        setRPData(updatedData);
      } else {
        console.error('Failed to add RP:', response.statusText);
      }
    } catch (error) {
      console.error('Error adding RP:', error);
    }
  }, [session]);

  const refreshRP = useCallback(async () => {
    await fetchRPData();
  }, [fetchRPData]);

  useEffect(() => {
    fetchRPData();
  }, [fetchRPData]);

  return (
    <RPContext.Provider value={{
      rpData,
      loading,
      addRP,
      refreshRP,
    }}>
      {children}
    </RPContext.Provider>
  );
}

export function useRP() {
  const context = useContext(RPContext);
  if (context === undefined) {
    throw new Error('useRP must be used within an RPProvider');
  }
  return context;
}
