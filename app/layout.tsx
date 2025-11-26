"use client";

import { ThemeProvider } from "next-themes";
import { usePathname } from "next/navigation";
import Navbar from "@/components/common/Navbar";
import Sidebar from "@/components/common/Sidebar";
import UpdatesPanel from "@/components/common/UpdatesPanel";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode; }) {
  const pathname = usePathname();

  const hideUIRoutes = ["/", "/sign-in"];
  const showUI = !hideUIRoutes.includes(pathname);

  const updates = Array.from({ length: 30 }).map((_, i) => ({
    id: i + 1,
    title: `Update ${i + 1}`,
    description: `This is a demo update item number ${i + 1}.`,
    time: `${i + 1}h ago`,
  }));

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {showUI ? (
            // whole app locked to viewport height so only internal panels scroll
            <div className="h-screen flex">
              {/* Sidebar (left) */}
              <Sidebar />

              {/* Right column (navbar on top, then content + updates) */}
              <div className="flex-1 flex flex-col min-h-0">
                {/* Navbar — stays visible */}
                <div className="shrink-0">
                  <Navbar />
                </div>

                {/* Content row: main + updates */}
                <div className="flex-1 flex overflow-hidden min-h-0">
                  {/* Main content: scrollable only */}
                  <main className="flex-1 overflow-auto p-6 min-h-0">
                    {children}
                  </main>

                  {/* Updates panel: scrollable only */}
                  <UpdatesPanel updates={updates} />
                </div>
              </div>
            </div>
          ) : (
            children
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
