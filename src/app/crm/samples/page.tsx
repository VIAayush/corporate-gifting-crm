import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function SamplesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: samples } = await supabase.from('sample_stock').select('*, products(name, sku, cost_price)')

  const totalInOffice = samples?.reduce((acc, curr) => acc + (curr.in_office_qty || 0), 0) || 0
  const totalWithClient = samples?.reduce((acc, curr) => acc + (curr.with_client_qty || 0), 0) || 0
  const totalPending = samples?.reduce((acc, curr) => acc + (curr.pending_supplier_qty || 0), 0) || 0

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6">Sample Stock</h1>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-sm">
          <p className="text-sm text-[var(--color-text-secondary)]">In Office</p>
          <p className="text-xl font-semibold">{totalInOffice}</p>
        </div>
        <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-sm">
          <p className="text-sm text-[var(--color-text-secondary)]">With Client</p>
          <p className="text-xl font-semibold text-blue-600">{totalWithClient}</p>
        </div>
        <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-sm">
          <p className="text-sm text-[var(--color-text-secondary)]">Pending Supplier</p>
          <p className="text-xl font-semibold text-amber-600">{totalPending}</p>
        </div>
      </div>
      
      <div className="bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-gray-50">
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">SKU</th>
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Product Name</th>
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">In Office</th>
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">With Client</th>
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Pending Supplier</th>
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Unit Cost</th>
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Total Value</th>
            </tr>
          </thead>
          <tbody>
            {samples?.map(sample => {
              const totalQty = (sample.in_office_qty || 0) + (sample.with_client_qty || 0)
              const totalValue = totalQty * Number(sample.products?.cost_price || 0)
              return (
                <tr key={sample.id} className="border-b border-[var(--color-border)] hover:bg-gray-50">
                  <td className="p-3 text-sm text-[var(--color-text-secondary)]">{sample.products?.sku || '-'}</td>
                  <td className="p-3 text-sm font-medium">
                    <Link href={`/crm/products/${sample.product_id}`} className="hover:underline">{sample.products?.name}</Link>
                  </td>
                  <td className="p-3 text-sm">{sample.in_office_qty || 0}</td>
                  <td className="p-3 text-sm">{sample.with_client_qty || 0}</td>
                  <td className="p-3 text-sm">{sample.pending_supplier_qty || 0}</td>
                  <td className="p-3 text-sm">{formatCurrency(sample.products?.cost_price || 0)}</td>
                  <td className="p-3 text-sm font-medium">{formatCurrency(totalValue)}</td>
                </tr>
              )
            })}
            {(!samples || samples.length === 0) && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-[var(--color-text-secondary)]">No samples found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}