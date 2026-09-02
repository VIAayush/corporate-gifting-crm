import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function InvoicesPage({ searchParams }: { searchParams: { status?: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let query = supabase.from('invoices').select('*, companies(name), orders(order_number)').order('created_at', { ascending: false })
  
  if (searchParams.status) {
    query = query.eq('status', searchParams.status)
  }

  const { data: invoices } = await query
  
  const totalIssued = invoices?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0
  const totalPaid = invoices?.filter(i => i.status === 'paid').reduce((acc, curr) => acc + Number(curr.amount), 0) || 0
  const outstanding = invoices?.filter(i => i.status !== 'paid').reduce((acc, curr) => acc + Number(curr.amount), 0) || 0
  const overdue = invoices?.filter(i => new Date(i.due_date) < new Date() && i.status !== 'paid').reduce((acc, curr) => acc + Number(curr.amount), 0) || 0

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6">Invoices</h1>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-sm">
          <p className="text-sm text-[var(--color-text-secondary)]">Total Issued</p>
          <p className="text-xl font-semibold">{formatCurrency(totalIssued)}</p>
        </div>
        <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-sm">
          <p className="text-sm text-[var(--color-text-secondary)]">Total Paid</p>
          <p className="text-xl font-semibold text-green-600">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-sm">
          <p className="text-sm text-[var(--color-text-secondary)]">Outstanding</p>
          <p className="text-xl font-semibold text-amber-600">{formatCurrency(outstanding)}</p>
        </div>
        <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-sm">
          <p className="text-sm text-[var(--color-text-secondary)]">Overdue</p>
          <p className="text-xl font-semibold text-red-600">{formatCurrency(overdue)}</p>
        </div>
      </div>
      
      <div className="bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-gray-50">
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Invoice #</th>
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Company</th>
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Order #</th>
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Amount</th>
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Due Date</th>
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices?.map(invoice => (
              <tr key={invoice.id} className="border-b border-[var(--color-border)] hover:bg-gray-50">
                <td className="p-3 text-sm">
                  <Link href={`/crm/invoices/${invoice.id}`} className="text-blue-600 hover:underline">{invoice.invoice_number}</Link>
                </td>
                <td className="p-3 text-sm">{invoice.companies?.name}</td>
                <td className="p-3 text-sm">{invoice.orders?.order_number}</td>
                <td className="p-3 text-sm">{formatCurrency(invoice.amount)}</td>
                <td className={`p-3 text-sm ${new Date(invoice.due_date) < new Date() && invoice.status !== 'paid' ? 'text-red-600 font-medium' : ''}`}>
                  {formatDate(invoice.due_date)}
                </td>
                <td className="p-3 text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                    invoice.status === 'partially_paid' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {invoice.status}
                  </span>
                </td>
              </tr>
            ))}
            {(!invoices || invoices.length === 0) && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-[var(--color-text-secondary)]">No invoices found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}