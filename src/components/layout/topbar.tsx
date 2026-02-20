"use client";

import { UserButton } from "@clerk/nextjs";
import { MobileNav } from "./mobile-nav";
import { api } from "@/lib/trpc/client";

function OrgNameDisplay() {
  const { data: org } = api.settings.getOrg.useQuery(undefined, {
    retry: false,
  });
  if (!org) return null;
  return (
    <span className="text-sm font-medium text-foreground/80 truncate max-w-[160px] hidden sm:block">
      {org.name}
    </span>
  );
}

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center gap-4 px-4">
        <MobileNav />
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          <OrgNameDisplay />
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
}
