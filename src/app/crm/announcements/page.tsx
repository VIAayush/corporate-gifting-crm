import { createClient } from '@/lib/supabase/server'
import { formatDateTime } from '@/lib/utils'
import { requireStaff } from '@/lib/auth'
import { createAnnouncement } from './actions'

export default async function AnnouncementsPage() {
  const profile = await requireStaff()
  const supabase = await createClient()
  const canPost = profile.role === 'admin' || profile.role === 'management'

  const { data: announcements } = await supabase
    .from('announcements')
    .select('*, author:created_by(full_name)')
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">Announcements</h1>
      </div>

      {canPost && (
        <form action={createAnnouncement} className="bg-white rounded-lg border border-[var(--color-border)] p-4 mb-6 space-y-3">
          <input name="title" required placeholder="Announcement title" className="w-full border rounded-lg px-3 py-2 text-sm" />
          <textarea name="body" required rows={3} placeholder="Message" className="w-full border rounded-lg px-3 py-2 text-sm" />
          <button type="submit" className="px-4 py-2 bg-[var(--color-primary)] text-white hover:text-white rounded font-medium hover:opacity-90 text-sm">
            Post announcement
          </button>
        </form>
      )}

      <div className="flex flex-col gap-6">
        {announcements?.map((ann: any) => (
          <div key={ann.id} className="bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-900">{ann.title}</h2>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {formatDateTime(ann.created_at)}
              </span>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap mb-4">{ann.body}</p>
            <div className="text-sm font-medium text-gray-500 border-t border-gray-100 pt-4">
              Posted by {ann.author?.full_name || 'Admin'}
            </div>
          </div>
        ))}
        {(!announcements || announcements.length === 0) && (
          <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500">No announcements yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
