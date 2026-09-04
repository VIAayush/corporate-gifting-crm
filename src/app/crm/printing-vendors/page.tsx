import { createClient } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/auth'

export default async function PrintingVendorsPage() {
  await requireStaff(['admin', 'operations', 'management'])
  const supabase = await createClient()

  const { data: vendors } = await supabase.from('printing_vendors').select('*').order('name', { ascending: true })

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6">Printing Vendors</h1>
      
      <div className="bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-gray-50">
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Name</th>
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">City</th>
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Contact</th>
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Phone</th>
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Printing Methods</th>
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Status</th>
            </tr>
          </thead>
          <tbody>
            {vendors?.map(vendor => {
              const methods = Array.isArray(vendor.printing_methods)
                ? vendor.printing_methods.filter((m: unknown): m is string => typeof m === 'string' && m.length > 0)
                : typeof vendor.service_type === 'string' && vendor.service_type.trim()
                  ? [vendor.service_type]
                  : []
              const active = vendor.is_active ?? vendor.active
              return (
              <tr key={vendor.id} className="border-b border-[var(--color-border)] hover:bg-gray-50">
                <td className="p-3 text-sm font-medium">{vendor.name}</td>
                <td className="p-3 text-sm">{vendor.city || '-'}</td>
                <td className="p-3 text-sm">{vendor.contact_person || '-'}</td>
                <td className="p-3 text-sm">{vendor.phone || '-'}</td>
                <td className="p-3 text-sm">
                  <div className="flex gap-1 flex-wrap">
                    {methods.map((m: string) => (
                      <span key={m} className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-xs">{m}</span>
                    ))}
                    {methods.length === 0 ? <span className="text-[var(--color-text-secondary)]">—</span> : null}
                  </div>
                </td>
                <td className="p-3 text-sm">
                  {active ? 
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">Active</span> : 
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">Inactive</span>
                  }
                </td>
              </tr>
              )
            })}
            {(!vendors || vendors.length === 0) && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-[var(--color-text-secondary)]">No printing vendors found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}