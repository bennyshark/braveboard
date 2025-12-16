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
  
  const hideUIRoutes = ["/", "/signin", "/auth/callback"]
  const showUI = !hideUIRoutes.includes(pathname)

  return (
    <html lang="en">
      <body className="antialiased text-gray-800">
        {showUI ? (
          // Changed bg-gray-50 to bg-[#FDFCF8] for a warm paper look
          <div className="min-h-screen bg-[#FDFCF8]">
            {/* Fixed Navbar */}
            <Navbar />
            
            <div className="flex h-[calc(100vh-72px)] mt-[72px]">
              {/* Fixed Sidebar - Increased rounding styling inside the component */}
              <div className="fixed left-0 top-[72px] h-[calc(100vh-72px)] w-64 z-20 hidden md:block">
                <Sidebar />
              </div>
              
              {/* Scrollable Main Content - Centered and widened */}
              <div className="flex-1 md:ml-64 md:mr-80 overflow-y-auto scrollbar-hide">
                <div className="min-h-full px-4 py-6">
                  {children}
                </div>
              </div>
              
              {/* Fixed Updates Section */}
              <div className="fixed right-0 top-[72px] h-[calc(100vh-72px)] w-80 z-20 hidden lg:block">
                <UpdatesSection />
              </div>
            </div>
          </div>
        ) : (
          children
        )}
      </body>
    </html>
  )
}