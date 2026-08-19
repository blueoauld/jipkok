import {
  Flag,
  LayoutDashboard,
  ShieldBan,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  children?: { title: string; href: string }[];
};

export const navItems: NavItem[] = [
  { title: "대시보드", href: "/", icon: LayoutDashboard },
  {
    title: "신고",
    href: "/reports/members",
    icon: Flag,
    children: [
      { title: "회원 신고", href: "/reports/members" },
      { title: "피드 신고", href: "/reports/feeds" },
    ],
  },
  { title: "회원", href: "/members", icon: Users },
  { title: "정지", href: "/suspensions", icon: ShieldBan },
];

export function breadcrumbsFor(pathname: string) {
  for (const item of navItems) {
    const child = item.children?.find((c) => c.href === pathname);
    if (child) return [item.title, child.title];
    if (item.href === pathname) return [item.title];
  }
  return [];
}
