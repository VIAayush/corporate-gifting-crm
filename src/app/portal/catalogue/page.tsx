import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { AddToShortlistButton } from './AddToShortlistButton'

export default async function PortalCataloguePage() {
  const supabase = await createClient()
  
  // Get company-specific product IDs
  const { data: companyId } = await supabase.rpc('client_company_id')
  
  const { data: accessData } = await supabase
    .from('company_product_access')
    .select('product_id')
    .eq('company_id', companyId)
    
  const specificIds = accessData?.map(a => a.product_id) ?? []

  // Get all-client products + company-specific products
  const { data: products } = await supabase
    .from('products')
    .select('id, name, sku, price, moq, image_url, description, category:categories(name), brand:brands(name)')
    .eq('status', 'active')
    .or(`catalogue_access.eq.all${specificIds.length > 0 ? `,id.in.(${specificIds.join(',')})` : ''}`)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Product Catalogue</h1>
        <p className="mt-2 text-gray-600">Browse and shortlist products for your corporate gifting needs.</p>
      </div>

      {!products?.length ? (
        <div className="bg-white p-8 rounded-lg shadow-sm text-center border border-gray-200">
          <p className="text-gray-500">No products available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
              <Link href={`/portal/catalogue/${product.sku}`} className="block relative h-64 bg-gray-100">
                {product.image_url ? (
                  <Image src={product.image_url} alt={product.name} fill className="object-contain p-4" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">No Image</div>
                )}
              </Link>
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-xs font-semibold text-[#4A235A] uppercase tracking-wider bg-[#4A235A]/10 px-2 py-1 rounded">
                    {/* @ts-ignore */}
                    {product.category?.name || 'Uncategorized'}
                  </div>
                  <span className="text-xs text-gray-500 font-mono">{product.sku}</span>
                </div>
                
                <Link href={`/portal/catalogue/${product.sku}`}>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#4A235A] transition-colors line-clamp-2">
                    {product.name}
                  </h3>
                </Link>
                
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm mb-6 flex-1">
                  <div>
                    <p className="text-gray-500">Price</p>
                    <p className="font-semibold text-gray-900">${Number(product.price).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">MOQ</p>
                    <p className="font-semibold text-gray-900">{product.moq} units</p>
                  </div>
                </div>

                <div className="flex gap-3 mt-auto">
                  <Link href={`/portal/catalogue/${product.sku}`} className="flex-1 text-center bg-gray-50 text-gray-700 py-2 rounded-md hover:bg-gray-100 transition-colors font-medium text-sm border border-gray-200">
                    View Details
                  </Link>
                  <AddToShortlistButton product={product} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
