import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import type { Role } from '@/lib/types';

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, is_active, department_id')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  if (profile.role === 'client_admin' || profile.role === 'client_user') {
    redirect('/portal/catalogue');
  }

  const displayName = profile.full_name || user.email?.split('@')[0] || 'Team';

  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, title, body, link, read_at, created_at')
    .eq('audience', 'internal')
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4EFE6]">
      <Sidebar role={profile.role as Role} user={{ name: displayName, email: user.email || '' }} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Topbar user={{ name: displayName, email: user.email || '' }} notifications={notifications || []} />
        <main className="flex-1 overflow-y-auto bg-[#F4EFE6]">
          {children}
        </main>
      </div>
    </div>
  );
}
