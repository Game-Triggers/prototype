"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: React.ReactNode;
}

export function StatCard({ title, value, change, trend, icon }: StatCardProps) {
  return (
    <Card className="p-6 flex flex-col space-y-2">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
        </div>
        <div className="p-2 rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
      </div>
      {change && (
        <div className="flex items-center">
          <span
            className={`text-xs ${
              trend === "up"
                ? "text-green-500"
                : trend === "down"
                ? "text-red-500"
                : "text-muted-foreground"
            }`}
          >
            {change}
          </span>
          <TrendingUp 
            className={`h-3 w-3 ml-1 ${
              trend === "up"
                ? "text-green-500"
                : trend === "down"
                ? "text-red-500"
                : "text-muted-foreground"
            }`}
          />
        </div>
      )}
    </Card>
  );
}
