import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { Search } from 'lucide-react';

export default async function Companies(props: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/login');

  const q = searchParams?.q || '';
  const status = searchParams?.status || '';

  let query = supabase.from('companies').select('*, profiles(first_name, last_name)').order('created_at', { ascending: false }).limit(25);
  
  if (q) query = query.ilike('name', `%${q}%`);
  if (status) query = query.eq('status', status);

  const { data: companies } = await query;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">Companies {companies?.length ? `(${companies.length})` : ''}</h1>
        <Link href="/crm/companies/new" className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-md font-medium hover:opacity-90">Add Company</Link>
      </div>

      <div className="mb-6 flex gap-4">
        <form className="flex-1 flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input name="q" defaultValue={q} placeholder="Search companies..." className="w-full pl-10 pr-4 py-2 border rounded-md" />
          </div>
          <select name="status" defaultValue={status} className="border rounded-md px-4 py-2 bg-white">
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button type="submit" className="px-4 py-2 bg-gray-100 border rounded-md">Filter</button>
        </form>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        {companies && companies.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-4 font-semibold text-gray-600">Company</th>
                <th className="p-4 font-semibold text-gray-600">Industry</th>
                <th className="p-4 font-semibold text-gray-600">City</th>
                <th className="p-4 font-semibold text-gray-600">Owner</th>
                <th className="p-4 font-semibold text-gray-600">Status</th>
                <th className="p-4 font-semibold text-gray-600">Created</th>
                <th className="p-4 font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {companies.map(c => (
                <tr key={c.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <Link href={`/crm/companies/${c.id}`} className="flex items-center gap-3 hover:text-blue-600">
                      {c.logo_path ? (
                        <img src={`https://ajysowosgjaipczrwpfv.supabase.co/storage/v1/object/public/logos/${c.logo_path}`} className="w-10 h-10 rounded-full object-cover border" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">{c.name.substring(0,2).toUpperCase()}</div>
                      )}
                      <span className="font-medium">{c.name}</span>
                    </Link>
                  </td>
                  <td className="p-4 text-gray-600">{c.industry || '-'}</td>
                  <td className="p-4 text-gray-600">{c.city || '-'}</td>
                  <td className="p-4 text-gray-600">{c.profiles?.first_name} {c.profiles?.last_name}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${c.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500">{formatDate(c.created_at)}</td>
                  <td className="p-4"><Link href={`/crm/companies/${c.id}`} className="text-blue-600 hover:underline">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center text-gray-500">
            No companies yet. Add your first company to get started.
          </div>
        )}
      </div>
    </div>
  );
}