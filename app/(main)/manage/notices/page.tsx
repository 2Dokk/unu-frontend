import { Construction } from "lucide-react";

export default function NoticesPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
      <Construction className="h-10 w-10" />
      <p className="text-lg font-medium">개발 중인 페이지입니다</p>
    </div>
  );
}
