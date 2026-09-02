import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { BackButton } from '@/components/ui/back-button'
import { updateProduct, grantCompanyProductAccess, revokeCompanyProductAccess } from '../actions'
import { Package, Globe, Lock, EyeOff, Building2, Plus, Trash2 } from 'lucide-react'

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: product },
    { data: categories },
    { data: brands },
    { data: suppliers },
    { data: allCompanies },
    { data: accessRecords },
    { data: variants }
  ] = await Promise.all([
    supabase.from('products').select('*, category:categories(id, name), brand:brands(id, name), supplier:suppliers(id, name)').eq('id', id).single(),
    supabase.from('categories').select('id, name').order('name'),
    supabase.from('brands').select('id, name').order('name'),
    supabase.from('suppliers').select('id, name').order('name'),
    supabase.from('companies').select('id, name').eq('status', 'active').order('name'),
    supabase.from('company_product_access').select('*, company:companies(id, name, city)').eq('product_id', id),
    supabase.from('product_variants').select('*').eq('product_id', id)
  ])

  if (!product) notFound()

  const grantedCompanyIds = accessRecords?.map(a => a.company_id) || []
  const availableCompanies = allCompanies?.filter(c => !grantedCompanyIds.includes(c.id)) || []

  const handleUpdate = async (formData: FormData) => {
    'use server'
    await updateProduct(product.id, formData)
  }

  const grantAccessAction = async (formData: FormData) => {
    'use server'
    const companyId = formData.get('company_id') as string
    await grantCompanyProductAccess(product.id, companyId)
  }

  const revokeAccessAction = async (formData: FormData) => {
    'use server'
    const companyId = formData.get('company_id') as string
    await revokeCompanyProductAccess(product.id, companyId)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <BackButton href="/crm/products" label="Back to Products" />

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-6 items-start">
        <div className="w-32 h-32 bg-gray-100 rounded-xl overflow-hidden relative border border-gray-200 flex-shrink-0 flex items-center justify-center">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-contain p-2" />
          ) : (
            <Package className="w-10 h-10 text-gray-300" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="font-mono text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              {product.sku}
            </span>
            {product.catalogue_access === 'all' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full">
                <Globe className="w-3 h-3" /> Visible to All Clients
              </span>
            )}
            {product.catalogue_access === 'selected' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-purple-100 text-[#4A235A] px-2.5 py-0.5 rounded-full">
                <Lock className="w-3 h-3" /> Personalized ({accessRecords?.length || 0} Companies)
              </span>
            )}
            {product.catalogue_access === 'none' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full">
                <EyeOff className="w-3 h-3" /> Internal Only
              </span>
            )}
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${
              product.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {product.status}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{product.name}</h1>
          <p className="text-xs text-gray-500 mt-1">
            Category: <span className="font-semibold text-gray-700">{(product.category as any)?.name || 'General'}</span>
            {product.brand && <> ? Brand: <span className="font-semibold text-gray-700">{(product.brand as any)?.name}</span></>}
            {product.supplier && <> ? Supplier: <span className="font-semibold text-gray-700">{(product.supplier as any)?.name}</span></>}
          </p>

          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-semibold">Retail Price</p>
              <p className="text-xl font-bold text-[#4A235A]">{formatCurrency(product.price)}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-semibold">Supplier Cost</p>
              <p className="text-lg font-semibold text-gray-700">{formatCurrency(product.supplier_cost)}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-semibold">Min Order Qty</p>
              <p className="text-lg font-semibold text-gray-900">{product.moq || 1} units</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-900 pb-3 border-b border-gray-100">
            Edit Product Information
          </h2>

          <form action={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Product Name</label>
              <input
                type="text"
                name="name"
                defaultValue={product.name}
                required
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#4A235A]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">SKU</label>
                <input
                  type="text"
                  name="sku"
                  defaultValue={product.sku}
                  required
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg font-mono uppercase focus:ring-1 focus:ring-[#4A235A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  defaultValue={product.status}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="discontinued">Discontinued</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Retail (?)</label>
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  defaultValue={product.price}
                  required
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Cost (?)</label>
                <input
                  type="number"
                  step="0.01"
                  name="supplier_cost"
                  defaultValue={product.supplier_cost || ''}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">MOQ</label>
                <input
                  type="number"
                  name="moq"
                  defaultValue={product.moq || 1}
                  required
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                <select
                  name="category_id"
                  defaultValue={product.category_id || ''}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white"
                >
                  <option value="">Select Category</option>
                  {categories?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Brand</label>
                <select
                  name="brand_id"
                  defaultValue={product.brand_id || ''}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white"
                >
                  <option value="">Select Brand</option>
                  {brands?.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Catalogue Access Mode</label>
              <select
                name="catalogue_access"
                defaultValue={product.catalogue_access || 'all'}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white font-medium"
              >
                <option value="all">Visible to All Clients (Public)</option>
                <option value="selected">Personalized / Restricted to Specific Companies</option>
                <option value="none">Internal Only (Hidden from Portals)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Image URL</label>
              <input
                type="url"
                name="image_url"
                defaultValue={product.image_url || ''}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                rows={3}
                defaultValue={product.description || ''}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 text-xs font-semibold text-white bg-[#4A235A] hover:bg-[#3d1c4a] rounded-lg shadow-sm transition-colors"
            >
              Save Product Details
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
          <div>
            <h2 className="text-base font-bold text-gray-900">Personalized Company Access</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Specify which client companies can view and order this customized product in their client portal.
            </p>
          </div>

          <form action={grantAccessAction} className="p-4 bg-purple-50/50 rounded-xl border border-purple-100 space-y-3">
            <h3 className="text-xs font-bold text-[#4A235A] uppercase tracking-wider">
              Grant Access to a Company
            </h3>
            <div className="flex gap-2">
              <select
                name="company_id"
                required
                className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:ring-1 focus:ring-[#4A235A]"
              >
                <option value="">Choose a company to grant access...</option>
                {availableCompanies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#4A235A] hover:bg-[#3d1c4a] rounded-lg transition-colors"
              >
                <Plus size={14} /> Add Company
              </button>
            </div>
            {availableCompanies.length === 0 && (
              <p className="text-[11px] text-gray-500 italic">All active companies currently have access.</p>
            )}
          </form>

          <div>
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Companies with Exclusive Access ({accessRecords?.length || 0})
            </h3>

            {accessRecords && accessRecords.length > 0 ? (
              <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
                {accessRecords.map((acc) => (
                  <div key={acc.company_id} className="p-3.5 flex items-center justify-between hover:bg-gray-50/80 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 text-[#4A235A] rounded-lg">
                        <Building2 size={16} />
                      </div>
                      <div>
                        <Link
                          href={`/crm/companies/${acc.company_id}`}
                          className="text-xs font-bold text-gray-900 hover:text-[#4A235A] hover:underline"
                        >
                          {(acc.company as any)?.name || 'Company'}
                        </Link>
                        <p className="text-[10px] text-gray-500">
                          {(acc.company as any)?.city || 'Corporate Client'} ? Granted on {formatDate(acc.created_at)}
                        </p>
                      </div>
                    </div>

                    <form action={revokeAccessAction}>
                      <input type="hidden" name="company_id" value={acc.company_id} />
                      <button
                        type="submit"
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove Access for this company"
                      >
                        <Trash2 size={15} />
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-xs text-gray-500">
                  No company-specific restrictions assigned.
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  {product.catalogue_access === 'all'
                    ? 'This product is currently public to all clients.'
                    : 'Select a company above to grant exclusive access.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
