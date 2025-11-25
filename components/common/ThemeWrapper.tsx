"use client";

import { ThemeProvider } from "next-themes";
import Navbar from "./Navbar";
import { usePathname } from "next/navigation";

export default function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNavbarPaths = ["/", "/sign-in"];
  const showNavbar = !hideNavbarPaths.includes(pathname);

  // Only enable dark mode on pages NOT in hideNavbarPaths
  if (hideNavbarPaths.includes(pathname)) {
    return (
      <>
        {children}
      </>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      {showNavbar && <Navbar />}
      {children}
    </ThemeProvider>
  );
}
