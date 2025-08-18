"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface EnergyPackData {
  current: number;
  maximum: number;
  lastReset: string;
  dailyUsed: number;
  hoursUntilReset: number;
  minutesUntilReset: number;
}

interface EnergyPackContextType {
  energyData: EnergyPackData | null;
  loading: boolean;
  refreshEnergyData: () => Promise<void>;
  decrementEnergyPack: () => void;
}

const EnergyPackContext = createContext<EnergyPackContextType | undefined>(undefined);

export function EnergyPackProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [energyData, setEnergyData] = useState<EnergyPackData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEnergyData = useCallback(async () => {
    // Only fetch if user is a streamer
    if (session?.user?.role !== 'streamer') {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/users/me/energy-packs', {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        setEnergyData(data);
      } else {
        console.error('Failed to fetch energy data:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch energy data:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.role]);

  const refreshEnergyData = useCallback(async () => {
    await fetchEnergyData();
  }, [fetchEnergyData]);

  const decrementEnergyPack = useCallback(() => {
    setEnergyData(prev => {
      if (prev && prev.current > 0) {
        return {
          ...prev,
          current: prev.current - 1,
          dailyUsed: prev.dailyUsed + 1,
        };
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    if (session?.user?.role === 'streamer') {
      fetchEnergyData();
      // Refresh energy data every minute to update the countdown
      const interval = setInterval(fetchEnergyData, 60000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [session, fetchEnergyData]);

  return (
    <EnergyPackContext.Provider value={{
      energyData,
      loading,
      refreshEnergyData,
      decrementEnergyPack,
    }}>
      {children}
    </EnergyPackContext.Provider>
  );
}

export function useEnergyPack() {
  const context = useContext(EnergyPackContext);
  if (context === undefined) {
    throw new Error('useEnergyPack must be used within an EnergyPackProvider');
  }
  return context;
}
