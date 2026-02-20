"use client";

import { UserButton, OrganizationSwitcher } from "@clerk/nextjs";
import { MobileNav } from "./mobile-nav";

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center gap-4 px-4">
        <MobileNav />
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          <OrganizationSwitcher
            appearance={{
              elements: {
                rootBox: "text-sm max-w-[160px] sm:max-w-none",
                organizationSwitcherTrigger: "truncate",
              },
            }}
          />
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
}
