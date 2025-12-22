// app/admin/import/page.tsx
"use client"

import { useState, useEffect } from "react"
import { Upload, CheckCircle, AlertCircle, XCircle, RefreshCw, ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function ImportProfiles() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdminAccess()
  }, [])

  async function checkAdminAccess() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push("/signin")
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      if (profile?.role !== "admin") {
        router.push("/home")
        return
      }

      setIsAdmin(true)
    } catch (error) {
      console.error("Error checking admin access:", error)
      router.push("/home")
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
      setResult(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile)
        setError(null)
        setResult(null)
      } else {
        setError("Please upload a CSV file")
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!file) {
      setError("Please select a CSV file")
      return
    }
    
    setIsUploading(true)
    setError(null)
    setResult(null)
    
    try {
      const formData = new FormData()
      formData.append("file", file)
      
      const response = await fetch("/api/admin/import-profiles", {
        method: "POST",
        body: formData
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Import failed")
      }
      
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed")
    } finally {
      setIsUploading(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setError(null)
    setResult(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
          <p className="mt-2 text-gray-600">Checking permissions...</p>
        </div>
      </div>
    )
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h1 className="text-xl font-bold text-gray-900 mt-4">Access Denied</h1>
          <p className="text-gray-600 mt-2">You don't have permission to access this page.</p>
          <button
            onClick={() => router.push("/home")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null // Still loading or redirecting
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header with Back Button */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/home")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Import User Data</h1>
        <p className="text-gray-600 mt-2">
          Upload CSV files with user data. Existing users will be updated, new users will be added.
        </p>
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-6">
        {/* File Upload Area */}
        {!result && (
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Select CSV File
              </label>
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                  isDragging 
                    ? "border-blue-500 bg-blue-50" 
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <Upload className={`h-12 w-12 mx-auto mb-3 ${
                    isDragging ? "text-blue-500" : "text-gray-400"
                  }`} />
                  <p className="text-gray-700 font-medium">
                    {file ? file.name : "Drag & drop or click to select CSV file"}
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    Only CSV files accepted. Max 10MB
                  </p>
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={!file || isUploading}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Import CSV
                  </>
                )}
              </button>
              
              {file && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                >
                  Clear
                </button>
              )}
            </div>
          </form>
        )}

        {/* Results Display */}
        {result && (
          <div className="space-y-6">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <p className="text-green-800 font-medium">Import Completed Successfully</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white rounded-lg p-3 border">
                  <p className="text-sm text-gray-600">Total Rows</p>
                  <p className="text-2xl font-bold text-gray-900">{result.summary.totalRows}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border">
                  <p className="text-sm text-gray-600">New Users</p>
                  <p className="text-2xl font-bold text-green-600">{result.summary.newUsers}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border">
                  <p className="text-sm text-gray-600">Updated Users</p>
                  <p className="text-2xl font-bold text-blue-600">{result.summary.updatedUsers}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border">
                  <p className="text-sm text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{result.summary.failed}</p>
                </div>
              </div>

              {/* Errors */}
              {result.errors && result.errors.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <p className="text-red-800 font-medium">Errors ({result.errors.length})</p>
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    <ul className="space-y-1 text-sm text-red-700">
                      {result.errors.map((error: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleReset}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
            >
              Import Another File
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && !result && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-800 font-medium">Error</p>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
            <button
              onClick={handleReset}
              className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-sm"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* CSV Format Guide - Fixed HTML structure */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="font-medium text-gray-900 mb-3">CSV Format Guide</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Required Columns:</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                <code className="bg-gray-200 px-1.5 py-0.5 rounded">email</code>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                <code className="bg-gray-200 px-1.5 py-0.5 rounded">first_name</code>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                <code className="bg-gray-200 px-1.5 py-0.5 rounded">last_name</code>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                <code className="bg-gray-200 px-1.5 py-0.5 rounded">department_code</code>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                <code className="bg-gray-200 px-1.5 py-0.5 rounded">course_code</code>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Optional Column:</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                <code className="bg-gray-200 px-1.5 py-0.5 rounded">middle_name</code>
              </li>
            </ul>
          </div>
        </div>

        <div className="overflow-x-auto mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Example CSV:</h4>
          <table className="min-w-full bg-white border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2 text-left font-medium">email</th>
                <th className="border px-4 py-2 text-left font-medium">first_name</th>
                <th className="border px-4 py-2 text-left font-medium">middle_name</th>
                <th className="border px-4 py-2 text-left font-medium">last_name</th>
                <th className="border px-4 py-2 text-left font-medium">department_code</th>
                <th className="border px-4 py-2 text-left font-medium">course_code</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-4 py-2 font-mono">s2021193856@firstasia.edu.ph</td>
                <td className="border px-4 py-2">Juan</td>
                <td className="border px-4 py-2">Garcia</td>
                <td className="border px-4 py-2">Dela Cruz</td>
                <td className="border px-4 py-2">CCIT</td>
                <td className="border px-4 py-2">BSCS</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border px-4 py-2 font-mono">s2021100057@firstasia.edu.ph</td>
                <td className="border px-4 py-2">Maria</td>
                <td className="border px-4 py-2">Cruz</td>
                <td className="border px-4 py-2">Santos</td>
                <td className="border px-4 py-2">CCIT</td>
                <td className="border px-4 py-2">BSIT</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Fixed HTML structure - removed <ul> inside <p> */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Note:</p>
            <p className="mb-2">The system will automatically:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Add new users from the CSV</li>
              <li>Update existing users' information</li>
              <li>Preserve existing IDs, roles, and custom fields</li>
              <li>Only update CSV-managed fields (name, department, course)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}