import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getRequestTabId } from "@/lib/auth/tab-server"
import { TabSessionRevive } from "@/components/auth/tab-session-revive"

export default async function RootPage() {
  if (!(await getRequestTabId())) return <TabSessionRevive />

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (profile?.role === "client_admin" || profile?.role === "client_user") {
    redirect("/portal")
  }

  redirect("/crm/dashboard")
}
