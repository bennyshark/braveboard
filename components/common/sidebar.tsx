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
  LogOut
} from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function Sidebar() {
  const [activeItem, setActiveItem] = useState("home")
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  const menuItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "gallery", label: "Gallery", icon: Image },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "research", label: "Research", icon: FileText },
    { id: "departments", label: "Departments", icon: Briefcase },
    { id: "organizations", label: "Organizations", icon: Users },
  ]

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
              <button 
                onClick={() => setActiveItem("profile")}
                className="w-full flex items-center gap-3 px-4 py-3 text-stone-600 hover:bg-stone-50 rounded-2xl transition-colors"
              >
                <User className="h-5 w-5 text-stone-400" />
                <span className="font-semibold text-sm">Profile</span>
              </button>

              <button 
                onClick={() => setActiveItem("settings")}
                className="w-full flex items-center gap-3 px-4 py-3 text-stone-600 hover:bg-stone-50 rounded-2xl transition-colors"
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
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-300 to-orange-500 flex items-center justify-center shadow-inner">
              <span className="text-white font-bold text-sm">
                {loading ? "..." : getInitials()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-stone-800 text-sm truncate">
                {loading ? "Loading..." : getDisplayName()}
              </p>
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