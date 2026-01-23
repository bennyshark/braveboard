// components/organizations/OrganizationsList.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Users, Search, Loader2, ChevronRight } from "lucide-react"

type Organization = {
  id: string
  code: string
  name: string
  description: string | null
  avatar_url: string | null
  member_count: number
}

type UserOrganization = {
  organization: Organization
  role: string
  joined_at: string
}

export function OrganizationsList() {
  const router = useRouter()
  const [userOrgs, setUserOrgs] = useState<UserOrganization[]>([])
  const [allOrgs, setAllOrgs] = useState<Organization[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  useEffect(() => {
    loadOrganizations()
  }, [])

  async function loadOrganizations() {
    try {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Get user's organizations
        const { data: userOrgsData } = await supabase
          .from('user_organizations')
          .select(`
            role,
            joined_at,
            organization:organizations (
              id,
              code,
              name,
              description,
              avatar_url,
              member_count
            )
          `)
          .eq('user_id', user.id)
          .order('joined_at', { ascending: false })

        if (userOrgsData) {
          setUserOrgs(userOrgsData as any)
        }
      }

      // Get all organizations
      const { data: allOrgsData } = await supabase
        .from('organizations')
        .select('*')
        .order('name')

      if (allOrgsData) {
        setAllOrgs(allOrgsData)
      }

    } catch (error) {
      console.error('Error loading organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrgs = allOrgs.filter(org => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'admin':
        return <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">Admin</span>
      case 'officer':
        return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">Officer</span>
      case 'member':
        return <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">Member</span>
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* My Organizations */}
      {userOrgs.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
          <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            My Organizations
          </h2>
          
          <div className="space-y-2">
            {userOrgs.map((userOrg) => (
              <button
                key={userOrg.organization.id}
                onClick={() => router.push(`/organization/${userOrg.organization.id}`)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group"
              >
                <div className="flex items-center gap-3">
                  {userOrg.organization.avatar_url ? (
                    <img 
                      src={userOrg.organization.avatar_url} 
                      alt={userOrg.organization.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                      <span className="text-white text-sm font-black">
                        {userOrg.organization.code.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  <div className="text-left">
                    <p className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                      {userOrg.organization.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{userOrg.organization.member_count} members</span>
                      <span>•</span>
                      {getRoleBadge(userOrg.role)}
                    </div>
                  </div>
                </div>
                
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-orange-600 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* All Organizations */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Organizations
          </h2>
          
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm font-bold text-blue-600 hover:text-blue-700"
          >
            {showAll ? 'Show Less' : 'Show All'}
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search organizations..."
            className="w-full px-4 py-2 pl-10 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>

        {/* Organizations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(showAll ? filteredOrgs : filteredOrgs.slice(0, 6)).map((org) => {
            const userOrg = userOrgs.find(uo => uo.organization.id === org.id)
            
            return (
              <button
                key={org.id}
                onClick={() => router.push(`/organization/${org.id}`)}
                className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group text-left"
              >
                {org.avatar_url ? (
                  <img 
                    src={org.avatar_url} 
                    alt={org.name}
                    className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-black">
                      {org.code.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors truncate">
                    {org.name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{org.member_count} members</span>
                    {userOrg && (
                      <>
                        <span>•</span>
                        {getRoleBadge(userOrg.role)}
                      </>
                    )}
                  </div>
                </div>

                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-orange-600 transition-colors flex-shrink-0" />
              </button>
            )
          })}
        </div>

        {filteredOrgs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="font-medium">No organizations found</p>
          </div>
        )}
      </div>
    </div>
  )
}