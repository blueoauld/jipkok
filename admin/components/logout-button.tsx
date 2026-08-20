"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { logout } from "@/lib/api/auth";
import { clearTokens, getRefreshToken } from "@/lib/auth";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const handleLogout = async () => {
    setPending(true);
    const refreshToken = getRefreshToken();
    if (refreshToken) await logout(refreshToken).catch(() => {});
    clearTokens();
    router.replace("/login");
  };

  return (
    <SidebarMenuButton disabled={pending} onClick={handleLogout}>
      {pending ? (
        <Loader2 className="animate-spin" />
      ) : (
        <>
          <LogOut />
          <span>로그아웃</span>
        </>
      )}
    </SidebarMenuButton>
  );
}
