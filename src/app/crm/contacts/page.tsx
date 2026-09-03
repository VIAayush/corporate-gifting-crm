import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createContact } from './actions'

export default async function ContactsPage(props: { searchParams: Promise<{ search?: string }> }) {
  const searchParams = await props.searchParams
  const search = searchParams.search || ''

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  let query = supabase.from('contacts').select('*, company:companies(id, name)').order('full_name')
  if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)

  const [{ data: contacts }, { data: companies }] = await Promise.all([
    query,
    supabase.from('companies').select('id, name').order('name'),
  ])

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-[var(--color-primary)]">Contacts</h1>
      </div>

      <form action={createContact} className="bg-white border rounded-2xl p-4 grid md:grid-cols-3 gap-3 text-xs">
        <input name="full_name" required placeholder="Full name" className="border rounded-lg px-2 py-2" />
        <select name="company_id" required className="border rounded-lg px-2 py-2">
          <option value="">Company</option>
          {(companies || []).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input name="designation" placeholder="Designation" className="border rounded-lg px-2 py-2" />
        <input name="email" type="email" placeholder="Email" className="border rounded-lg px-2 py-2" />
        <input name="phone" placeholder="Phone" className="border rounded-lg px-2 py-2" />
        <select name="contact_type" className="border rounded-lg px-2 py-2">
          <option value="primary">Primary</option>
          <option value="billing">Billing</option>
          <option value="procurement">Procurement</option>
          <option value="other">Other</option>
        </select>
        <button className="bg-[#1A3022] text-white rounded-lg font-semibold md:col-span-3 py-2">Add contact</button>
      </form>

      <form className="flex-1 max-w-md flex gap-2">
        <input type="text" name="search" defaultValue={search} placeholder="Search by name or email..." className="flex-1 px-3 py-2 border rounded-md text-sm" />
        <button type="submit" className="bg-gray-100 px-4 py-2 border rounded-md text-sm">Search</button>
      </form>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-medium text-gray-500">Name</th>
              <th className="p-4 font-medium text-gray-500">Company</th>
              <th className="p-4 font-medium text-gray-500">Designation</th>
              <th className="p-4 font-medium text-gray-500">Email</th>
              <th className="p-4 font-medium text-gray-500">Phone</th>
              <th className="p-4 font-medium text-gray-500">Type</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {contacts?.map((contact) => {
              const company = Array.isArray(contact.company) ? contact.company[0] : contact.company
              return (
                <tr key={contact.id} className="hover:bg-gray-50">
                  <td className="p-4">{contact.full_name}</td>
                  <td className="p-4">
                    {company ? (
                      <Link href={`/crm/companies/${company.id}`} className="text-blue-600 hover:underline">{company.name}</Link>
                    ) : '—'}
                  </td>
                  <td className="p-4">{contact.designation || '—'}</td>
                  <td className="p-4">{contact.email || '—'}</td>
                  <td className="p-4">{contact.phone || '—'}</td>
                  <td className="p-4 capitalize">{contact.contact_type || 'other'}</td>
                </tr>
              )
            })}
            {!contacts?.length && (
              <tr><td colSpan={6} className="p-8 text-center text-gray-500">No contacts found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
