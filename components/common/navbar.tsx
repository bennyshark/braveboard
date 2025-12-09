// components/common/navbar.tsx
"use client"

import { Search, Moon, Bell } from "lucide-react"
import { useState } from "react"

export default function Navbar() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b bg-white shadow-sm">
      <div className="px-6 h-full">
        <div className="flex items-center justify-between h-full">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
              <span className="text-white font-bold">B</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-xl">Braveboard</h1>
              <p className="text-xs text-gray-500 hidden sm:block">FAITH Colleges</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="search"
                placeholder="Search announcements, events, or people..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
              <Bell className="h-5 w-5" />
            </button>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <Moon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}