import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { registerMockup } from './actions'
import { requireStaff, applyOwnerScope, applyOrderScope } from '@/lib/auth'

function fileHref(path: string | null) {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) return path
  return path
}

export default async function MockupsPage() {
  const profile = await requireStaff(['admin', 'sales', 'operations', 'management'])
  const supabase = await createClient()

  const [{ data: mockups }, { data: requirements }, { data: orders }] = await Promise.all([
    supabase.from('mockups').select('*, requirement:requirements(name, company:companies(name)), order:orders(order_number), uploader:profiles!uploaded_by(full_name)').order('created_at', { ascending: false }),
    applyOwnerScope(supabase.from('requirements').select('id, name').order('created_at', { ascending: false }).limit(50), profile),
    applyOrderScope(supabase.from('orders').select('id, order_number').order('created_at', { ascending: false }).limit(50), profile),
  ])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">Design Mockups</h1>
        <p className="text-xs text-[#7A7267] mt-1">Attach mockup files to a requirement or order. Shared mockups are visible in the client portal.</p>
      </div>

      <form action={registerMockup} className="bg-white border rounded-2xl p-4 grid md:grid-cols-3 gap-3 text-xs">
        <input name="file_url" required placeholder="File URL" className="border rounded-lg px-2 py-2" />
        <input name="file_name" placeholder="File name" className="border rounded-lg px-2 py-2" />
        <select name="mime_type" className="border rounded-lg px-2 py-2">
          <option value="image/png">PNG</option>
          <option value="image/jpeg">JPEG</option>
          <option value="application/pdf">PDF</option>
        </select>
        <select name="requirement_id" className="border rounded-lg px-2 py-2">
          <option value="">Requirement (optional)</option>
          {(requirements || []).map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <select name="order_id" className="border rounded-lg px-2 py-2">
          <option value="">Order (optional)</option>
          {(orders || []).map((o) => (
            <option key={o.id} value={o.id}>{o.order_number}</option>
          ))}
        </select>
        <select name="visibility" className="border rounded-lg px-2 py-2">
          <option value="internal">Internal only</option>
          <option value="client">Share with client</option>
        </select>
        <button className="bg-[#1A3022] text-white rounded-lg font-semibold md:col-span-3 py-2">Register mockup</button>
      </form>

      <div className="bg-white rounded-lg border overflow-hidden">
        {mockups && mockups.length > 0 ? (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b bg-gray-50 text-xs text-gray-500">
                <th className="p-3">File</th>
                <th className="p-3">Requirement</th>
                <th className="p-3">Order</th>
                <th className="p-3">Visibility</th>
                <th className="p-3">Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {mockups.map((mockup) => {
                const requirement = Array.isArray(mockup.requirement) ? mockup.requirement[0] : mockup.requirement
                const company = requirement && !Array.isArray(requirement.company) ? requirement.company : requirement?.company?.[0]
                const order = Array.isArray(mockup.order) ? mockup.order[0] : mockup.order
                const uploader = Array.isArray(mockup.uploader) ? mockup.uploader[0] : mockup.uploader
                const href = fileHref(mockup.storage_path)
                return (
                  <tr key={mockup.id} className="border-b text-sm">
                    <td className="p-3">
                      {href ? (
                        <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {mockup.file_name || 'View file'}
                        </a>
                      ) : mockup.file_name}
                      <p className="text-[11px] text-gray-500">{mockup.mime_type}</p>
                    </td>
                    <td className="p-3">
                      {requirement ? (
                        <div>
                          <p className="font-medium">{requirement.name}</p>
                          <p className="text-xs text-gray-500">{company?.name}</p>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="p-3">
                      {mockup.order_id ? (
                        <Link href={`/crm/orders/${mockup.order_id}`} className="text-blue-600 hover:underline">{order?.order_number}</Link>
                      ) : '—'}
                    </td>
                    <td className="p-3 capitalize">{mockup.status === 'shared' ? 'Client-facing' : mockup.status || 'internal'}</td>
                    <td className="p-3">{uploader?.full_name || '—'} · {formatDate(mockup.created_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-gray-500">No mockups uploaded yet.</div>
        )}
      </div>
    </div>
  )
}
