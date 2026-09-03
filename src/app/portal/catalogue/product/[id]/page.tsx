import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { BackButton } from '@/components/ui/back-button'
import { formatCurrency } from '@/lib/utils'
import { ProductImage } from '@/components/ui/product-image'

export default async function PortalProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Basic shape check first: an invalid uuid would otherwise surface a database
  // error instead of a clean "not available" page.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    notFound()
  }

  const supabase = await createClient()

  // Reading through client_products means an id belonging to another company's
  // catalogue simply returns no row. The response is an ordinary "not available"
  // page that reveals nothing about whether the product exists.
  const { data: product } = await supabase
    .from('client_products')
    .select('id, name, description, image_url, price, moq, category_name, brand_name')
    .eq('id', id)
    .maybeSingle()

  if (!product) notFound()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <BackButton href="/portal/catalogue" label="Back to gifts" />

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <ProductImage src={product.image_url} alt={product.name} size="hero" className="h-72 md:h-full border-b md:border-b-0 md:border-r border-gray-100" />

          <div className="p-6 space-y-4">
            {product.category_name && (
              <p className="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-wider">
                {product.category_name}
              </p>
            )}
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>

            {product.brand_name && <p className="text-xs text-gray-500">by {product.brand_name}</p>}

            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
              {product.description || 'Get in touch and we will share full details, samples and branding options.'}
            </p>

            <div className="pt-4 border-t border-gray-100">
              <p className="text-xl font-semibold text-gray-900">{formatCurrency(product.price)}</p>
              <p className="text-xs text-gray-400 mt-0.5">Minimum order {product.moq || 1} units</p>
            </div>

            <div className="pt-2">
              <p className="text-xs text-gray-500">
                Interested in this gift? Share a requirement and your account manager will prepare a quotation with
                branding and packaging options.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
