// components/common/sidebar.tsx
"use client"

import { 
  Home, 
  Calendar, 
  Image, 
  Settings,
  LogOut,
  MessageSquare,
  Users,
  Briefcase,
  FileText,
  User
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
    <aside className="h-full w-64 border-r bg-white">
      {/* Navigation Section */}
      <div className="p-4 h-full flex flex-col pt-15">
        {/* Main Navigation */}
        <div className="flex-1">
          <div className="mb-8">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-4">
              Navigation
            </h3>
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = activeItem === item.id
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveItem(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? "text-blue-600" : "text-gray-500"}`} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Account Section */}
          <div>
  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-4 pt-5">
    Account
  </h3>

  <div className="space-y-1">

    {/* Profile */}
    <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg">
      <User className="h-5 w-5 text-gray-500" />
      <span className="font-medium">Profile</span>
    </button>

    {/* Settings */}
    <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg">
      <Settings className="h-5 w-5 text-gray-500" />
      <span className="font-medium">Settings</span>
    </button>

  </div>
</div>

        </div>

        {/* User Profile Footer - Fixed at bottom */}
        <div className="pt-4 border-t">
          <div className="flex items-center gap-3 p-3">
            <div className="h-10 w-10 rounded-full g-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <span className="text-white font-medium">JD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">John Doe</p>
              <p className="text-xs text-gray-500 truncate">Faculty Member</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}