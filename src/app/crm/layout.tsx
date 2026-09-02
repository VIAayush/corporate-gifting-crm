import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, is_active')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  if (profile.role === 'client_admin') {
    redirect('/portal/catalogue');
  }

  const displayName = profile.full_name || (user.email === 'admin@oaklane.demo' ? 'Asha Menon' : user.email?.split('@')[0]) || 'Asha Menon';

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4EFE6]">
      <Sidebar role={profile.role} user={{ name: displayName, email: user.email || '' }} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Topbar user={{ name: displayName, email: user.email || '' }} />
        <main className="flex-1 overflow-y-auto bg-[#F4EFE6]">
          {children}
        </main>
      </div>
    </div>
  );
}
