"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuarterResponse } from "@/lib/interfaces/quarter";
import { getAllQuarters, getCurrentQuarter } from "@/lib/api/quarter";
import {
  compareQuartersChronologically,
  getQuarterSequence,
} from "@/lib/utils/quarter-utils";
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
  const [currentQuarterId, setCurrentQuarterId] = useState("");

  const selectableQuarters = useMemo(() => {
    const minQuarter = quarters.find((q) => q.id === minQuarterId);
    return minQuarter
      ? quarters.filter(
          (quarter) =>
            getQuarterSequence(quarter) >= getQuarterSequence(minQuarter),
        )
      : quarters;
  }, [minQuarterId, quarters]);
  const chronologicalQuarters = useMemo(
    () => [...selectableQuarters].sort(compareQuartersChronologically),
    [selectableQuarters],
  );
  const currentIndex = chronologicalQuarters.findIndex(
    (q) => q.id === value,
  );
  const prevButtonDisabled = currentIndex <= 0;
  const nextButtonDisabled =
    currentIndex < 0 || currentIndex >= chronologicalQuarters.length - 1;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [currentQuarter, allQuarters] = await Promise.all([
          getCurrentQuarter(),
          getAllQuarters(),
        ]);
        setQuarters(allQuarters);
        setCurrentQuarterId(currentQuarter.id);
      } catch (error: unknown) {
        console.error("Failed to fetch quarters:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!value && currentQuarterId) onChange(currentQuarterId);
  }, [currentQuarterId, onChange, value]);

  useEffect(() => {
    if (
      value &&
      chronologicalQuarters.length > 0 &&
      !selectableQuarters.some((q) => q.id === value)
    ) {
      onChange(chronologicalQuarters[0].id);
    }
  }, [chronologicalQuarters, onChange, selectableQuarters, value]);

  const onPrev = () => {
    if (currentIndex > 0) {
      onChange(chronologicalQuarters[currentIndex - 1].id);
    }
  };

  const onNext = () => {
    if (
      currentIndex >= 0 &&
      currentIndex < chronologicalQuarters.length - 1
    ) {
      onChange(chronologicalQuarters[currentIndex + 1].id);
    }
  };

  return (
    <div className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:w-fit">
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
        <SelectTrigger className="w-full min-w-0 sm:w-[180px]">
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
