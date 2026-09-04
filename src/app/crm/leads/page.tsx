import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatCurrency, formatDate, LEAD_STAGE_LABELS } from '@/lib/utils'
import { TrendingUp, Plus, User } from 'lucide-react'

const STAGE_COLORS: Record<string, string> = {
  cold: 'bg-gray-100 text-gray-700',
  warm: 'bg-blue-100 text-blue-700',
  hot: 'bg-orange-100 text-orange-700',
  client: 'bg-green-100 text-green-700',
  regular_client: 'bg-emerald-100 text-emerald-700',
}

import { requireStaff, applyOwnerScope } from '@/lib/auth'

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ view?: string; stage?: string; owner?: string }> }) {
  const profile = await requireStaff()
  const supabase = await createClient()

  const params = await searchParams
  const view = params.view || 'kanban'

  let query = supabase
    .from('leads')
    .select('*, company:companies(id, name, logo_path), contact:contacts(id, full_name, designation), owner:profiles!leads_owner_id_fkey(id, full_name)')
    .order('created_at', { ascending: false })
  query = applyOwnerScope(query, profile)

  if (params.stage) query = query.eq('stage', params.stage)
  if (params.owner && profile.role !== 'sales') query = query.eq('owner_id', params.owner)

  const { data: leads } = await query
  const { data: owners } = await supabase.from('profiles').select('id, full_name').in('role', ['admin', 'sales']).order('full_name')

  const stages = ['cold', 'warm', 'hot', 'client', 'regular_client']
  const groupedLeads = stages.reduce((acc, stage) => {
    acc[stage] = (leads || []).filter(l => l.stage === stage)
    return acc
  }, {} as Record<string, typeof leads>)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>Leads</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{leads?.length || 0} leads total</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-[var(--color-border)] overflow-hidden">
            <Link href="?view=kanban" className={`px-3 py-1.5 text-sm font-medium transition-colors ${view === 'kanban' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-muted)]'}`}>Kanban</Link>
            <Link href="?view=table" className={`px-3 py-1.5 text-sm font-medium transition-colors ${view === 'table' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-muted)]'}`}>Table</Link>
          </div>
          <Link href="/crm/leads/new" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: 'var(--color-primary)' }}>
            <Plus size={16} /> Add Lead
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <form className="flex gap-3">
          <select name="stage" defaultValue={params.stage || ''} onChange={(e) => {}} className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-white">
            <option value="">All Stages</option>
            {stages.map(s => <option key={s} value={s}>{LEAD_STAGE_LABELS[s]}</option>)}
          </select>
          <select name="owner" defaultValue={params.owner || ''} className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-white">
            <option value="">All Owners</option>
            {owners?.map(o => <option key={o.id} value={o.id}>{o.full_name}</option>)}
          </select>
        </form>
      </div>

      {view === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map(stage => {
            const stageLeads = groupedLeads[stage] || []
            return (
              <div key={stage} className="flex-shrink-0 w-72">
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STAGE_COLORS[stage]}`}>
                    {LEAD_STAGE_LABELS[stage]}
                  </span>
                  <span className="text-xs text-[var(--color-muted-fg)] font-medium">{stageLeads.length}</span>
                </div>
                <div className="space-y-3">
                  {stageLeads.length === 0 ? (
                    <div className="bg-[var(--color-muted)] rounded-lg p-4 text-center text-sm text-[var(--color-muted-fg)]">No leads</div>
                  ) : stageLeads.map(lead => (
                    <Link key={lead.id} href={`/crm/leads/${lead.id}`} className="block bg-white border border-[var(--color-border)] rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-medium text-sm text-[var(--color-text)]">{(lead.company as any)?.name || 'Unknown Company'}</span>
                      </div>
                      {(lead.contact as any)?.full_name && (
                        <p className="text-xs text-[var(--color-muted-fg)] flex items-center gap-1 mb-2">
                          <User size={12} /> {(lead.contact as any).full_name}
                          {(lead.contact as any).designation && ` · ${(lead.contact as any).designation}`}
                        </p>
                      )}
                      {lead.estimated_value && (
                        <p className="text-sm font-semibold text-[var(--color-primary)]">{formatCurrency(lead.estimated_value)}</p>
                      )}
                      <p className="text-xs text-[var(--color-muted-fg)] mt-2">{formatDate(lead.created_at)}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white border border-[var(--color-border)] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-muted)]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-muted-fg)] uppercase tracking-wide">Company</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-muted-fg)] uppercase tracking-wide">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-muted-fg)] uppercase tracking-wide">Stage</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-muted-fg)] uppercase tracking-wide">Owner</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--color-muted-fg)] uppercase tracking-wide">Value</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-muted-fg)] uppercase tracking-wide">Follow-up</th>
              </tr>
            </thead>
            <tbody>
              {!leads?.length ? (
                <tr><td colSpan={6} className="text-center py-12 text-[var(--color-muted-fg)]">No leads found.</td></tr>
              ) : leads.map(lead => (
                <tr key={lead.id} className="border-t border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/crm/leads/${lead.id}`} className="hover:text-[var(--color-primary)]">{(lead.company as any)?.name}</Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)]">{(lead.contact as any)?.full_name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STAGE_COLORS[lead.stage]}`}>{LEAD_STAGE_LABELS[lead.stage]}</span>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)]">{(lead.owner as any)?.full_name || '—'}</td>
                  <td className="px-4 py-3 text-right font-medium">{lead.estimated_value ? formatCurrency(lead.estimated_value) : '—'}</td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)]">{lead.next_follow_up_at ? formatDate(lead.next_follow_up_at) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}