import type { ReactNode } from "react";

import { SettingsNav } from "@/components/dashboard/settings/settings-nav";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 lg:space-y-6">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and set e-mail preferences.
        </p>
      </div>
      <div className="flex w-full flex-col space-y-4 space-x-0 lg:flex-row lg:space-y-0 lg:space-x-6">
        <aside className="w-full lg:w-64 lg:shrink-0">
          <SettingsNav />
        </aside>
        <div className="w-full min-w-0 flex-1 lg:max-w-2xl">{children}</div>
      </div>
    </div>
  );
}
