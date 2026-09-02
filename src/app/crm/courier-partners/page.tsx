import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function CourierPartnersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: couriers } = await supabase.from('courier_partners').select('*').order('name', { ascending: true })

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6">Courier Partners</h1>
      
      <div className="bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-gray-50">
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Name</th>
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">City</th>
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Contact</th>
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Phone</th>
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Tracking URL</th>
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Status</th>
            </tr>
          </thead>
          <tbody>
            {couriers?.map(courier => (
              <tr key={courier.id} className="border-b border-[var(--color-border)] hover:bg-gray-50">
                <td className="p-3 text-sm font-medium">{courier.name}</td>
                <td className="p-3 text-sm">{courier.city || '-'}</td>
                <td className="p-3 text-sm">{courier.contact_person || '-'}</td>
                <td className="p-3 text-sm">{courier.phone || '-'}</td>
                <td className="p-3 text-sm">
                  {courier.tracking_url ? (
                    <a href={courier.tracking_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Track</a>
                  ) : '-'}
                </td>
                <td className="p-3 text-sm">
                  {courier.active ? 
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">Active</span> : 
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">Inactive</span>
                  }
                </td>
              </tr>
            ))}
            {(!couriers || couriers.length === 0) && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-[var(--color-text-secondary)]">No courier partners found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}