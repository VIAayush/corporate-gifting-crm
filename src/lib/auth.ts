import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canAccess, type AppRole, type Profile } from "@/lib/rbac";

export async function getSessionProfile(): Promise<{ userId: string; profile: Profile } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, is_active")
    .eq("id", user.id)
    .single();
  if (!profile || !profile.is_active) return null;
  return { userId: user.id, profile: profile as Profile };
}

export async function requireUser() {
  const session = await getSessionProfile();
  if (!session) redirect("/login");
  return session;
}

export async function requirePath(pathname: string) {
  const session = await requireUser();
  if (!canAccess(session.profile.role as AppRole, pathname)) {
    redirect("/dashboard");
  }
  return session;
}
