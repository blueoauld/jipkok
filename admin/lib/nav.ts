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
      { title: "고민 신고", href: "/reports/worries" },
      { title: "고민 댓글 신고", href: "/reports/worry-comments" },
    ],
  },
  { title: "회원", href: "/members", icon: Users },
  { title: "정지", href: "/suspensions", icon: ShieldBan },
];

export type Breadcrumb = { title: string; href?: string };

export function breadcrumbsFor(pathname: string): Breadcrumb[] {
  for (const item of navItems) {
    const child = item.children?.find((c) => pathname.startsWith(c.href));
    if (child) {
      const crumbs: Breadcrumb[] = [
        { title: item.title, href: item.href },
        { title: child.title, href: child.href },
      ];
      return pathname === child.href ? crumbs : [...crumbs, { title: "상세" }];
    }
    if (item.href === pathname) return [{ title: item.title }];
    if (item.href !== "/" && pathname.startsWith(item.href)) {
      return [{ title: item.title, href: item.href }, { title: "상세" }];
    }
  }
  return [];
}
