import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { redirect } from 'next/navigation'
import Image from 'next/image'

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: product } = await supabase.from('products').select('*, categories(name), brands(name), suppliers(name)').eq('id', params.id).single()
  const { data: variants } = await supabase.from('product_variants').select('*').eq('product_id', params.id)
  const { data: access } = await supabase.from('product_access').select('*, companies(name)').eq('product_id', params.id)

  if (!product) return <div>Product not found</div>

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex gap-8 mb-8">
        <div className="w-1/3">
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative border border-gray-200">
            {product.image_url ? (
              <Image src={product.image_url} alt={product.name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
            )}
          </div>
        </div>
        
        <div className="w-2/3">
          <h1 className="text-3xl font-bold text-[var(--color-primary)] mb-2">{product.name}</h1>
          <p className="text-xl text-[var(--color-text-secondary)] mb-4">{product.sku}</p>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-500 mb-1">Pricing</p>
              <p className="text-lg font-semibold">{formatCurrency(product.cost_price || 0)} <span className="text-sm font-normal text-gray-500">Cost</span></p>
              <p className="text-lg font-semibold text-green-700">{formatCurrency(product.selling_price || 0)} <span className="text-sm font-normal text-gray-500">Retail</span></p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-500 mb-1">Inventory</p>
              <p className="font-medium">MOQ: {product.moq || 1}</p>
              <p className="font-medium">Supplier: {product.suppliers?.name || 'N/A'}</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold mb-2">Details</h3>
            <p className="text-sm text-gray-700 mb-1"><span className="font-medium">Category:</span> {product.categories?.name || 'N/A'}</p>
            <p className="text-sm text-gray-700"><span className="font-medium">Brand:</span> {product.brands?.name || 'N/A'}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{product.description || 'No description provided.'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-bold mb-4">Variants</h2>
          {variants && variants.length > 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="p-3 text-sm font-medium text-gray-600">SKU</th>
                    <th className="p-3 text-sm font-medium text-gray-600">Color</th>
                    <th className="p-3 text-sm font-medium text-gray-600">Size</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map(v => (
                    <tr key={v.id} className="border-b border-gray-100 last:border-0">
                      <td className="p-3 text-sm">{v.sku}</td>
                      <td className="p-3 text-sm">{v.color || '-'}</td>
                      <td className="p-3 text-sm">{v.size || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No variants for this product.</p>
          )}
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Catalogue Access</h2>
          {access && access.length > 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="p-3 text-sm font-medium text-gray-600">Company</th>
                  </tr>
                </thead>
                <tbody>
                  {access.map(a => (
                    <tr key={a.id} className="border-b border-gray-100 last:border-0">
                      <td className="p-3 text-sm">{a.companies?.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Product is visible to all companies or no specific access granted.</p>
          )}
        </div>
      </div>
    </div>
  )
}