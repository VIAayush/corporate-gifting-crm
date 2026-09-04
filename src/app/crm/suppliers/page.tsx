import { createClient } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/auth'

export default async function SuppliersPage() {
  await requireStaff(['admin', 'operations', 'management'])
  const supabase = await createClient()

  const { data: suppliers } = await supabase.from('suppliers').select('*').order('name', { ascending: true })

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6">Suppliers</h1>
      
      <div className="bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-gray-50">
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Name</th>
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">City</th>
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Contact</th>
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Phone</th>
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Categories</th>
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Credit Days</th>
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Status</th>
            </tr>
          </thead>
          <tbody>
            {suppliers?.map(supplier => {
              const categories = Array.isArray(supplier.categories)
                ? supplier.categories.filter((cat: unknown): cat is string => typeof cat === 'string' && cat.length > 0)
                : typeof supplier.category === 'string' && supplier.category.trim()
                  ? [supplier.category]
                  : []
              const active = supplier.is_active ?? supplier.active
              const creditDays = supplier.credit_period_days ?? supplier.credit_days ?? 0
              return (
              <tr key={supplier.id} className="border-b border-[var(--color-border)] hover:bg-gray-50">
                <td className="p-3 text-sm font-medium">{supplier.name}</td>
                <td className="p-3 text-sm">{supplier.city || '-'}</td>
                <td className="p-3 text-sm">{supplier.contact_person || '-'}</td>
                <td className="p-3 text-sm">{supplier.phone || '-'}</td>
                <td className="p-3 text-sm">
                  <div className="flex gap-1 flex-wrap">
                    {categories.map((cat: string) => (
                      <span key={cat} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">{cat}</span>
                    ))}
                    {categories.length === 0 ? <span className="text-[var(--color-text-secondary)]">—</span> : null}
                  </div>
                </td>
                <td className="p-3 text-sm">{creditDays} days</td>
                <td className="p-3 text-sm">
                  {active ? 
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">Active</span> : 
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">Inactive</span>
                  }
                </td>
              </tr>
              )
            })}
            {(!suppliers || suppliers.length === 0) && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-[var(--color-text-secondary)]">No suppliers found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}