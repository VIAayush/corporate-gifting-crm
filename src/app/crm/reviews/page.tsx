import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ReviewsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: reviews } = await supabase.from('reviews').select('*, companies(name), orders(order_number)').order('created_at', { ascending: false })

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6">Client Reviews</h1>
      
      <div className="bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] overflow-hidden">
        {reviews && reviews.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-gray-50">
                <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Date</th>
                <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Company</th>
                <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Order #</th>
                <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Rating</th>
                <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)] w-1/2">Comments</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map(review => (
                <tr key={review.id} className="border-b border-[var(--color-border)] hover:bg-gray-50">
                  <td className="p-3 text-sm">{formatDate(review.created_at)}</td>
                  <td className="p-3 text-sm font-medium">
                    <Link href={`/crm/companies/${review.company_id}`} className="text-blue-600 hover:underline">{review.companies?.name}</Link>
                  </td>
                  <td className="p-3 text-sm">
                    {review.order_id ? <Link href={`/crm/orders/${review.order_id}`} className="text-blue-600 hover:underline">{review.orders?.order_number}</Link> : '-'}
                  </td>
                  <td className="p-3 text-sm">
                    <div className="flex text-amber-400">
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </div>
                  </td>
                  <td className="p-3 text-sm text-gray-700">{review.comments || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-gray-500">
            No client reviews found.
          </div>
        )}
      </div>
    </div>
  )
}