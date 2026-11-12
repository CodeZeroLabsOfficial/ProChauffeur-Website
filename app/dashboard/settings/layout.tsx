import type { ReactNode } from "react";

import { SettingsNav } from "@/components/dashboard/settings/settings-nav";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl space-y-4 lg:space-y-6">
      <div className="space-y-0.5">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your account, payment methods, and appearance.
        </p>
      </div>
      <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
        <aside className="lg:w-64">
          <SettingsNav />
        </aside>
        <div className="min-w-0 flex-1 lg:max-w-2xl">{children}</div>
      </div>
    </div>
  );
}
