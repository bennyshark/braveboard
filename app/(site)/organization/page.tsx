// app/(site)/organizations/page.tsx
"use client"

import { Suspense, useEffect, useState } from "react"
import { Loader2, Users, Shield, ArrowRight, Plus, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { OrganizationsList } from "@/components/organizations/OrganizationsList"

function OrganizationsContent() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [faithAdminSettings, setFaithAdminSettings] = useState<{
    description: string | null
    avatar_url: string | null
    cover_url: string | null
  } | null>(null)

  // Create org modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [orgName, setOrgName] = useState("")
  const [orgCode, setOrgCode] = useState("")
  const [creating, setCreating] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)

      // Check if user is admin
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        setIsAdmin(profile?.role === 'admin')
      }

      // Load FAITH admin settings
      await loadFaithAdminSettings()
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadFaithAdminSettings() {
    try {
      const { data } = await supabase
        .from('faith_admin_settings')
        .select('*')
        .single()

      if (data) {
        setFaithAdminSettings(data)
      }
    } catch (error) {
      console.error('Error loading FAITH admin settings:', error)
    }
  }

  async function createOrganization() {
    if (!orgName.trim() || !orgCode.trim()) {
      alert('Please fill in organization name and code')
      return
    }

    setCreating(true)

    try {
      // Generate UUID for the organization
      const orgId = crypto.randomUUID()
      
      // Create organization with explicit ID
      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({
          id: orgId,
          code: orgCode.trim().toUpperCase(),
          name: orgName.trim(),
          description: null,
          avatar_url: null,
          cover_url: null,
          member_count: 0
        })
        .select()
        .single()

      if (orgError) throw orgError

      // Redirect to organization settings page
      router.push(`/organization/${orgId}/settings`)

    } catch (error: any) {
      console.error('Error creating organization:', error)
      alert(`Failed to create organization: ${error.message}`)
    } finally {
      setCreating(false)
    }
  }

  function resetCreateModal() {
    setShowCreateModal(false)
    setOrgName("")
    setOrgCode("")
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto pb-10 px-4">
      {/* Create Organization Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-gray-900">Create New Organization</h3>
                <p className="text-sm text-gray-500 mt-1">You can add details later in settings</p>
              </div>
              <button 
                onClick={resetCreateModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Organization Name */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Organization Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g., Student Council, Tech Club"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 focus:outline-none"
                  autoFocus
                />
              </div>

              {/* Organization Code */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Organization Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={orgCode}
                  onChange={(e) => setOrgCode(e.target.value.toUpperCase())}
                  placeholder="e.g., SC, TC"
                  maxLength={10}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 focus:outline-none uppercase"
                />
                <p className="text-xs text-gray-500 mt-1">Short code for your organization (max 10 characters)</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={resetCreateModal}
                  disabled={creating}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={createOrganization}
                  disabled={creating || !orgName.trim() || !orgCode.trim()}
                  className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create & Continue'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900">Organizations</h1>
              <p className="text-gray-600">Explore and join student organizations</p>
            </div>
          </div>

          {/* Admin Create Button */}
          {isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-all hover:shadow-lg"
            >
              <Plus className="h-5 w-5" />
              Create Organization
            </button>
          )}
        </div>
      </div>

      {/* FAITH Administration Card - Hardcoded */}
      <div className="mb-6">
        <h2 className="text-lg font-black text-gray-900 mb-3 flex items-center gap-2">
          <Shield className="h-5 w-5 text-purple-600" />
          Official Administration
        </h2>
        
        <div
          onClick={() => router.push('/faith-admin')}
          className="bg-white rounded-2xl border-2 border-purple-200 p-6 cursor-pointer hover:border-purple-400 hover:shadow-lg transition-all group"
        >
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {faithAdminSettings?.avatar_url ? (
                <img 
                  src={faithAdminSettings.avatar_url} 
                  alt="FAITH Administration"
                  className="h-20 w-20 rounded-xl object-cover shadow-lg bg-white"
                />
              ) : (
                <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg">
                  <Shield className="h-10 w-10 text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-black text-gray-900 group-hover:text-purple-600 transition-colors">
                    FAITH Administration
                  </h3>
                  <p className="text-sm text-purple-600 font-bold mb-2">Official FAITH Administration</p>
                  
                  {faithAdminSettings?.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                      {faithAdminSettings.description}
                    </p>
                  )}
                </div>

                <button className="flex items-center gap-1 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg font-bold text-sm transition-colors group-hover:bg-purple-500 group-hover:text-white">
                  View
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 mt-3">
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                  Official
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">
                  Administration
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Regular Organizations List */}
      <div>
        <h2 className="text-lg font-black text-gray-900 mb-3 flex items-center gap-2">
          <Users className="h-5 w-5 text-orange-600" />
          Student Organizations
        </h2>
        <OrganizationsList />
      </div>
    </div>
  )
}

export default function OrganizationsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    }>
      <OrganizationsContent />
    </Suspense>
  )
}