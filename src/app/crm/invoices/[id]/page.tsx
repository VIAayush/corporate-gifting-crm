import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { recordPayment } from '../actions'
import { redirect } from 'next/navigation'

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: invoice } = await supabase.from('invoices').select('*, companies(name), orders(order_number)').eq('id', params.id).single()
  const { data: payments } = await supabase.from('payments').select('*').eq('invoice_id', params.id).order('payment_date', { ascending: false })

  if (!invoice) return <div>Invoice not found</div>

  const totalPaid = payments?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0
  const balanceDue = Number(invoice.amount) - totalPaid

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-primary)]">Invoice {invoice.invoice_number}</h1>
          <p className="text-[var(--color-text-secondary)]">{invoice.companies?.name}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
          invoice.status === 'partially_paid' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {invoice.status}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-[var(--color-surface)] p-4 rounded-lg border border-[var(--color-border)]">
          <p className="text-sm text-[var(--color-text-secondary)] mb-1">Dates</p>
          <p className="font-medium">Issued: {formatDate(invoice.issue_date)}</p>
          <p className="font-medium">Due: {formatDate(invoice.due_date)}</p>
        </div>
        <div className="bg-[var(--color-surface)] p-4 rounded-lg border border-[var(--color-border)]">
          <p className="text-sm text-[var(--color-text-secondary)] mb-1">Order Details</p>
          <p className="font-medium">Order #: {invoice.orders?.order_number || 'N/A'}</p>
        </div>
        <div className="bg-[var(--color-surface)] p-4 rounded-lg border border-[var(--color-border)]">
          <p className="text-sm text-[var(--color-text-secondary)] mb-1">Financials</p>
          <p className="font-medium">Total: {formatCurrency(invoice.amount)}</p>
          <p className="font-medium text-amber-600">Balance: {formatCurrency(balanceDue)}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2">
          <h2 className="text-lg font-semibold mb-4">Payments Received</h2>
          <div className="bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-gray-50">
                  <th className="p-3 text-sm font-medium text-[var(--color-text-secondary)]">Date</th>
                  <th className="p-3 text-sm font-medium text-[var(--color-text-secondary)]">Amount</th>
                  <th className="p-3 text-sm font-medium text-[var(--color-text-secondary)]">Method</th>
                  <th className="p-3 text-sm font-medium text-[var(--color-text-secondary)]">Reference</th>
                </tr>
              </thead>
              <tbody>
                {payments?.map(payment => (
                  <tr key={payment.id} className="border-b border-[var(--color-border)]">
                    <td className="p-3 text-sm">{formatDate(payment.payment_date)}</td>
                    <td className="p-3 text-sm font-medium">{formatCurrency(payment.amount)}</td>
                    <td className="p-3 text-sm">{payment.method}</td>
                    <td className="p-3 text-sm">{payment.reference || '-'}</td>
                  </tr>
                ))}
                {(!payments || payments.length === 0) && (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-[var(--color-text-secondary)]">No payments recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {balanceDue > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Record Payment</h2>
            <form action={async (formData: FormData) => {
              "use server"
              await recordPayment(formData)
            }} className="bg-[var(--color-surface)] p-4 rounded-lg border border-[var(--color-border)] flex flex-col gap-4">
              <input type="hidden" name="invoice_id" value={invoice.id} />
              
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input type="date" name="payment_date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-2 border border-[var(--color-border)] rounded" />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Amount</label>
                <input type="number" name="amount" step="0.01" max={balanceDue} required defaultValue={balanceDue} className="w-full p-2 border border-[var(--color-border)] rounded" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Method</label>
                <select name="method" required className="w-full p-2 border border-[var(--color-border)] rounded">
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="cash">Cash</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="upi">UPI</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Reference (Optional)</label>
                <input type="text" name="reference" placeholder="e.g. UTR Number" className="w-full p-2 border border-[var(--color-border)] rounded" />
              </div>

              <button type="submit" className="w-full py-2 bg-[var(--color-primary)] text-white rounded font-medium hover:opacity-90">
                Save Payment
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}