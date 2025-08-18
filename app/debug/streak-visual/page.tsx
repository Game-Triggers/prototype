"use client";

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Day {
  date: string;
  active: boolean;
}

export default function StreakVisualizationTest() {
  // Test data - simulate what the backend should return
  const [testData, setTestData] = useState<Day[]>([
    { date: "2025-08-12T00:00:00.000Z", active: false },
    { date: "2025-08-13T00:00:00.000Z", active: false },
    { date: "2025-08-14T00:00:00.000Z", active: false },
    { date: "2025-08-15T00:00:00.000Z", active: false },
    { date: "2025-08-16T00:00:00.000Z", active: true },
    { date: "2025-08-17T00:00:00.000Z", active: true },
    { date: "2025-08-18T00:00:00.000Z", active: true },
  ]);

  const toggleDay = (index: number) => {
    setTestData(prev => prev.map((day, i) => 
      i === index ? { ...day, active: !day.active } : day
    ));
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Streak Visualization Test</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-100 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Interactive 7-Day Streak Circles</h2>
          <p className="text-sm text-gray-600 mb-4">
            Click on any circle to toggle its state. Orange = active day, Gray = inactive day.
          </p>
          
          <div className="grid grid-cols-7 gap-3">
            {testData.map((day, index) => {
              const date = new Date(day.date);
              const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
              const dateStr = date.getDate();
              
              return (
                <div key={index} className="flex flex-col items-center space-y-2">
                  <div className="text-xs text-gray-500 font-medium">{dayName}</div>
                  <button
                    onClick={() => toggleDay(index)}
                    className={cn(
                      'w-6 h-6 rounded-full border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500',
                      day.active 
                        ? 'bg-orange-500 border-orange-600' 
                        : 'bg-gray-300 border-gray-400 hover:bg-gray-400'
                    )}
                    title={`${dayName} ${date.toLocaleDateString()} - ${day.active ? 'Active' : 'Inactive'}`}
                  />
                  <div className="text-xs text-gray-400">{dateStr}</div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded-full bg-orange-500 border border-orange-600"></div>
                <span>Active</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded-full bg-gray-300 border border-gray-400"></div>
                <span>Inactive</span>
              </div>
            </div>
            <div className="text-gray-600">
              Active days: {testData.filter(d => d.active).length} / 7
            </div>
          </div>
        </div>

        <div className="bg-gray-100 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">StreakBadge Style Test</h2>
          <p className="text-sm text-gray-600 mb-4">
            This simulates the exact styling used in the StreakBadge component:
          </p>
          
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="mb-1 flex items-center justify-between text-[10px] text-gray-500">
              <span>Last 7 days</span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-orange-500" /> active
              </span>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {testData.map((d, i) => (
                <div key={i} className="flex items-center justify-center">
                  <div
                    className={cn(
                      'h-4 w-4 rounded-full border cursor-pointer hover:scale-110 transition-transform',
                      d.active ? 'bg-orange-500 border-orange-600' : 'bg-muted border-transparent'
                    )}
                    title={new Date(d.date).toUTCString()}
                    onClick={() => toggleDay(i)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gray-100 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Current Test Data</h2>
          <pre className="text-sm bg-white p-3 rounded overflow-auto">
            {JSON.stringify(testData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
