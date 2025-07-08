"use client";

import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: React.ReactNode;
}

export function StatCard({ title, value, change, trend, icon }: StatCardProps) {
  return (
    <Card className="p-6">
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
        <div className="flex items-center mt-3">
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
          {trend === "up" && <TrendingUp className="h-3 w-3 ml-1 text-green-500" />}
          {trend === "down" && <TrendingDown className="h-3 w-3 ml-1 text-red-500" />}
        </div>
      )}
    </Card>
  );
}
