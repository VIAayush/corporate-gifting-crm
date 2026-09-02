import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { Plus, Search, Package, Globe, Lock, EyeOff } from 'lucide-react'

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; access?: string }> }) {
  const params = await searchParams
  const search = params.q || ''
  const statusFilter = params.status || 'all'
  const accessFilter = params.access || 'all'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  let query = supabase
    .from('products')
    .select('*, category:categories(id, name), brand:brands(id, name), company_product_access(count)')
    .order('name')

  if (search) {
    query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`)
  }

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  if (accessFilter !== 'all') {
    query = query.eq('catalogue_access', accessFilter)
  }

  const { data: products } = await query

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Catalogue</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {products?.length || 0} products available for corporate gifting campaigns
          </p>
        </div>
        <Link
          href="/crm/products/new"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-[#4A235A] hover:bg-[#3d1c4a] shadow-sm transition-colors"
        >
          <Plus size={14} /> Add Product
        </Link>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-wrap items-center justify-between gap-3">
        <form className="flex-1 max-w-sm flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              name="q"
              defaultValue={search}
              placeholder="Search by name or SKU..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#4A235A]"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Filter
          </button>
        </form>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-medium">Visibility:</span>
          {['all', 'selected', 'none'].map((acc) => (
            <Link
              key={acc}
              href={`/crm/products?access=${acc}${search ? `&q=${search}` : ''}`}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                accessFilter === acc
                  ? 'bg-[#4A235A] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {acc === 'all' ? 'All Clients' : (acc === 'selected' ? 'Personalized' : 'Internal Only')}
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase">Product</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase">Category</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase">Price</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase">MOQ</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase">Catalogue Visibility</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products?.map((p: any) => {
              const companyCount = p.company_product_access?.[0]?.count || 0
              return (
                <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/crm/products/${p.id}`} className="flex items-center gap-3 group">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-full h-full object-contain p-1" />
                        ) : (
                          <Package size={16} className="text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 group-hover:text-[#4A235A] transition-colors">
                          {p.name}
                        </p>
                        <p className="font-mono text-[10px] text-gray-400">{p.sku}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600 font-medium">
                    {p.category?.name || '?'}
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-900">
                    {formatCurrency(p.price)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {p.moq || 1} units
                  </td>
                  <td className="px-4 py-3">
                    {p.catalogue_access === 'all' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-800">
                        <Globe size={11} /> All Clients
                      </span>
                    )}
                    {p.catalogue_access === 'selected' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-[#4A235A]">
                        <Lock size={11} /> Personalized ({companyCount} {companyCount === 1 ? 'co' : 'cos'})
                      </span>
                    )}
                    {p.catalogue_access === 'none' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700">
                        <EyeOff size={11} /> Internal Only
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                      p.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              )
            })}
            {(!products || products.length === 0) && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400">
                  No products found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
