import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function MockupsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: mockups } = await supabase.from('mockups').select('*, requirements(title, companies(name)), orders(order_number), uploader:uploaded_by(full_name)').order('created_at', { ascending: false })

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6">Design Mockups</h1>
      
      <div className="bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] overflow-hidden">
        {mockups && mockups.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-gray-50">
                <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Mockup Preview</th>
                <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Requirement</th>
                <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Order #</th>
                <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Uploaded By</th>
                <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Date</th>
              </tr>
            </thead>
            <tbody>
              {mockups.map(mockup => (
                <tr key={mockup.id} className="border-b border-[var(--color-border)] hover:bg-gray-50">
                  <td className="p-3 text-sm">
                    <a href={mockup.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline">
                      <span className="text-lg">🖼️</span> View File
                    </a>
                  </td>
                  <td className="p-3 text-sm">
                    {mockup.requirement_id ? (
                      <div>
                        <p className="font-medium">{mockup.requirements?.title}</p>
                        <p className="text-xs text-gray-500">{mockup.requirements?.companies?.name}</p>
                      </div>
                    ) : '-'}
                  </td>
                  <td className="p-3 text-sm">
                    {mockup.order_id ? <Link href={`/crm/orders/${mockup.order_id}`} className="text-blue-600 hover:underline">{mockup.orders?.order_number}</Link> : '-'}
                  </td>
                  <td className="p-3 text-sm">{mockup.uploader?.full_name || 'Unknown'}</td>
                  <td className="p-3 text-sm">{formatDate(mockup.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-gray-500">
            No mockups uploaded yet.
          </div>
        )}
      </div>
    </div>
  )
}