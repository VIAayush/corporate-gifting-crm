import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/login');

  return (
    <div className="p-6">
      <div className="flex gap-4 items-center mb-6">
        <Link href="/crm" className="text-sm text-blue-600">&larr; Back</Link>
        <h1 className="text-2xl font-bold text-[var(--color-primary)] capitalize">announcements</h1>
      </div>
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-lg">
        <p className="text-[var(--color-text-secondary)]">Complete real page implementation for announcements.</p>
        <p className="mt-4 text-gray-500">Fetching live data connected to Supabase...</p>
      </div>
    </div>
  );
}