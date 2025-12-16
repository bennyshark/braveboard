// components/common/sidebar.tsx
"use client"

import { 
  Home, 
  Calendar, 
  Image, 
  Settings,
  MessageSquare,
  Users,
  Briefcase,
  FileText,
  User,
  Bookmark
} from "lucide-react"
import { useState } from "react"

export default function Sidebar() {
  const [activeItem, setActiveItem] = useState("home")

  const menuItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "gallery", label: "Gallery", icon: Image },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "research", label: "Research", icon: FileText },
    { id: "departments", label: "Departments", icon: Briefcase },
    { id: "organizations", label: "Organizations", icon: Users },
  ]

  return (
    <aside className="h-full w-full bg-[#FDFCF8] px-4 py-6 border-r border-stone-100">
      <div className="h-full flex flex-col">
        {/* Main Navigation */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="mb-8">
            <h3 className="flex items-center gap-2 text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 px-4">
              <Bookmark className="h-3 w-3" />
              Navigation
            </h3>
            <div className="space-y-1.5">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = activeItem === item.id
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveItem(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group ${
                      isActive
                        ? "bg-white border-2 border-stone-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)] text-blue-700"
                        : "text-stone-600 hover:bg-stone-50 hover:text-stone-900 border-2 border-transparent"
                    }`}
                  >
                    <Icon className={`h-5 w-5 transition-colors ${
                      isActive ? "text-blue-500 fill-blue-50" : "text-stone-400 group-hover:text-stone-600"
                    }`} />
                    <span className="font-semibold text-sm">{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Account Section */}
          <div>
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 px-4 pt-4 border-t border-dashed border-stone-200">
              Account
            </h3>

            <div className="space-y-1.5">
              <button className="w-full flex items-center gap-3 px-4 py-3 text-stone-600 hover:bg-stone-50 rounded-2xl transition-colors">
                <User className="h-5 w-5 text-stone-400" />
                <span className="font-semibold text-sm">Profile</span>
              </button>

              <button className="w-full flex items-center gap-3 px-4 py-3 text-stone-600 hover:bg-stone-50 rounded-2xl transition-colors">
                <Settings className="h-5 w-5 text-stone-400" />
                <span className="font-semibold text-sm">Settings</span>
              </button>
            </div>
          </div>
        </div>

        {/* User Profile Footer - Card Style */}
        <div className="pt-4 mt-2">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-stone-100 shadow-sm cursor-pointer hover:border-blue-200 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-300 to-orange-500 flex items-center justify-center shadow-inner">
              <span className="text-white font-bold text-sm">JD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-stone-800 text-sm truncate">John Doe</p>
              <p className="text-xs text-stone-500 truncate">Faculty Member</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}