'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { createPortalClient } from './actions'

export function PortalClientForm({ companyId }: { companyId: string }) {
  const [pending, startTransition] = useTransition()
  const [formKey, setFormKey] = useState(0)

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await createPortalClient(formData)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      toast.success('Client login created. The password is not stored and will not be shown again.')
      setFormKey((key) => key + 1)
    })
  }

  return (
    <form key={formKey} action={onSubmit} className="grid md:grid-cols-2 gap-3 text-xs">
      <input type="hidden" name="company_id" value={companyId} />
      <input name="full_name" required placeholder="Client name" className="border rounded-lg px-3 py-2" />
      <input name="email" type="email" required placeholder="Login email" className="border rounded-lg px-3 py-2" />
      <select name="role" defaultValue="client_user" className="border rounded-lg px-3 py-2 bg-white">
        <option value="client_user">Client user</option>
        <option value="client_admin">Client admin</option>
      </select>
      <input
        name="password"
        type="password"
        required
        minLength={8}
        autoComplete="new-password"
        placeholder="Temporary password (min 8 characters)"
        className="border rounded-lg px-3 py-2"
      />
      <p className="md:col-span-2 text-[11px] text-gray-500">
        The password is sent to Supabase Auth only. It is never stored in application tables and is not shown after creation.
      </p>
      <button
        type="submit"
        disabled={pending}
        className="md:col-span-2 px-3 py-2 text-xs font-semibold text-white bg-[#4A235A] rounded-lg disabled:opacity-50"
      >
        {pending ? 'Creating login…' : 'Create client login'}
      </button>
    </form>
  )
}
