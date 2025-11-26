"use client";

import { ThemeProvider } from "next-themes";
import { usePathname } from "next/navigation";
import Navbar from "@/components/common/Navbar";
import Sidebar from "@/components/common/Sidebar";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // pages WITHOUT navbar + sidebar
  const hideUIRoutes = ["/", "/sign-in"];
  const showUI = !hideUIRoutes.includes(pathname);

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {showUI ? (
            <div className="flex">
              {/* Sidebar */}
              <Sidebar />

              {/* Main area */}
              <div className="flex-1 ml-0 md:ml-64">
                <Navbar />
                <main className="pt-24">{children}</main>
              </div>
            </div>
          ) : (
            // Login + landing pages (no UI shell)
            children
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
