"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface FilterBarProps {
  onFilterChange: (filter: string) => void;
}

export function FilterBar({ onFilterChange }: FilterBarProps) {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  
  const handleFilterClick = (filter: string) => {
    setActiveFilter(filter);
    onFilterChange(filter);
  };
  
  return (
    <div className="flex overflow-x-auto py-2 mb-4 gap-2">
      {["all", "gaming", "music", "lifestyle", "food", "tech"].map((filter) => (
        <Button
          key={filter}
          variant={activeFilter === filter ? "default" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => handleFilterClick(filter)}
        >
          {filter.charAt(0).toUpperCase() + filter.slice(1)}
        </Button>
      ))}
    </div>
  );
}
