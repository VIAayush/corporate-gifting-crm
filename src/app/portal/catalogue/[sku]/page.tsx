import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { AddToShortlistButton } from '../AddToShortlistButton'

export default async function ProductDetailPage({ params }: { params: Promise<{ sku: string }> }) {
  const { sku } = await params
  const supabase = await createClient()

  // Verify access exactly like catalogue
  const { data: companyId } = await supabase.rpc('client_company_id')
  
  const { data: accessData } = await supabase
    .from('company_product_access')
    .select('product_id')
    .eq('company_id', companyId)
    
  const specificIds = accessData?.map(a => a.product_id) ?? []

  const { data: product } = await supabase
    .from('products')
    .select('*, category:categories(name), brand:brands(name)')
    .eq('sku', sku)
    .eq('status', 'active')
    .or(`catalogue_access.eq.all${specificIds.length > 0 ? `,id.in.(${specificIds.join(',')})` : ''}`)
    .single()

  if (!product) {
    notFound()
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/portal/catalogue" className="text-[#4A235A] hover:underline text-sm font-medium flex items-center gap-1">
          ← Back to Catalogue
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left: Image */}
          <div className="bg-gray-50 flex items-center justify-center p-12 relative min-h-[400px]">
            {product.image_url ? (
              <Image src={product.image_url} alt={product.name} fill className="object-contain p-8" />
            ) : (
              <div className="text-gray-400">No Image Available</div>
            )}
          </div>
          
          {/* Right: Details */}
          <div className="p-8 lg:p-12">
            <div className="flex items-center gap-3 mb-4">
              {/* @ts-ignore */}
              <span className="text-xs font-semibold text-[#4A235A] uppercase tracking-wider bg-[#4A235A]/10 px-3 py-1 rounded-full">
                {product.category?.name || 'Uncategorized'}
              </span>
              {/* @ts-ignore */}
              {product.brand?.name && (
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-100 px-3 py-1 rounded-full">
                  {product.brand.name}
                </span>
              )}
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
            <p className="text-sm text-gray-500 font-mono mb-8">SKU: {product.sku}</p>
            
            <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b border-gray-100">
              <div>
                <p className="text-sm text-gray-500 mb-1">Unit Price</p>
                <p className="text-2xl font-bold text-gray-900">${Number(product.price).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Minimum Order Quantity (MOQ)</p>
                <p className="text-2xl font-bold text-gray-900">{product.moq} units</p>
              </div>
            </div>
            
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {product.description || 'No description provided.'}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <AddToShortlistButton product={product} />
              </div>
              <Link 
                href="/portal/requirements/new" 
                className="flex-1 bg-white text-[#4A235A] border-2 border-[#4A235A] py-3 px-6 rounded-md hover:bg-gray-50 transition-colors font-medium text-center"
              >
                Add to Requirement
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
