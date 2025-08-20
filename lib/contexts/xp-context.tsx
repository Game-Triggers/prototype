"use client";

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface XPData {
  total: number;
  earnedToday: number;
  lastEarned: Date | null;
  activities: Array<{
    type: string;
    amount: number;
    earnedAt: Date;
  }>;
}

interface XPContextType {
  xpData: XPData | null;
  loading: boolean;
  addXP: (activityType: string, amount: number) => Promise<void>;
  refreshXP: () => Promise<void>;
}

const XPContext = createContext<XPContextType | undefined>(undefined);

export function XPProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [xpData, setXPData] = useState<XPData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchXPData = useCallback(async () => {
    if (status === 'loading') return;
    
    if (!session?.user) {
      setXPData(null);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/users/me/xp', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setXPData(data);
      } else {
        console.error('Failed to fetch XP data:', response.statusText);
        setXPData(null);
      }
    } catch (error) {
      console.error('Error fetching XP data:', error);
      setXPData(null);
    } finally {
      setLoading(false);
    }
  }, [session, status]);

  const addXP = useCallback(async (activityType: string, amount: number) => {
    if (!session?.user) return;

    try {
      const response = await fetch('/api/users/me/xp', {
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
        setXPData(updatedData);
      } else {
        console.error('Failed to add XP:', response.statusText);
      }
    } catch (error) {
      console.error('Error adding XP:', error);
    }
  }, [session]);

  const refreshXP = useCallback(async () => {
    await fetchXPData();
  }, [fetchXPData]);

  useEffect(() => {
    fetchXPData();
  }, [fetchXPData]);

  return (
    <XPContext.Provider value={{
      xpData,
      loading,
      addXP,
      refreshXP,
    }}>
      {children}
    </XPContext.Provider>
  );
}

export function useXP() {
  const context = useContext(XPContext);
  if (context === undefined) {
    throw new Error('useXP must be used within an XPProvider');
  }
  return context;
}
