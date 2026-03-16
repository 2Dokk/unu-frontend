import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function ActivityCreationButton() {
  return (
    <Link href="/activities/new">
      <Button>
        <Plus className="h-4 w-4 mr-2" />
        활동 생성
      </Button>
    </Link>
  );
}
