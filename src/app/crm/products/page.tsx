import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

export default async function ProductsPage(props: { searchParams: { search?: string, status?: string } }) {
  const searchParams = await props.searchParams
  const search = searchParams.search || ''
  const statusFilter = searchParams.status || 'all'
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  let query = supabase
    .from('products')
    .select(`
      *,
      category:product_categories(id, name),
      brand:brands(id, name),
      client_catalogues(count)
    `)
    .order('name')

  if (search) {
    query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`)
  }

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data: products, error } = await query

  const statuses = ['all', 'active', 'inactive', 'archived']

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-[var(--color-primary)]">Products</h1>
        <button className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-md hover:opacity-90">
          Add Product
        </button>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <form className="flex-1 max-w-md flex gap-2">
          <input 
            type="text" 
            name="search" 
            defaultValue={search}
            placeholder="Search by name or SKU..." 
            className="flex-1 px-3 py-2 border rounded-md"
          />
          <button type="submit" className="bg-gray-100 px-4 py-2 border rounded-md hover:bg-gray-200">Search</button>
        </form>
        
        <div className="flex gap-2">
          {statuses.map(status => (
            <Link 
              key={status}
              href={`/crm/products?status=${status}${search ? `&search=${search}` : ''}`}
              className={`px-3 py-2 rounded-md font-medium text-sm capitalize ${statusFilter === status ? 'bg-[var(--color-primary)] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {status}
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-medium text-gray-500">SKU</th>
              <th className="p-4 font-medium text-gray-500">Name</th>
              <th className="p-4 font-medium text-gray-500">Category</th>
              <th className="p-4 font-medium text-gray-500">Brand</th>
              <th className="p-4 font-medium text-gray-500">Price</th>
              <th className="p-4 font-medium text-gray-500">MOQ</th>
              <th className="p-4 font-medium text-gray-500">Catalogue Access</th>
              <th className="p-4 font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products?.map((product: any) => {
              const catalogueCount = product.client_catalogues?.[0]?.count || 0
              return (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="p-4 text-gray-500 font-mono text-sm">{product.sku}</td>
                  <td className="p-4">
                    <Link href={`/crm/products/${product.id}`} className="text-blue-600 hover:underline font-medium">
                      {product.name}
                    </Link>
                  </td>
                  <td className="p-4">{product.category?.name || '-'}</td>
                  <td className="p-4">{product.brand?.name || '-'}</td>
                  <td className="p-4 font-medium">{product.price ? formatCurrency(product.price) : '-'}</td>
                  <td className="p-4">{product.min_order_quantity || '-'}</td>
                  <td className="p-4 text-sm">
                    {product.is_public ? 'All Clients' : (catalogueCount > 0 ? `${catalogueCount} Companies` : 'None')}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {product.status || 'unknown'}
                    </span>
                  </td>
                </tr>
              )
            })}
            {!products?.length && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500">No products found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}