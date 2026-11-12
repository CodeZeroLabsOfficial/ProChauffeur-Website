import { RouteIcon, SettingsIcon, type LucideIcon } from "lucide-react";

export type DashboardNavItem = {
  title: string;
  href: string;
  icon?: LucideIcon;
};

export const dashboardNavItems: DashboardNavItem[] = [
  {
    title: "My Trips",
    href: "/dashboard/trips",
    icon: RouteIcon
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: SettingsIcon
  }
];
