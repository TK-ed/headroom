"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterField } from "./filter-field";

const HOURS = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, "0")}:00`);

export function CutoffSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <FilterField label="Decision time, day before">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-40 bg-card">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {HOURS.map((h) => (
            <SelectItem key={h} value={h}>
              <span className="tnum">{h}</span> UK
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FilterField>
  );
}
