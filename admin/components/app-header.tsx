"use client";

import { Fragment } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { breadcrumbsFor } from "@/lib/nav";

export function AppHeader() {
  const crumbs = breadcrumbsFor(usePathname());

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 md:px-6">
      <SidebarTrigger />
      <Breadcrumb>
        <BreadcrumbList>
          {crumbs.map((crumb, index) => (
            <Fragment key={crumb.title}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {index < crumbs.length - 1 && crumb.href ? (
                  <BreadcrumbLink render={<Link href={crumb.href} />}>
                    {crumb.title}
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
