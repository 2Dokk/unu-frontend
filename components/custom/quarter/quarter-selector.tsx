"use client";

import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuarterResponse } from "@/lib/interfaces/quarter";
import { getAllQuarters, getCurrentQuarter } from "@/lib/api/quarter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuarterSelectorProps {
  value?: string;
  onChange: (value: string) => void;
}

export function QuarterSelector({ value, onChange }: QuarterSelectorProps) {
  const [quarters, setQuarters] = useState<QuarterResponse[]>([]);
  const [prevButtonDisabled, setPrevButtonDisabled] = useState(false);
  const [nextButtonDisabled, setNextButtonDisabled] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [currentQuarter, allQuarters] = await Promise.all([
          getCurrentQuarter(),
          getAllQuarters(),
        ]);
        const sortedQuarters = allQuarters.sort(
          (a, b) =>
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
        );
        setQuarters(sortedQuarters);
        onChange(currentQuarter.id.toString());
      } catch (error: any) {
        console.error("Failed to fetch quarters:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const currentIndex = quarters.findIndex((q) => q.id.toString() === value);
    setPrevButtonDisabled(currentIndex <= 0);
    setNextButtonDisabled(currentIndex >= quarters.length - 1);
  }, [value, quarters]);

  const onPrev = () => {
    const currentIndex = quarters.findIndex((q) => q.id.toString() === value);
    if (currentIndex > 0) {
      onChange(quarters[currentIndex - 1].id.toString());
    }
  };

  const onNext = () => {
    const currentIndex = quarters.findIndex((q) => q.id.toString() === value);
    if (currentIndex < quarters.length - 1) {
      onChange(quarters[currentIndex + 1].id.toString());
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        aria-label="Submit"
        onClick={onPrev}
        disabled={prevButtonDisabled}
      >
        <ChevronLeft />
      </Button>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="분기 선택" />
        </SelectTrigger>
        <SelectContent>
          {quarters.map((q) => (
            <SelectItem key={q.id} value={q.id.toString()}>
              {q.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="icon"
        aria-label="Submit"
        onClick={onNext}
        disabled={nextButtonDisabled}
      >
        <ChevronRight />
      </Button>
    </div>
  );
}
