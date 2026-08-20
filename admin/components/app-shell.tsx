"use client";

import { useEffect, useState } from "react";
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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLogin && !getAccessToken()) {
      router.replace(LOGIN_PATH);
      return;
    }
    setReady(true);
  }, [isLogin, router]);

  if (isLogin) return children;

  if (!ready) return null;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <div className="flex flex-1 flex-col gap-6 p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
