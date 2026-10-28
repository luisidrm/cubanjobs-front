import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Header } from "@/components/layout/header";

// Signed-in app screens: header only, no marketing footer. Session gating
// itself belongs at the proxy/data layer (added in a later stage), not here.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <BottomTabBar />
    </>
  );
}
