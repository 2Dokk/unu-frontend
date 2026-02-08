import { NavigationBar } from "@/components/custom/navigation-bar";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col h-screen">
      <NavigationBar />
      <div className="flex flex-1 overflow-auto justify-center">{children}</div>
    </div>
  );
}
