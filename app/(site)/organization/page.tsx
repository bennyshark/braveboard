// app/(site)/organizations/page.tsx
"use client"

import { Suspense, useEffect, useState } from "react"
import { Loader2, Users, Shield, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { OrganizationsList } from "@/components/organizations/OrganizationsList"

function OrganizationsContent() {
  const router = useRouter()
  const [faithAdminSettings, setFaithAdminSettings] = useState<{
    description: string | null
    avatar_url: string | null
    cover_url: string | null
  } | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  useEffect(() => {
    loadFaithAdminSettings()
  }, [])

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

  return (
    <div className="max-w-5xl mx-auto pb-10 px-4">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900">Organizations</h1>
            <p className="text-gray-600">Explore and join student organizations</p>
          </div>
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