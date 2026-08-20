"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { logout } from "@/lib/api/auth";
import { clearTokens, getRefreshToken } from "@/lib/auth";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) await logout(refreshToken).catch(() => {});
    clearTokens();
    router.replace("/login");
  };

  return (
    <SidebarMenuButton onClick={handleLogout}>
      <LogOut />
      <span>로그아웃</span>
    </SidebarMenuButton>
  );
}
