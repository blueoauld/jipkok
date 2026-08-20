"use client";

import { LogOut } from "lucide-react";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { logout } from "@/lib/api/auth";
import { clearTokens, getRefreshToken } from "@/lib/auth";

export function LogoutButton() {
  const handleLogout = async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) await logout(refreshToken).catch(() => {});
    clearTokens();
    window.location.assign("/login");
  };

  return (
    <SidebarMenuButton onClick={handleLogout}>
      <LogOut />
      <span>로그아웃</span>
    </SidebarMenuButton>
  );
}
