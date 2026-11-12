import type { ReactNode } from "react";

import { LoginThemeProvider } from "@/components/auth/login-theme-provider";

export default function LoginLayout({ children }: { children: ReactNode }) {
  return <LoginThemeProvider>{children}</LoginThemeProvider>;
}
