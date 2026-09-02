import { createClient } from '@/lib/supabase/server'
import { formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function ActivitiesPage({ searchParams }: { searchParams: { type?: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let query = supabase.from('activities').select('*, creator:created_by(full_name), companies(name)').order('created_at', { ascending: false }).limit(100)
  
  if (searchParams.type) {
    query = query.eq('activity_type', searchParams.type)
  }

  const { data: activities } = await query

  const getIcon = (type: string) => {
    switch(type) {
      case 'call': return '📞'
      case 'email': return '✉️'
      case 'meeting': return '🤝'
      case 'note': return '📝'
      default: return '📌'
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">Activity Feed</h1>
        <select 
          className="p-2 border border-gray-300 rounded text-sm bg-white"
          defaultValue={searchParams.type || ''}
          // Will use JS for redirect in a real app, keeping it simple for static markup
        >
          <option value="">All Types</option>
          <option value="call">Calls</option>
          <option value="email">Emails</option>
          <option value="meeting">Meetings</option>
          <option value="note">Notes</option>
        </select>
      </div>
      
      <div className="bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] p-6">
        <div className="relative border-l border-gray-200 ml-4 space-y-8">
          {activities?.map(activity => (
            <div key={activity.id} className="relative pl-8">
              <div className="absolute -left-4 top-1 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm shadow-sm border border-gray-200">
                {getIcon(activity.activity_type)}
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-semibold capitalize">{activity.activity_type}</span>
                    <span className="text-gray-500 text-sm mx-2">by</span>
                    <span className="font-medium">{activity.creator?.full_name || 'System'}</span>
                  </div>
                  <span className="text-xs text-gray-500">{formatDateTime(activity.created_at)}</span>
                </div>
                
                {activity.companies && (
                  <div className="text-sm mb-2 text-[var(--color-primary)] font-medium">
                    <Link href={`/crm/companies/${activity.company_id}`} className="hover:underline">
                      @{activity.companies.name}
                    </Link>
                  </div>
                )}
                
                {activity.notes && (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{activity.notes}</p>
                )}
              </div>
            </div>
          ))}
          {(!activities || activities.length === 0) && (
            <p className="text-gray-500 italic pl-8">No activities found.</p>
          )}
        </div>
      </div>
    </div>
  )
}