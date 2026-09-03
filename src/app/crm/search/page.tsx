import { createClient } from '@/lib/supabase/server'
import { requireStaff, applyOrderScope } from '@/lib/auth'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const profile = await requireStaff()
  const { q = '' } = await searchParams
  const term = q.trim()
  const supabase = await createClient()

  if (!term) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <h1 className="font-serif text-2xl">Search</h1>
        <p className="text-sm text-[#7A7267] mt-2">Search orders, clients, campaigns, requirements, products, and people.</p>
      </div>
    )
  }

  const like = `%${term}%`
  const [{ data: companies }, { data: campaigns }, { data: requirements }, { data: products }, { data: people }] = await Promise.all([
    supabase.from('companies').select('id, name').ilike('name', like).limit(8),
    supabase.from('campaigns').select('id, name').ilike('name', like).limit(8),
    supabase.from('requirements').select('id, name').ilike('name', like).limit(8),
    supabase.from('products').select('id, name, sku').or(`name.ilike.${like},sku.ilike.${like}`).limit(8),
    supabase.from('profiles').select('id, full_name, email, role').or(`full_name.ilike.${like},email.ilike.${like}`).in('role', ['admin', 'sales', 'operations', 'accounts', 'management']).limit(8),
  ])

  let orderQuery = supabase
    .from('orders')
    .select('id, order_number, order_value, status, company:companies(name)')
    .or(`order_number.ilike.${like}`)
    .limit(8)
  orderQuery = applyOrderScope(orderQuery, profile)
  const { data: orders } = await orderQuery

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="bg-white border rounded-2xl p-4 space-y-2">
      <h2 className="text-xs uppercase tracking-wider text-[#7A7267] font-semibold">{title}</h2>
      {children}
    </section>
  )

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-4">
      <h1 className="font-serif text-2xl">Results for “{term}”</h1>
      <Section title="Orders">
        {(orders || []).map((o) => {
          const company = Array.isArray(o.company) ? o.company[0] : o.company
          return (
            <Link key={o.id} href={`/crm/orders/${o.id}`} className="block text-sm hover:underline">
              {o.order_number} · {company?.name} · {formatCurrency(o.order_value)}
            </Link>
          )
        })}
        {(!orders || orders.length === 0) && <p className="text-sm text-gray-500">No orders.</p>}
      </Section>
      <Section title="Clients">
        {(companies || []).map((c) => (
          <Link key={c.id} href={`/crm/companies/${c.id}`} className="block text-sm hover:underline">{c.name}</Link>
        ))}
        {(!companies || companies.length === 0) && <p className="text-sm text-gray-500">No companies.</p>}
      </Section>
      <Section title="Campaigns">
        {(campaigns || []).map((c) => (
          <Link key={c.id} href={`/crm/campaigns/${c.id}`} className="block text-sm hover:underline">{c.name}</Link>
        ))}
        {(!campaigns || campaigns.length === 0) && <p className="text-sm text-gray-500">No campaigns.</p>}
      </Section>
      <Section title="Requirements">
        {(requirements || []).map((r) => (
          <Link key={r.id} href={`/crm/requirements/${r.id}`} className="block text-sm hover:underline">{r.name}</Link>
        ))}
        {(!requirements || requirements.length === 0) && <p className="text-sm text-gray-500">No requirements.</p>}
      </Section>
      <Section title="Products">
        {(products || []).map((p) => (
          <Link key={p.id} href={`/crm/products/${p.id}`} className="block text-sm hover:underline">{p.name} · {p.sku}</Link>
        ))}
        {(!products || products.length === 0) && <p className="text-sm text-gray-500">No products.</p>}
      </Section>
      {(profile.role === 'admin' || profile.role === 'management') && (
        <Section title="People">
          {(people || []).map((p) => (
            <p key={p.id} className="text-sm">{p.full_name} · {p.role}</p>
          ))}
          {(!people || people.length === 0) && <p className="text-sm text-gray-500">No people.</p>}
        </Section>
      )}
    </div>
  )
}
