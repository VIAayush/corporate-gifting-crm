import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'

export default async function ContactsPage(props: { searchParams: { search?: string } }) {
  const searchParams = await props.searchParams
  const search = searchParams.search || ''
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  let query = supabase
    .from('contacts')
    .select('*, company:companies(id, name)')
    .order('full_name')

  if (search) {
    query = query.ilike('full_name', `%${search}%`)
  }

  const { data: contacts, error } = await query

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-[var(--color-primary)]">Contacts</h1>
        <button className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-md hover:opacity-90">
          Add Contact
        </button>
      </div>

      <div className="mb-6 flex gap-4">
        <form className="flex-1 max-w-md flex gap-2">
          <input 
            type="text" 
            name="search" 
            defaultValue={search}
            placeholder="Search by name..." 
            className="flex-1 px-3 py-2 border rounded-md"
          />
          <button type="submit" className="bg-gray-100 px-4 py-2 border rounded-md hover:bg-gray-200">Search</button>
        </form>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-left">
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
            {contacts?.map((contact: any) => (
              <tr key={contact.id} className="hover:bg-gray-50">
                <td className="p-4">{contact.full_name}</td>
                <td className="p-4">
                  {contact.company ? (
                    <Link href={`/crm/companies/${contact.company.id}`} className="text-blue-600 hover:underline">
                      {contact.company.name}
                    </Link>
                  ) : '-'}
                </td>
                <td className="p-4">{contact.designation || '-'}</td>
                <td className="p-4">{contact.email || '-'}</td>
                <td className="p-4">{contact.phone || '-'}</td>
                <td className="p-4">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {contact.contact_type || 'Unknown'}
                  </span>
                </td>
              </tr>
            ))}
            {!contacts?.length && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">No contacts found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}