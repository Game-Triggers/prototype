"use client";

import { BarChart3 } from "lucide-react";

interface ChartProps {
  type: string;
  data: any;
  height?: number;
}

export function Chart({ type, data, height = 300 }: ChartProps) {
  return (
    <div 
      className="w-full rounded-md bg-muted/30"
      style={{ height: `${height}px` }}
    >
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <BarChart3 className="h-10 w-10 mb-2 mx-auto text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">
            {type} Chart would render here with the provided data
          </p>
        </div>
      </div>
    </div>
  );
}
