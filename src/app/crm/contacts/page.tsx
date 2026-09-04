import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { createContact } from './actions'
import { requireStaff, applyCompanyScope } from '@/lib/auth'
import { CompanyAvatar } from '@/components/ui/avatar'

export default async function ContactsPage(props: { searchParams: Promise<{ search?: string }> }) {
  const profile = await requireStaff(['admin', 'sales', 'management'])
  const searchParams = await props.searchParams
  const search = searchParams.search || ''

  const supabase = await createClient()
  const companyQuery = applyCompanyScope(
    supabase.from('companies').select('id, name, logo_path').order('name'),
    profile
  )
  const { data: companies } = await companyQuery
  const companyIds = (companies || []).map((c) => c.id)

  let query = supabase.from('contacts').select('*, company:companies(id, name, logo_path)').order('full_name')
  if (companyIds.length > 0) query = query.in('company_id', companyIds)
  else query = query.eq('company_id', '00000000-0000-0000-0000-000000000000')
  if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)

  const { data: contacts } = await query

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
        <button className="bg-[#1A3022] text-white hover:text-white rounded-lg font-semibold md:col-span-3 py-2">Add contact</button>
      </form>

      <form className="flex-1 max-w-md flex gap-2">
        <input type="text" name="search" defaultValue={search} placeholder="Search by name or email..." className="flex-1 px-3 py-2 border rounded-md text-sm" />
        <button type="submit" className="bg-gray-100 px-4 py-2 border rounded-md text-sm">Search</button>
      </form>

      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[640px]">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Company</th>
              <th className="p-3">Email</th>
              <th className="p-3">Phone</th>
            </tr>
          </thead>
          <tbody>
            {(contacts || []).map((c: any) => {
              const company = Array.isArray(c.company) ? c.company[0] : c.company
              return (
                <tr key={c.id} className="border-t">
                  <td className="p-3 font-medium">{c.full_name}</td>
                  <td className="p-3">
                    {company ? (
                      <Link href={`/crm/companies/${company.id}`} className="inline-flex items-center gap-2 hover:underline">
                        <CompanyAvatar name={company.name} logoPath={company.logo_path} size="sm" />
                        {company.name}
                      </Link>
                    ) : '—'}
                  </td>
                  <td className="p-3 text-gray-600">{c.email || '—'}</td>
                  <td className="p-3 text-gray-600">{c.phone || '—'}</td>
                </tr>
              )
            })}
            {(!contacts || contacts.length === 0) && (
              <tr><td colSpan={4} className="p-8 text-center text-gray-500">No contacts in your assigned companies.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
