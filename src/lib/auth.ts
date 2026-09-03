import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Role } from "@/lib/types"

export type ProfileSession = {
  id: string
  full_name: string | null
  email: string
  role: Role
  department_id: string | null
  company_id: string | null
  is_active: boolean
}

export async function getProfile(): Promise<ProfileSession | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, department_id, company_id, is_active")
    .eq("id", user.id)
    .single()
  return data as ProfileSession | null
}

export async function requireStaff(roles?: Role[]): Promise<ProfileSession> {
  const profile = await getProfile()
  if (!profile) redirect("/login")
  if (profile.role === "client_admin" || (profile.role as string) === "client_user") {
    redirect("/portal/catalogue")
  }
  if (roles && !roles.includes(profile.role)) {
    redirect("/crm/access-denied")
  }
  return profile
}

export function canSeeFinance(role: Role) {
  return role === "admin" || role === "accounts" || role === "management"
}

export function canSeeCosts(role: Role) {
  return role === "admin" || role === "accounts" || role === "management"
}

export function canChangeOrderStage(role: Role) {
  return role === "admin" || role === "operations"
}

export function isOpsStaff(role: Role) {
  return role === "admin" || role === "operations"
}

export function applyOrderScope(query: any, profile: ProfileSession) {
  if (profile.role === "admin" || profile.role === "management" || profile.role === "sales" || profile.role === "accounts") {
    return query
  }
  if (profile.role === "operations") {
    const parts = [`assigned_to.eq.${profile.id}`]
    if (profile.department_id) parts.push(`current_department_id.eq.${profile.department_id}`)
    return query.or(parts.join(","))
  }
  return query.eq("assigned_to", profile.id)
}
