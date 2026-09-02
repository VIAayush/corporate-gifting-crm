import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-blue-100 text-blue-800',
  closed: 'bg-gray-100 text-gray-800',
  won: 'bg-green-100 text-green-800',
  lost: 'bg-red-100 text-red-800'
}

export default async function RequirementDetailPage(props: { params: { id: string }, searchParams: { tab?: string } }) {
  const params = await props.params
  const searchParams = await props.searchParams
  const tab = searchParams.tab || 'overview'
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: req } = await supabase
    .from('requirements')
    .select(`
      *,
      company:companies(id, name),
      contact:contacts(id, full_name, email, phone),
      owner:profiles(id, full_name)
    `)
    .eq('id', params.id)
    .single()

  if (!req) return <div className="p-6">Requirement not found</div>

  const { data: products } = await supabase
    .from('requirement_products')
    .select('*, product:products(*)')
    .eq('requirement_id', req.id)

  const { data: quotations } = await supabase
    .from('quotations')
    .select('*')
    .eq('requirement_id', req.id)
    .order('created_at', { ascending: false })

  const { data: activities } = await supabase
    .from('activities')
    .select('*, created_by_profile:profiles(id, full_name)')
    .eq('requirement_id', req.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-primary)] mb-1">{req.title}</h1>
          <p className="text-gray-500">Company: {req.company?.name || '-'}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[req.status] || 'bg-gray-100 text-gray-800'}`}>
          {req.status}
        </span>
      </div>

      <div className="mb-6 flex gap-2 border-b">
        {['overview', 'products', 'quotations', 'activities'].map(t => (
          <Link 
            key={t}
            href={`/crm/requirements/${req.id}?tab=${t}`}
            className={`px-4 py-2 font-medium text-sm capitalize ${tab === t ? 'border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t}
          </Link>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="font-medium text-gray-900 mb-4">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{req.description || 'No description provided.'}</p>
            </div>
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="font-medium text-gray-900 mb-4">Details</h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 text-sm">
                <div><dt className="text-gray-500 mb-1">Purpose</dt><dd className="font-medium">{req.purpose || '-'}</dd></div>
                <div><dt className="text-gray-500 mb-1">Target Audience</dt><dd className="font-medium">{req.target_audience || '-'}</dd></div>
                <div><dt className="text-gray-500 mb-1">Delivery City</dt><dd className="font-medium">{req.delivery_city || '-'}</dd></div>
                <div><dt className="text-gray-500 mb-1">Payment Terms</dt><dd className="font-medium">{req.payment_terms || '-'}</dd></div>
                <div><dt className="text-gray-500 mb-1">Packaging Needs</dt><dd className="font-medium">{req.packaging_needs || '-'}</dd></div>
                <div><dt className="text-gray-500 mb-1">Customization</dt><dd className="font-medium">{req.customization_needs || '-'}</dd></div>
              </dl>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="font-medium text-gray-900 mb-4">Key Metrics</h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between"><dt className="text-gray-500">Budget</dt><dd className="font-semibold">{req.budget ? formatCurrency(req.budget) : '-'}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Quantity</dt><dd className="font-semibold">{req.quantity || '-'}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Deadline</dt><dd className="font-semibold text-red-600">{req.deadline ? formatDate(req.deadline) : '-'}</dd></div>
              </dl>
            </div>
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="font-medium text-gray-900 mb-4">People</h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-gray-500 mb-1">Contact</dt>
                  <dd>
                    <div className="font-medium">{req.contact?.full_name || '-'}</div>
                    <div className="text-xs text-gray-500">{req.contact?.email}</div>
                    <div className="text-xs text-gray-500">{req.contact?.phone}</div>
                  </dd>
                </div>
                <div className="pt-3 border-t">
                  <dt className="text-gray-500 mb-1">Owner</dt>
                  <dd className="font-medium">{req.owner?.full_name || '-'}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      )}

      {tab === 'products' && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-medium text-gray-500">Product</th>
                <th className="p-4 font-medium text-gray-500">Category</th>
                <th className="p-4 font-medium text-gray-500">Brand</th>
                <th className="p-4 font-medium text-gray-500 text-right">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products?.map((item: any) => (
                <tr key={item.id}>
                  <td className="p-4">
                    <div className="font-medium">{item.product?.name || '-'}</div>
                    <div className="text-xs text-gray-500">SKU: {item.product?.sku || '-'}</div>
                  </td>
                  <td className="p-4">{item.product?.category_id || '-'}</td>
                  <td className="p-4">{item.product?.brand_id || '-'}</td>
                  <td className="p-4 text-right">{item.product?.price ? formatCurrency(item.product.price) : '-'}</td>
                </tr>
              ))}
              {!products?.length && <tr><td colSpan={4} className="p-8 text-center text-gray-500">No products shortlisted.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'quotations' && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-medium text-gray-500">Quote #</th>
                <th className="p-4 font-medium text-gray-500">Date</th>
                <th className="p-4 font-medium text-gray-500">Total</th>
                <th className="p-4 font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {quotations?.map((q: any) => (
                <tr key={q.id}>
                  <td className="p-4">
                    <Link href={`/crm/quotations/${q.id}`} className="text-blue-600 hover:underline font-medium">
                      {q.quote_number || `QT-${q.id.slice(0,6)}`}
                    </Link>
                  </td>
                  <td className="p-4">{formatDate(q.created_at)}</td>
                  <td className="p-4 font-medium">{formatCurrency(q.total_amount || 0)}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">{q.status}</span>
                  </td>
                </tr>
              ))}
              {!quotations?.length && <tr><td colSpan={4} className="p-8 text-center text-gray-500">No quotations found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'activities' && (
        <div className="bg-white rounded-lg border p-6">
          <div className="space-y-6">
            {activities?.map((act: any) => (
              <div key={act.id} className="border-b pb-4 last:border-0 last:pb-0">
                <div className="flex justify-between mb-2">
                  <div className="font-medium text-[var(--color-primary)]">{act.activity_type.toUpperCase()}</div>
                  <div className="text-sm text-gray-500">{formatDate(act.created_at)}</div>
                </div>
                <div className="text-sm text-gray-800">{act.notes}</div>
                <div className="text-xs text-gray-500 mt-2">By {act.created_by_profile?.full_name || 'Unknown'}</div>
              </div>
            ))}
            {!activities?.length && <div className="text-center text-gray-500 py-4">No activities recorded.</div>}
          </div>
        </div>
      )}
    </div>
  )
}