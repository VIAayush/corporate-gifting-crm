import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { updateLeadStage } from '../actions'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: lead } = await supabase.from('leads').select('*, companies(*), contacts(*), owner:owner_id(full_name)').eq('id', params.id).single()

  if (!lead) return <div>Lead not found</div>

  const stages = ['cold', 'warm', 'hot', 'client', 'regular_client']
  const currentIndex = stages.indexOf(lead.stage)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-primary)]">Lead: {lead.companies?.name}</h1>
          <p className="text-[var(--color-text-secondary)]">Owner: {lead.owner?.full_name || 'Unassigned'}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-right">
          <p className="text-sm text-gray-500">Est. Value</p>
          <p className="text-xl font-bold text-green-700">{lead.estimated_value ? formatCurrency(lead.estimated_value) : 'N/A'}</p>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wider">Stage Progression</h3>
        <div className="flex items-center">
          {stages.map((stage, idx) => (
            <div key={stage} className="flex-1 flex flex-col items-center relative">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold z-10 ${
                idx <= currentIndex ? 'bg-[var(--color-primary)] text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {idx + 1}
              </div>
              <p className={`mt-2 text-xs font-medium capitalize ${idx <= currentIndex ? 'text-[var(--color-primary)]' : 'text-gray-400'}`}>
                {stage.replace('_', ' ')}
              </p>
              {idx < stages.length - 1 && (
                <div className={`absolute top-4 left-1/2 w-full h-1 -z-0 ${
                  idx < currentIndex ? 'bg-[var(--color-primary)]' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-center">
          <form action={async (formData) => {
            'use server'
            await updateLeadStage(params.id, formData.get('stage') as string)
          }} className="flex gap-2">
            <select name="stage" defaultValue={lead.stage} className="p-2 border border-gray-300 rounded text-sm">
              {stages.map(s => <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>)}
            </select>
            <button type="submit" className="px-4 py-2 bg-[var(--color-primary)] text-white text-sm font-medium rounded hover:opacity-90">Update Stage</button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-lg border border-gray-200">
          <h2 className="font-bold text-lg mb-4">Company Details</h2>
          <p className="text-sm mb-2"><span className="text-gray-500 font-medium w-24 inline-block">Name:</span> <Link href={`/crm/companies/${lead.companies?.id}`} className="text-blue-600 hover:underline">{lead.companies?.name}</Link></p>
          <p className="text-sm mb-2"><span className="text-gray-500 font-medium w-24 inline-block">Industry:</span> {lead.companies?.industry || 'N/A'}</p>
          <p className="text-sm mb-2"><span className="text-gray-500 font-medium w-24 inline-block">Location:</span> {[lead.companies?.city, lead.companies?.state].filter(Boolean).join(', ') || 'N/A'}</p>
          <p className="text-sm mb-2"><span className="text-gray-500 font-medium w-24 inline-block">Source:</span> {lead.source || 'N/A'}</p>
          <p className="text-sm mb-2"><span className="text-gray-500 font-medium w-24 inline-block">Follow-up:</span> {lead.follow_up_date ? formatDate(lead.follow_up_date) : 'Not set'}</p>
        </div>

        <div className="bg-white p-5 rounded-lg border border-gray-200">
          <h2 className="font-bold text-lg mb-4">Primary Contact</h2>
          {lead.contacts ? (
            <>
              <p className="text-sm mb-2"><span className="text-gray-500 font-medium w-24 inline-block">Name:</span> {lead.contacts.first_name} {lead.contacts.last_name}</p>
              <p className="text-sm mb-2"><span className="text-gray-500 font-medium w-24 inline-block">Designation:</span> {lead.contacts.designation || 'N/A'}</p>
              <p className="text-sm mb-2"><span className="text-gray-500 font-medium w-24 inline-block">Email:</span> {lead.contacts.email || 'N/A'}</p>
              <p className="text-sm mb-2"><span className="text-gray-500 font-medium w-24 inline-block">Phone:</span> {lead.contacts.phone || 'N/A'}</p>
            </>
          ) : (
            <p className="text-sm text-gray-500 italic">No contact associated.</p>
          )}
        </div>

        <div className="col-span-2 bg-white p-5 rounded-lg border border-gray-200">
          <h2 className="font-bold text-lg mb-4">Notes</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.notes || 'No notes available.'}</p>
        </div>
      </div>
    </div>
  )
}