import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { OfferingActions } from '../catalogue/OfferingActions'
import { ProductImage } from '@/components/ui/product-image'

export default async function PortalShortlistPage() {
  const supabase = await createClient()
  const { data: companyId } = await supabase.rpc('client_company_id')
  const { data: rows } = await supabase
    .from('client_product_selections')
    .select('id, kind, quantity, campaign_product_id, campaign_id, offering:campaign_products(id, display_name, client_image_url, selling_price, moq, campaign:campaigns(name))')
    .eq('company_id', companyId)
    .in('kind', ['shortlisted', 'selected'])
    .order('updated_at', { ascending: false })

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Shortlist</h1>
          <p className="mt-2 text-gray-600">Products you have shortlisted or selected for your campaign.</p>
        </div>
        {(rows || []).length > 0 && (
          <Link
            href="/portal/requirements/new"
            className="px-4 py-2 text-sm font-medium text-white bg-[#4A235A] rounded-md"
          >
            Create Requirement
          </Link>
        )}
      </div>

      {(!rows || rows.length === 0) ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Your shortlist is empty</h2>
          <p className="text-gray-500 mb-6">Browse published campaign products and shortlist or select the gifts you want.</p>
          <Link href="/portal/catalogue" className="text-[#4A235A] font-medium hover:underline">
            Browse campaign products →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rows.map((row) => {
            const offering = Array.isArray(row.offering) ? row.offering[0] : row.offering
            const campaign = offering && !Array.isArray(offering.campaign) ? offering.campaign : offering?.campaign?.[0]
            if (!offering) return null
            return (
              <div key={row.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <ProductImage src={offering.client_image_url} alt={offering.display_name || 'Gift'} size="md" />
                <div className="p-4 flex-1 flex flex-col space-y-3">
                  <p className="text-[10px] uppercase tracking-wider text-[#4A235A]">{campaign?.name}</p>
                  <Link href={`/portal/catalogue/${offering.id}`}>
                    <h3 className="text-md font-bold text-gray-900 hover:text-[#4A235A]">{offering.display_name}</h3>
                  </Link>
                  <p className="text-sm text-gray-600">
                    {formatCurrency(offering.selling_price)} · qty {row.quantity || 1} · {row.kind}
                  </p>
                  <OfferingActions
                    campaignId={row.campaign_id}
                    campaignProductId={row.campaign_product_id}
                    currentKind={row.kind}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
