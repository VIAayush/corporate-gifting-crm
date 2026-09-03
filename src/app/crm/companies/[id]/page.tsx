import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { BackButton } from '@/components/ui/back-button'
import { CompanyAvatar } from '@/components/ui/avatar'
import { ProductImage } from '@/components/ui/product-image'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { uploadCompanyLogo, removeCompanyLogo } from '../actions'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Package, Trash2, Globe, Lock, Users, TrendingUp, ClipboardList, ShoppingBag } from 'lucide-react'
import { grantCompanyProductAccess, revokeCompanyProductAccess } from '@/app/crm/products/actions'

export default async function CompanyDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = await params
  const { tab = 'overview' } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const [
    { data: company },
    { data: contacts },
    { data: leads },
    { data: requirements },
    { data: quotations },
    { data: orders },
    { data: invoices },
    { data: companyProducts },
    { data: allProducts }
  ] = await Promise.all([
    supabase.from('companies').select('*, owner:profiles!companies_owner_id_fkey(id, full_name, email)').eq('id', id).single(),
    supabase.from('contacts').select('*').eq('company_id', id).order('full_name'),
    supabase.from('leads').select('*').eq('company_id', id).order('created_at', { ascending: false }),
    supabase.from('requirements').select('*').eq('company_id', id).order('created_at', { ascending: false }),
    supabase.from('quotations').select('*').eq('company_id', id).order('created_at', { ascending: false }),
    supabase.from('orders').select('*').eq('company_id', id).order('created_at', { ascending: false }),
    supabase.from('invoices').select('id, invoice_number, amount, status, created_at').eq('company_id', id).order('created_at', { ascending: false }),
    supabase.from('company_product_access').select('*, product:products(*)').eq('company_id', id),
    supabase.from('products').select('id, name, sku, price').eq('status', 'active').order('name')
  ])

  if (!company) notFound()

  const assignedProductIds = companyProducts?.map(cp => cp.product_id) || []
  const unassignedProducts = allProducts?.filter(p => !assignedProductIds.includes(p.id)) || []

  const addProductAction = async (formData: FormData) => {
    'use server'
    const productId = formData.get('product_id') as string
    await grantCompanyProductAccess(productId, id)
  }

  const removeProductAction = async (formData: FormData) => {
    'use server'
    const productId = formData.get('product_id') as string
    await revokeCompanyProductAccess(productId, id)
  }

  const uploadLogoAction = async (formData: FormData) => {
    'use server'
    await uploadCompanyLogo(formData)
  }

  const removeLogoAction = async (formData: FormData) => {
    'use server'
    await removeCompanyLogo(formData)
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'catalogue', label: `Personalized Catalogue (${companyProducts?.length || 0})` },
    { id: 'contacts', label: `Contacts (${contacts?.length || 0})` },
    { id: 'leads', label: `Leads (${leads?.length || 0})` },
    { id: 'requirements', label: `Requirements (${requirements?.length || 0})` },
    { id: 'quotations', label: `Quotations (${quotations?.length || 0})` },
    { id: 'orders', label: `Orders (${orders?.length || 0})` },
    { id: 'invoices', label: `Invoices (${invoices?.length || 0})` },
  ]

  return (
    <div className="space-y-6">
      <BackButton href="/crm/companies" label="Back to Companies" />

      <Breadcrumbs
        items={[
          { label: 'Companies', href: '/crm/companies' },
          { label: company.name },
        ]}
      />

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <CompanyAvatar name={company.name} logoPath={company.logo_path} size="lg" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
              <span>{company.industry || 'Corporate Client'}</span>
              <span aria-hidden="true">·</span>
              <span>{company.city || 'India'}</span>
              {company.website && (
                <>
                  <span aria-hidden="true">·</span>
                  <a href={company.website} target="_blank" rel="noreferrer" className="text-[var(--color-primary)] hover:underline font-medium">
                    {company.website}
                  </a>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-3">
              <form action={uploadLogoAction} className="flex items-center gap-2">
                <input type="hidden" name="company_id" value={company.id} />
                <input
                  type="file"
                  name="logo"
                  accept="image/png,image/jpeg,image/webp"
                  required
                  className="text-[11px] file:mr-2 file:px-2 file:py-1 file:rounded-md file:border file:border-gray-200 file:bg-white file:text-[11px] file:font-medium"
                />
                <button className="px-2.5 py-1 text-[11px] font-medium rounded-md border border-gray-200 hover:bg-gray-50">
                  {company.logo_path ? 'Replace logo' : 'Upload logo'}
                </button>
              </form>
              {company.logo_path && (
                <form action={removeLogoAction}>
                  <input type="hidden" name="company_id" value={company.id} />
                  <button className="px-2.5 py-1 text-[11px] font-medium rounded-md border border-gray-200 text-red-600 hover:bg-red-50">
                    Remove
                  </button>
                </form>
              )}
              <span className="text-[10px] text-gray-400">PNG, JPG or WebP · max 2 MB</span>
            </div>
          </div>
        </div>
        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold capitalize">
          {company.status}
        </span>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-6 overflow-x-auto">
          {tabs.map((t) => (
            <Link
              key={t.id}
              href={`?tab=${t.id}`}
              className={`pb-3 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 ${
                tab === t.id ? 'border-[#4A235A] text-[#4A235A]' : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 text-xs space-y-3">
            <h2 className="font-bold text-sm text-gray-900 pb-2 border-b">Company Information</h2>
            <div><span className="font-semibold text-gray-500 w-24 inline-block">Owner:</span> {(company.owner as any)?.full_name || '?'}</div>
            <div><span className="font-semibold text-gray-500 w-24 inline-block">GST:</span> {company.gst_number || '?'}</div>
            <div><span className="font-semibold text-gray-500 w-24 inline-block">Address:</span> {company.address || '?'}</div>
            <div><span className="font-semibold text-gray-500 w-24 inline-block">City/State:</span> {company.city || '?'}, {company.state || 'India'}</div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 text-xs space-y-3">
            <h2 className="font-bold text-sm text-gray-900 pb-2 border-b">Relationship Notes</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{company.notes || 'No notes added for this company yet.'}</p>
          </div>
        </div>
      )}

      {tab === 'catalogue' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="font-bold text-sm text-gray-900">Personalized Products for {company.name}</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                These products appear exclusively in {company.name}&apos;s Client Portal in addition to the standard catalogue.
              </p>
            </div>

            <form action={addProductAction} className="flex items-center gap-2 w-full sm:w-auto">
              <select
                name="product_id"
                required
                className="px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:ring-1 focus:ring-[#4A235A]"
              >
                <option value="">Select product to add...</option>
                {unassignedProducts.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                ))}
              </select>
              <button
                type="submit"
                className="px-3 py-2 text-xs font-semibold text-white bg-[#4A235A] hover:bg-[#3d1c4a] rounded-lg transition-colors whitespace-nowrap"
              >
                <Plus size={14} className="inline mr-1" /> Assign Product
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500">Personalized Product</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500">Price (?)</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500">MOQ</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500">Assigned On</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {companyProducts?.map((cp: any) => (
                  <tr key={cp.product_id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3">
                      <Link href={`/crm/products/${cp.product_id}`} className="flex items-center gap-3 group">
                        <ProductImage src={cp.product?.image_url} alt={cp.product?.name || 'Product'} size="xs" className="w-9 h-9 rounded-lg border border-gray-200" />
                        <div>
                          <p className="font-bold text-gray-900 group-hover:text-[#4A235A]">{cp.product?.name}</p>
                          <p className="font-mono text-[10px] text-gray-400">{cp.product?.sku}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900">
                      {formatCurrency(cp.product?.price)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {cp.product?.moq || 1} units
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(cp.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form action={removeProductAction} className="inline">
                        <input type="hidden" name="product_id" value={cp.product_id} />
                        <button
                          type="submit"
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                          title="Remove from this company's catalogue"
                        >
                          <Trash2 size={15} />
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
                {(!companyProducts || companyProducts.length === 0) && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-400">
                      No personalized products assigned to {company.name} yet. Standard catalogue items will be visible.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'contacts' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Name</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Designation</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Email</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Phone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {contacts?.map(c => (
                <tr key={c.id}>
                  <td className="px-4 py-2.5 font-medium">{c.full_name}</td>
                  <td className="px-4 py-2.5 text-gray-600">{c.designation || '?'}</td>
                  <td className="px-4 py-2.5 text-gray-600">{c.email || '?'}</td>
                  <td className="px-4 py-2.5 text-gray-600">{c.phone || '?'}</td>
                </tr>
              ))}
              {(!contacts || contacts.length === 0) && (
                <tr><td colSpan={4} className="p-6 text-center text-gray-400">No contacts added yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'leads' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Stage</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Est. Value</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Next Follow-up</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leads?.map(l => (
                <tr key={l.id}>
                  <td className="px-4 py-2.5 capitalize font-semibold">{l.stage}</td>
                  <td className="px-4 py-2.5 font-bold">{formatCurrency(l.estimated_value)}</td>
                  <td className="px-4 py-2.5 text-gray-500">{formatDate(l.next_follow_up_at)}</td>
                  <td className="px-4 py-2.5 text-gray-500">{formatDate(l.created_at)}</td>
                </tr>
              ))}
              {(!leads || leads.length === 0) && (
                <tr><td colSpan={4} className="p-6 text-center text-gray-400">No leads recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'requirements' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Requirement Name</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Budget</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Quantity</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Deadline</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requirements?.map(r => (
                <tr key={r.id}>
                  <td className="px-4 py-2.5 font-semibold text-[#4A235A]">
                    <Link href={`/crm/requirements/${r.id}`}>{r.name}</Link>
                  </td>
                  <td className="px-4 py-2.5 font-bold">{formatCurrency(r.budget)}</td>
                  <td className="px-4 py-2.5 text-gray-600">{r.quantity || '?'}</td>
                  <td className="px-4 py-2.5 text-gray-500">{formatDate(r.deadline)}</td>
                  <td className="px-4 py-2.5 capitalize">{r.status}</td>
                </tr>
              ))}
              {(!requirements || requirements.length === 0) && (
                <tr><td colSpan={5} className="p-6 text-center text-gray-400">No requirements recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'quotations' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Quote #</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Total</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Status</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Valid Until</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quotations?.map(q => (
                <tr key={q.id}>
                  <td className="px-4 py-2.5 font-semibold text-[#4A235A]">
                    <Link href={`/crm/quotations/${q.id}`}>{q.quotation_number}</Link>
                  </td>
                  <td className="px-4 py-2.5 font-bold">{formatCurrency(q.total)}</td>
                  <td className="px-4 py-2.5 capitalize">{q.status}</td>
                  <td className="px-4 py-2.5 text-gray-500">{formatDate(q.valid_until)}</td>
                </tr>
              ))}
              {(!quotations || quotations.length === 0) && (
                <tr><td colSpan={4} className="p-6 text-center text-gray-400">No quotations generated yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'orders' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Order #</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Value</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Status</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders?.map(o => (
                <tr key={o.id}>
                  <td className="px-4 py-2.5 font-semibold text-[#4A235A]">
                    <Link href={`/crm/orders/${o.id}`}>{o.order_number}</Link>
                  </td>
                  <td className="px-4 py-2.5 font-bold">{formatCurrency(o.order_value)}</td>
                  <td className="px-4 py-2.5 capitalize">{o.status}</td>
                  <td className="px-4 py-2.5 text-gray-500">{formatDate(o.created_at)}</td>
                </tr>
              ))}
              {(!orders || orders.length === 0) && (
                <tr><td colSpan={4} className="p-6 text-center text-gray-400">No orders placed yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'invoices' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Invoice #</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Amount</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Status</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices?.map((inv) => (
                <tr key={inv.id}>
                  <td className="px-4 py-2.5 font-semibold text-[#4A235A]">
                    <Link href={`/crm/invoices/${inv.id}`}>{inv.invoice_number}</Link>
                  </td>
                  <td className="px-4 py-2.5 font-bold">{formatCurrency(inv.amount)}</td>
                  <td className="px-4 py-2.5 capitalize">{inv.status}</td>
                  <td className="px-4 py-2.5 text-gray-500">{formatDate(inv.created_at)}</td>
                </tr>
              ))}
              {(!invoices || invoices.length === 0) && (
                <tr><td colSpan={4} className="p-6 text-center text-gray-400">No invoices recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
