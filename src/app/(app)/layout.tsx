import BottomNav from "@/components/BottomNav";

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-16">{children}</div>
      <BottomNav />
    </>
  );
}
