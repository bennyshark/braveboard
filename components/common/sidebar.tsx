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
  Bookmark,
  LogOut,
  Shield,
  Upload
} from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"

export default function Sidebar() {
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()

  // Base menu items for all users
  const baseMenuItems = [
    { id: "home", label: "Home", icon: Home, path: "/home" },
    { id: "calendar", label: "Calendar", icon: Calendar, path: "/calendar" },
    { id: "gallery", label: "Gallery", icon: Image, path: "/gallery" },
    { id: "messages", label: "Messages", icon: MessageSquare, path: "/messages" },
    { id: "research", label: "Research", icon: FileText, path: "/research" },
    { id: "departments", label: "Departments", icon: Briefcase, path: "/departments" },
    { id: "organizations", label: "Organizations", icon: Users, path: "/organizations" },
  ]

  // Admin menu items (only shown to admins)
  const adminMenuItems = [
    { id: "admin", label: "Admin", icon: Shield, path: "/admin/import-profiles" }
  ]

  // Combine menu items based on user role
  const getMenuItems = () => {
    if (userProfile?.role === 'admin') {
      return [...baseMenuItems, ...adminMenuItems]
    }
    return baseMenuItems
  }

  const menuItems = getMenuItems()

  useEffect(() => {
    fetchUserProfile()
  }, [])

  async function fetchUserProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push("/signin")
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      setUserProfile(profile)
    } catch (error) {
      console.error("Error fetching user profile:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/signin")
  }

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  // Check if a menu item is active
  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path)
  }

  // Generate initials: first name + first letter of last name
  const getInitials = () => {
    if (!userProfile?.first_name && !userProfile?.last_name) return "U"
    
    const firstName = userProfile?.first_name || ""
    const lastName = userProfile?.last_name || ""
    
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase()
    } else if (firstName) {
      return firstName[0].toUpperCase()
    } else if (lastName) {
      return lastName[0].toUpperCase()
    }
    return "U"
  }

  // Get display name
  const getDisplayName = () => {
    if (userProfile?.first_name && userProfile?.last_name) {
      return `${userProfile.first_name} ${userProfile.last_name}`
    } else if (userProfile?.first_name) {
      return userProfile.first_name
    } else if (userProfile?.last_name) {
      return userProfile.last_name
    }
    return "User"
  }

  // Get department or role
  const getDepartment = () => {
    if (userProfile?.department_code) {
      return userProfile.department_code
    } else if (userProfile?.role === "admin") {
      return "Administrator"
    }
    return "Member"
  }

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
                const active = isActive(item.path)
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group ${
                      active
                        ? "bg-white border-2 border-stone-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)] text-blue-700"
                        : "text-stone-600 hover:bg-stone-50 hover:text-stone-900 border-2 border-transparent"
                    }`}
                  >
                    <Icon className={`h-5 w-5 transition-colors ${
                      active ? "text-blue-500 fill-blue-50" : "text-stone-400 group-hover:text-stone-600"
                    }`} />
                    <span className="font-semibold text-sm">{item.label}</span>
                    {item.id === "admin" && (
                      <div className="ml-auto h-2 w-2 rounded-full bg-blue-500" />
                    )}
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
              <button 
                onClick={() => handleNavigation("/profile")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors ${
                  isActive("/profile") 
                    ? "bg-white border-2 border-stone-100 shadow-sm text-blue-700" 
                    : "text-stone-600 hover:bg-stone-50"
                }`}
              >
                <User className="h-5 w-5 text-stone-400" />
                <span className="font-semibold text-sm">Profile</span>
              </button>

              <button 
                onClick={() => handleNavigation("/settings")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors ${
                  isActive("/settings") 
                    ? "bg-white border-2 border-stone-100 shadow-sm text-blue-700" 
                    : "text-stone-600 hover:bg-stone-50"
                }`}
              >
                <Settings className="h-5 w-5 text-stone-400" />
                <span className="font-semibold text-sm">Settings</span>
              </button>

              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-2xl transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-semibold text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* User Profile Footer - Card Style */}
        <div className="pt-4 mt-2">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-stone-100 shadow-sm cursor-pointer hover:border-blue-200 transition-colors">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-inner ${
              userProfile?.role === 'admin' 
                ? 'bg-gradient-to-br from-purple-400 to-purple-600' 
                : 'bg-gradient-to-br from-orange-300 to-orange-500'
            }`}>
              <span className="text-white font-bold text-sm">
                {loading ? "..." : getInitials()}
              </span>
              {userProfile?.role === 'admin' && (
                <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center">
                  <Shield className="h-2 w-2 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold text-stone-800 text-sm truncate">
                  {loading ? "Loading..." : getDisplayName()}
                </p>
                {userProfile?.role === 'admin' && (
                  <span className="px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded font-medium">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 truncate">
                {loading ? "..." : getDepartment()}
              </p>
              {userProfile?.course_code && (
                <p className="text-xs text-stone-400 truncate">
                  {userProfile.course_code}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}