import { AppShell } from "@/components/app/app-shell";

export default function AppAreaLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
