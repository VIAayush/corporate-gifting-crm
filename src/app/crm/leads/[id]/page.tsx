import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { updateLeadStage } from '../actions'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { BackButton } from '@/components/ui/back-button'
import { TrendingUp, Building2, User, Calendar, DollarSign } from 'lucide-react'

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: lead } = await supabase
    .from('leads')
    .select('*, company:companies(*), contact:contacts(*), owner:profiles!leads_owner_id_fkey(full_name)')
    .eq('id', id)
    .single()

  if (!lead) notFound()

  const stages = ['cold', 'warm', 'hot', 'client', 'regular_client']
  const currentIndex = stages.indexOf(lead.stage)

  const handleUpdateStage = async (formData: FormData) => {
    'use server'
    const newStage = formData.get('stage') as string
    await updateLeadStage(id, newStage)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <BackButton href="/crm/leads" label="Back to Leads" />

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-[#4A235A]/10 text-[#4A235A] rounded-lg">
              <TrendingUp size={16} />
            </span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Corporate Lead</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {(lead.company as any)?.name || 'Lead Details'}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Account Executive: <span className="font-semibold text-gray-800">{(lead.owner as any)?.full_name || 'Unassigned'}</span>
          </p>
        </div>

        <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 text-right">
          <p className="text-[10px] uppercase font-bold text-gray-400">Estimated Pipeline Value</p>
          <p className="text-2xl font-bold text-[#4A235A]">
            {lead.estimated_value ? formatCurrency(lead.estimated_value) : '?'}
          </p>
        </div>
      </div>

      {/* Stage Progression Bar */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Lead Progression</h3>
        
        <div className="flex items-center justify-between relative">
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 -z-0" />
          {stages.map((stage, idx) => {
            const isCompleted = idx <= currentIndex
            return (
              <div key={stage} className="flex flex-col items-center relative z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  isCompleted ? 'bg-[#4A235A] text-white ring-4 ring-purple-50' : 'bg-gray-100 text-gray-400'
                }`}>
                  {idx + 1}
                </div>
                <p className={`mt-2 text-[11px] font-semibold capitalize ${
                  isCompleted ? 'text-[#4A235A]' : 'text-gray-400'
                }`}>
                  {stage.replace('_', ' ')}
                </p>
              </div>
            )
          })}
        </div>

        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-500 font-medium">Update Current Pipeline Stage:</span>
          <form action={handleUpdateStage} className="flex gap-2">
            <select
              name="stage"
              defaultValue={lead.stage}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:ring-1 focus:ring-[#4A235A]"
            >
              {stages.map(s => (
                <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>
              ))}
            </select>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#4A235A] hover:bg-[#3d1c4a] text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
            >
              Save Stage
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3 text-xs">
          <h2 className="font-bold text-sm text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2">
            <Building2 size={16} className="text-[#4A235A]" /> Company Details
          </h2>
          <div><span className="font-semibold text-gray-500 w-24 inline-block">Company:</span> <Link href={`/crm/companies/${(lead.company as any)?.id}`} className="text-[#4A235A] hover:underline font-bold">{(lead.company as any)?.name}</Link></div>
          <div><span className="font-semibold text-gray-500 w-24 inline-block">Industry:</span> {(lead.company as any)?.industry || '?'}</div>
          <div><span className="font-semibold text-gray-500 w-24 inline-block">Location:</span> {[(lead.company as any)?.city, (lead.company as any)?.state].filter(Boolean).join(', ') || '?'}</div>
          <div><span className="font-semibold text-gray-500 w-24 inline-block">Source:</span> {lead.source || 'Direct Outreach'}</div>
          <div><span className="font-semibold text-gray-500 w-24 inline-block">Next Follow-up:</span> {formatDate(lead.next_follow_up_at)}</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3 text-xs">
          <h2 className="font-bold text-sm text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2">
            <User size={16} className="text-[#4A235A]" /> Primary Contact
          </h2>
          {lead.contact ? (
            <>
              <div><span className="font-semibold text-gray-500 w-24 inline-block">Name:</span> <span className="font-bold text-gray-900">{(lead.contact as any).full_name}</span></div>
              <div><span className="font-semibold text-gray-500 w-24 inline-block">Designation:</span> {(lead.contact as any).designation || '?'}</div>
              <div><span className="font-semibold text-gray-500 w-24 inline-block">Email:</span> {(lead.contact as any).email || '?'}</div>
              <div><span className="font-semibold text-gray-500 w-24 inline-block">Phone:</span> {(lead.contact as any).phone || '?'}</div>
            </>
          ) : (
            <p className="text-gray-400 italic">No specific contact assigned.</p>
          )}
        </div>

        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-2">
          <h2 className="font-bold text-sm text-gray-900">Engagement & Opportunity Notes</h2>
          <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
            {lead.notes || 'No notes added for this lead yet.'}
          </p>
        </div>
      </div>
    </div>
  )
}
