import { ReceiptIcon, RouteIcon, SettingsIcon, type LucideIcon } from "lucide-react";

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
    title: "My Billing",
    href: "/dashboard/billing",
    icon: ReceiptIcon
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: SettingsIcon
  }
];
