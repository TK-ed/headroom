"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ukDate } from "@/lib/format";
import { FilterField } from "./filter-field";

/** Delivery-day picker with previous/next steppers. */
export function DaySelect({ days, value, onChange }: { days: string[]; value: string; onChange: (v: string) => void }) {
  const i = days.indexOf(value);
  return (
    <FilterField label="Delivery day">
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="bg-card" disabled={i <= 0} onClick={() => onChange(days[i - 1])} aria-label="Previous day">
          <ChevronLeft className="size-4" />
        </Button>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="w-40 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {days.map((d) => (
              <SelectItem key={d} value={d}>
                {ukDate(d)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          className="bg-card"
          disabled={i < 0 || i >= days.length - 1}
          onClick={() => onChange(days[i + 1])}
          aria-label="Next day"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </FilterField>
  );
}
