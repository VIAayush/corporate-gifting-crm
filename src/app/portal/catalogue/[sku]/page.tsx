import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { BackButton } from '@/components/ui/back-button'
import { AddToShortlistButton } from '../AddToShortlistButton'
import { formatCurrency } from '@/lib/utils'
import { Package, Lock, Check } from 'lucide-react'

export default async function ProductDetailPage({ params }: { params: Promise<{ sku: string }> }) {
  const { sku } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: companyId } = await supabase.rpc('client_company_id')

  // Find product by SKU
  const { data: product } = await supabase
    .from('products')
    .select('*, category:categories(name), brand:brands(name)')
    .eq('sku', sku)
    .single()

  if (!product || product.status !== 'active') {
    notFound()
  }

  // Security & Isolation Check:
  // If product is selected/personalized, verify this company is granted access
  if (product.catalogue_access === 'selected') {
    const { data: hasAccess } = await supabase
      .from('company_product_access')
      .select('id')
      .eq('product_id', product.id)
      .eq('company_id', companyId)
      .single()

    if (!hasAccess) {
      notFound()
    }
  } else if (product.catalogue_access === 'none') {
    // Internal only product - clients cannot access
    notFound()
  }

  const isPersonalized = product.catalogue_access === 'selected'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <BackButton href="/portal/catalogue" label="Back to Catalogue" />

      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-50 rounded-xl flex items-center justify-center p-6 border border-gray-100 min-h-[300px]">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="max-h-72 object-contain" />
          ) : (
            <Package className="w-16 h-16 text-gray-300" />
          )}
        </div>

        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {isPersonalized && (
                <span className="inline-flex items-center gap-1 bg-[#4A235A] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  <Lock size={10} /> Exclusive for Your Brand
                </span>
              )}
              <span className="text-xs font-mono text-gray-400 font-bold">{product.sku}</span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-xs text-[#4A235A] font-semibold uppercase">
              {(product.category as any)?.name || 'Corporate Gifting'}
            </p>

            <div className="pt-3 border-t border-gray-100">
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(product.price)}</p>
              <p className="text-xs text-gray-500 mt-1">Minimum Order Quantity: <span className="font-bold text-gray-800">{product.moq || 1} units</span></p>
            </div>

            <div className="pt-3 text-xs text-gray-600 space-y-2">
              <p className="font-semibold text-gray-700">Description & Specifications:</p>
              <p className="leading-relaxed">{product.description || 'Custom corporate gifting product with premium materials and customized branding.'}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center gap-4">
            <div className="flex-1">
              <Link
                href="/portal/requirements/new"
                className="w-full inline-flex justify-center items-center py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-[#4A235A] hover:bg-[#3d1c4a] transition-colors shadow-sm"
              >
                Request Quotation for this Item
              </Link>
            </div>
            <AddToShortlistButton product={product} />
          </div>
        </div>
      </div>
    </div>
  )
}
