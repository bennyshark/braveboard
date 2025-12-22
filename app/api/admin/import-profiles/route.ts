// app/api/admin/import-csv/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { parse } from "csv-parse/sync"

interface CSVRow {
  email: string
  first_name: string
  middle_name: string
  last_name: string
  department_code: string
  course_code: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    // Check if user has admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
    
    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      )
    }
    
    // Get CSV file
    const formData = await request.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }
    
    if (!file.name.endsWith(".csv")) {
      return NextResponse.json(
        { error: "File must be a CSV" },
        { status: 400 }
      )
    }
    
    // Parse CSV
    const text = await file.text()
    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    }) as CSVRow[]
    
    // Validate CSV
    const requiredColumns = ["email", "first_name", "last_name", "department_code", "course_code"]
    const firstRow = records[0]
    
    if (!firstRow) {
      return NextResponse.json(
        { error: "CSV file is empty" },
        { status: 400 }
      )
    }
    
    const csvColumns = Object.keys(firstRow)
    const missingColumns = requiredColumns.filter(col => !csvColumns.includes(col))
    
    if (missingColumns.length > 0) {
      return NextResponse.json(
        { error: `Missing required columns: ${missingColumns.join(", ")}` },
        { status: 400 }
      )
    }
    
    // Validate emails
    const invalidEmails = records.filter(row => !row.email.endsWith("@firstasia.edu.ph"))
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { 
          error: `Some emails are not from @firstasia.edu.ph domain: ${invalidEmails.slice(0, 3).map(r => r.email).join(", ")}${invalidEmails.length > 3 ? "..." : ""}` 
        },
        { status: 400 }
      )
    }
    
    // Create service role client (bypasses RLS)
    const supabaseService = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    // Get existing profiles
    const { data: existingProfiles } = await supabaseService
      .from("profiles")
      .select("email")
      .in("email", records.map(r => r.email))
    
    const existingEmails = new Set(existingProfiles?.map(p => p.email) || [])
    
    // Process records
    const results = {
      newUsers: 0,
      updatedUsers: 0,
      errors: [] as string[],
      processed: 0
    }
    
    // Process in batches
    const batchSize = 50
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize)
      
      for (const row of batch) {
        try {
          if (existingEmails.has(row.email)) {
            // Update existing user
            const { error: updateError } = await supabaseService
              .from("profiles")
              .update({
                first_name: row.first_name,
                middle_name: row.middle_name,
                last_name: row.last_name,
                department_code: row.department_code,
                course_code: row.course_code,
                updated_at: new Date().toISOString()
              })
              .eq("email", row.email)
            
            if (updateError) {
              results.errors.push(`Failed to update ${row.email}: ${updateError.message}`)
            } else {
              results.updatedUsers++
            }
          } else {
            // Insert new user (no id, will be set when they sign in)
            const { error: insertError } = await supabaseService
              .from("profiles")
              .insert({
                email: row.email,
                first_name: row.first_name,
                middle_name: row.middle_name,
                last_name: row.last_name,
                department_code: row.department_code,
                course_code: row.course_code,
                role: "user"
              })
            
            if (insertError) {
              results.errors.push(`Failed to create ${row.email}: ${insertError.message}`)
            } else {
              results.newUsers++
            }
          }
          
          results.processed++
        } catch (error) {
          results.errors.push(`Error processing ${row.email}: ${error instanceof Error ? error.message : "Unknown error"}`)
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: "CSV import completed successfully",
      summary: {
        totalRows: records.length,
        processed: results.processed,
        newUsers: results.newUsers,
        updatedUsers: results.updatedUsers,
        failed: results.errors.length
      },
      errors: results.errors.slice(0, 10)
    })
    
  } catch (error) {
    console.error("CSV import error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}