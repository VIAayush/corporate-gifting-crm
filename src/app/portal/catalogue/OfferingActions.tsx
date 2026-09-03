'use client'

import { useFormStatus } from 'react-dom'
import { toggleOfferingSelection } from './actions'

function ActionButton({ label, className }: { label: string; className: string }) {
  const { pending } = useFormStatus()
  return (
    <button disabled={pending} className={className}>
      {pending ? 'Saving…' : label}
    </button>
  )
}

export function OfferingActions({
  campaignId,
  campaignProductId,
  currentKind,
}: {
  campaignId: string
  campaignProductId: string
  currentKind: string | null
}) {
  const shortlisted = currentKind === 'shortlisted' || currentKind === 'selected'
  const selected = currentKind === 'selected'

  return (
    <div className="flex gap-2">
      <form action={toggleOfferingSelection} className="flex-1">
        <input type="hidden" name="campaign_id" value={campaignId} />
        <input type="hidden" name="campaign_product_id" value={campaignProductId} />
        <input type="hidden" name="kind" value="shortlisted" />
        {shortlisted && !selected ? <input type="hidden" name="remove" value="1" /> : null}
        <ActionButton
          label={shortlisted && !selected ? 'Shortlisted' : 'Shortlist'}
          className={`w-full py-2 rounded-md text-xs font-semibold ${
            shortlisted && !selected
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-white border border-gray-300 text-gray-700'
          }`}
        />
      </form>
      <form action={toggleOfferingSelection} className="flex-1">
        <input type="hidden" name="campaign_id" value={campaignId} />
        <input type="hidden" name="campaign_product_id" value={campaignProductId} />
        <input type="hidden" name="kind" value="selected" />
        {selected ? <input type="hidden" name="remove" value="1" /> : null}
        <ActionButton
          label={selected ? 'Selected' : 'Select'}
          className={`w-full py-2 rounded-md text-xs font-semibold ${
            selected ? 'bg-[#1A3022] text-white' : 'bg-[#4A235A] text-white'
          }`}
        />
      </form>
    </div>
  )
}
