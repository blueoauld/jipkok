"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getAccessToken } from "@/lib/auth";

const LOGIN_PATH = "/login";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === LOGIN_PATH;
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const authed = mounted && getAccessToken() !== null;

  useEffect(() => {
    if (!mounted) return;
    if (!isLogin && !authed) router.replace(LOGIN_PATH);
    if (isLogin && authed) router.replace("/");
  }, [mounted, isLogin, authed, router]);

  if (isLogin) return authed ? null : children;

  if (!authed) return null;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
