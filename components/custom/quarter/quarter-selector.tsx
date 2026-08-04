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
  minQuarterId?: string;
}

export function QuarterSelector({
  value,
  onChange,
  minQuarterId,
}: QuarterSelectorProps) {
  const [quarters, setQuarters] = useState<QuarterResponse[]>([]);
  const [prevButtonDisabled, setPrevButtonDisabled] = useState(false);
  const [nextButtonDisabled, setNextButtonDisabled] = useState(false);

  const minQuarterIndex = quarters.findIndex((q) => q.id === minQuarterId);
  const selectableQuarters =
    minQuarterIndex >= 0 ? quarters.slice(minQuarterIndex) : quarters;

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
        if (!value) onChange(currentQuarter.id);
      } catch (error: any) {
        console.error("Failed to fetch quarters:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (
      value &&
      selectableQuarters.length > 0 &&
      !selectableQuarters.some((q) => q.id === value)
    ) {
      onChange(selectableQuarters[0].id);
    }
  }, [minQuarterId, quarters, value]);

  useEffect(() => {
    const currentIndex = selectableQuarters.findIndex((q) => q.id === value);
    setPrevButtonDisabled(currentIndex <= 0);
    setNextButtonDisabled(
      currentIndex < 0 || currentIndex >= selectableQuarters.length - 1,
    );
  }, [value, quarters, minQuarterId]);

  const onPrev = () => {
    const currentIndex = selectableQuarters.findIndex((q) => q.id === value);
    if (currentIndex > 0) {
      onChange(selectableQuarters[currentIndex - 1].id);
    }
  };

  const onNext = () => {
    const currentIndex = selectableQuarters.findIndex((q) => q.id === value);
    if (currentIndex >= 0 && currentIndex < selectableQuarters.length - 1) {
      onChange(selectableQuarters[currentIndex + 1].id);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="이전 분기"
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
          {selectableQuarters.map((q) => (
            <SelectItem key={q.id} value={q.id}>
              {q.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="다음 분기"
        onClick={onNext}
        disabled={nextButtonDisabled}
      >
        <ChevronRight />
      </Button>
    </div>
  );
}
