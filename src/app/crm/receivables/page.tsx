import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate, oneRelation } from '@/lib/utils'
import Link from 'next/link'
import { requireStaff } from '@/lib/auth'

export default async function ReceivablesPage() {
  await requireStaff(['admin', 'accounts', 'management'])
  const supabase = await createClient()

  const { data: invoices } = await supabase.from('invoices').select('*, companies(name)').in('status', ['unpaid', 'issued', 'partially_paid', 'overdue']).order('due_date', { ascending: true })
  const { data: paidThisMonthInvoices } = await supabase.from('invoices').select('amount').eq('status', 'paid').gte('updated_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
  
  const outstanding = invoices?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0
  const overdue = invoices?.filter(i => new Date(i.due_date) < new Date()).reduce((acc, curr) => acc + Number(curr.amount), 0) || 0
  
  const currentMonthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
  const dueThisMonth = invoices?.filter(i => new Date(i.due_date) <= currentMonthEnd && new Date(i.due_date) >= new Date()).reduce((acc, curr) => acc + Number(curr.amount), 0) || 0
  
  const paidThisMonth = paidThisMonthInvoices?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6">Accounts Receivable</h1>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-sm">
          <p className="text-sm text-[var(--color-text-secondary)]">Total Outstanding</p>
          <p className="text-xl font-semibold">{formatCurrency(outstanding)}</p>
        </div>
        <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-sm">
          <p className="text-sm text-[var(--color-text-secondary)]">Due This Month</p>
          <p className="text-xl font-semibold text-blue-600">{formatCurrency(dueThisMonth)}</p>
        </div>
        <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-sm">
          <p className="text-sm text-[var(--color-text-secondary)]">Overdue</p>
          <p className="text-xl font-semibold text-red-600">{formatCurrency(overdue)}</p>
        </div>
        <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-sm">
          <p className="text-sm text-[var(--color-text-secondary)]">Paid This Month</p>
          <p className="text-xl font-semibold text-green-600">{formatCurrency(paidThisMonth)}</p>
        </div>
      </div>
      
      <div className="bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-gray-50">
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Company</th>
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Invoice #</th>
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Amount</th>
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Due Date</th>
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices?.map(invoice => {
              const company = oneRelation(invoice.companies)
              return (
              <tr key={invoice.id} className="border-b border-[var(--color-border)] hover:bg-gray-50">
                <td className="p-3 text-sm font-medium">{company?.name}</td>
                <td className="p-3 text-sm">
                  <Link href={`/crm/invoices/${invoice.id}`} className="text-blue-600 hover:underline">{invoice.invoice_number}</Link>
                </td>
                <td className="p-3 text-sm">{formatCurrency(invoice.amount)}</td>
                <td className={`p-3 text-sm ${invoice.due_date && new Date(invoice.due_date) < new Date() ? 'text-red-600 font-semibold' : ''}`}>
                  {formatDate(invoice.due_date)}
                </td>
                <td className="p-3 text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    invoice.status === 'partially_paid' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {String(invoice.status || '').replace('_', ' ')}
                  </span>
                </td>
              </tr>
              )
            })}
            {(!invoices || invoices.length === 0) && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-[var(--color-text-secondary)]">No open receivables.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}