// components/common/navbar.tsx
"use client"

import { Search, Moon, Bell, Menu } from "lucide-react"
import { useState } from "react"

export default function Navbar() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-[72px] bg-[#FDFCF8]/95 backdrop-blur-sm border-b-2 border-dashed border-stone-200">
      <div className="px-6 h-full">
        <div className="flex items-center justify-between h-full mx-auto">
          
          {/* Logo - Styled like a sticker */}
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 text-stone-600">
              <Menu className="h-6 w-6" />
            </button>
            <div className="h-10 w-10 rounded-xl bg-blue-600 shadow-[2px_2px_0px_0px_rgba(37,99,235,0.3)] flex items-center justify-center transform hover:-rotate-6 transition-transform">
              <span className="text-white font-black text-xl">B</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-stone-800 text-xl tracking-tight">Braveboard</h1>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                <p className="text-xs text-stone-500 font-medium">FAITH Colleges</p>
              </div>
            </div>
          </div>

          {/* Search Bar - Styled like a paper cutout */}
          <div className="flex-1 max-w-xl mx-4 md:mx-8 hidden sm:block">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-stone-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="search"
                placeholder="Search memories, events, or people..."
                className="w-full pl-11 pr-4 py-3 border-2 border-stone-100 bg-white rounded-2xl focus:bg-white focus:outline-none focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all text-sm placeholder:text-stone-400 shadow-sm"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            <button className="p-2.5 text-stone-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2.5 h-2 w-2 bg-orange-400 rounded-full border border-white"></span>
            </button>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 text-stone-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
            >
              <Moon className="h-5 w-5" />
            </button>
            
            {/* Mobile Search Trigger */}
            <button className="sm:hidden p-2.5 text-stone-600">
              <Search className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}