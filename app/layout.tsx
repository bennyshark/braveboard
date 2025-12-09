// app/layout.tsx
"use client"

import { usePathname } from "next/navigation"
import "./globals.css"
import Navbar from "@/components/common/navbar"
import Sidebar from "@/components/common/sidebar"
import UpdatesSection from "@/components/common/updates-section"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()
  
  // Routes where we DON'T show navbar, sidebar, updates
  const hideUIRoutes = ["/", "/signin", "/auth/callback"]
  const showUI = !hideUIRoutes.includes(pathname)

  return (
    <html lang="en">
      <body className="antialiased">
        {showUI ? (
          <div className="min-h-screen bg-gray-50">
            {/* Fixed Navbar */}
            <Navbar />
            
            <div className="flex h-[calc(100vh-64px)] mt-16">
              {/* Fixed Sidebar */}
              <div className="fixed left-0 top-16 h-[calc(100vh-64px)] w-64">
                <Sidebar />
              </div>
              
              {/* Scrollable Main Content */}
              <div className="flex-1 ml-64 overflow-y-auto">
                {children}
              </div>
              
              {/* Fixed Updates Section */}
              <div className="fixed right-0 top-16 h-[calc(100vh-64px)] w-80">
                <UpdatesSection />
              </div>
              
              {/* Spacer for updates section */}
              <div className="w-80" />
            </div>
          </div>
        ) : (
          // For signin, landing page, etc. (no UI shell)
          children
        )}
      </body>
    </html>
  )
}