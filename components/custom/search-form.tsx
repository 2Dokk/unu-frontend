import { Search } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Input } from "../ui/input";

export function SearchForm({ ...props }: React.ComponentProps<"form">) {
  return (
    <form {...props}>
      <div className="relative md:w-64">
        <Label htmlFor="search" className="sr-only">
          Search
        </Label>
        <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none" />
        <Input
          className="pl-9"
          id="search"
          type="search"
          placeholder="검색하기"
        />
      </div>
    </form>
  );
}
