import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { AddToShortlistButton } from './AddToShortlistButton'
import { formatCurrency } from '@/lib/utils'
import { Package, Lock } from 'lucide-react'

export default async function PortalCataloguePage() {
  const supabase = await createClient()
  const { data: companyId } = await supabase.rpc('client_company_id')
  
  const { data: accessData } = await supabase
    .from('company_product_access')
    .select('product_id')
    .eq('company_id', companyId)
    
  const specificIds = accessData?.map(a => a.product_id) ?? []

  // Query only active products that are either:
  // 1. catalogue_access = 'all' (public to all corporate portals)
  // 2. product_id IN (company_product_access for this company)
  let query = supabase
    .from('products')
    .select('id, name, sku, price, moq, image_url, description, catalogue_access, category:categories(name), brand:brands(name)')
    .eq('status', 'active')

  if (specificIds.length > 0) {
    query = query.or(`catalogue_access.eq.all,id.in.(${specificIds.join(',')})`)
  } else {
    query = query.eq('catalogue_access', 'all')
  }

  const { data: products } = await query.order('name')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Curated Corporate Catalogue</h1>
        <p className="text-xs text-gray-500 mt-1">
          Exclusive corporate gifting selection curated for your brand.
        </p>
      </div>

      {!products?.length ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm text-center border border-gray-200">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-700">No products available currently.</p>
          <p className="text-xs text-gray-400 mt-1">Your account manager will publish personalized gifting options shortly.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const isPersonalized = product.catalogue_access === 'selected'
            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col group hover:shadow-md transition-shadow"
              >
                <div className="h-48 bg-gray-50 flex items-center justify-center p-4 relative border-b border-gray-100">
                  {isPersonalized && (
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-[#4A235A] text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 shadow-sm">
                      <Lock size={10} /> Exclusive for Your Brand
                    </span>
                  )}
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="h-full w-full object-contain p-2" />
                  ) : (
                    <span className="text-xs text-gray-400 font-mono">{product.sku}</span>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-[#4A235A] uppercase tracking-wider">
                        {(product.category as any)?.name || 'Corporate Gift'}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">{product.sku}</span>
                    </div>

                    <Link href={`/portal/catalogue/${product.sku}`}>
                      <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#4A235A] transition-colors line-clamp-1">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {product.description || 'Premium corporate gifting selection with custom branding options.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-base font-bold text-gray-900">{formatCurrency(product.price)}</p>
                      <p className="text-[10px] text-gray-400">MOQ: {product.moq || 1} units</p>
                    </div>
                    <AddToShortlistButton product={product} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
