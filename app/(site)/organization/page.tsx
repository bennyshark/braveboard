// app/(site)/organizations/page.tsx
"use client"

import { Suspense } from "react"
import { Loader2, Users } from "lucide-react"
import { OrganizationsList } from "@/components/organizations/OrganizationsList"

function OrganizationsContent() {
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

      <OrganizationsList />
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