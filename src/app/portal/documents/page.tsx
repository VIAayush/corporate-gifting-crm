import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'

function fileHref(path: string | null) {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) return path
  return path
}

export default async function PortalDocumentsPage() {
  const supabase = await createClient()
  const { data: companyId } = await supabase.rpc('client_company_id')
  const [{ data: invoices }, { data: mockups }] = await Promise.all([
    supabase
      .from('invoices')
      .select('id, invoice_number, amount, status, due_date, invoice_date')
      .eq('company_id', companyId)
      .order('invoice_date', { ascending: false }),
    supabase
      .from('mockups')
      .select('id, file_name, storage_path, mime_type, created_at, status')
      .eq('status', 'shared')
      .order('created_at', { ascending: false }),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Documents</h1>
        <p className="text-sm text-gray-500">Invoices and shared mockups for your organisation. Internal cost and margin are never shown.</p>
      </div>

      <section className="bg-white rounded-2xl border overflow-hidden">
        <h2 className="px-4 py-3 text-sm font-semibold border-b">Invoices</h2>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {(invoices || []).map((inv) => (
              <tr key={inv.id} className="border-t">
                <td className="px-4 py-3 font-mono">{inv.invoice_number}</td>
                <td className="px-4 py-3">{formatDate(inv.invoice_date)}</td>
                <td className="px-4 py-3">{formatDate(inv.due_date)}</td>
                <td className="px-4 py-3">{formatCurrency(inv.amount)}</td>
                <td className="px-4 py-3 capitalize">{inv.status}</td>
              </tr>
            ))}
            {(!invoices || invoices.length === 0) && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No invoices yet.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="bg-white rounded-2xl border overflow-hidden">
        <h2 className="px-4 py-3 text-sm font-semibold border-b">Shared mockups</h2>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3">File</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {(mockups || []).map((m) => {
              const href = fileHref(m.storage_path)
              return (
                <tr key={m.id} className="border-t">
                  <td className="px-4 py-3">
                    {href ? <a href={href} target="_blank" rel="noreferrer" className="underline">{m.file_name}</a> : m.file_name}
                  </td>
                  <td className="px-4 py-3">{m.mime_type}</td>
                  <td className="px-4 py-3">{formatDate(m.created_at)}</td>
                </tr>
              )
            })}
            {(!mockups || mockups.length === 0) && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">No mockups shared yet.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  )
}
