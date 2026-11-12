import {
  CreditCardIcon,
  SettingsIcon,
  ReceiptIcon,
  RouteIcon,
  UserIcon,
  PaletteIcon,
  type LucideIcon
} from "lucide-react";

export type DashboardNavItem = {
  title: string;
  href: string;
  icon?: LucideIcon;
  items?: DashboardNavItem[];
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
    icon: SettingsIcon,
    items: [
      {
        title: "Account Settings",
        href: "/dashboard/settings/account",
        icon: UserIcon
      },
      {
        title: "Billing",
        href: "/dashboard/settings/billing",
        icon: CreditCardIcon
      },
      {
        title: "Appearance",
        href: "/dashboard/settings/appearance",
        icon: PaletteIcon
      }
    ]
  }
];
