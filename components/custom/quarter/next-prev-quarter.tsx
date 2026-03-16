import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface NextPrevQuarterProps {
  onNext?: () => void;
  onPrev?: () => void;
}

export function NextQuarterButton({ onNext }: NextPrevQuarterProps) {
  return (
    <Button variant="outline" size="icon" aria-label="Submit" onClick={onNext}>
      <ChevronRight />
    </Button>
  );
}

export function PrevQuarterButton({ onPrev }: NextPrevQuarterProps) {
  return (
    <Button variant="outline" size="icon" aria-label="Submit" onClick={onPrev}>
      <ChevronLeft />
    </Button>
  );
}
