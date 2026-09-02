import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  
  if (profile?.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
          <h2 className="font-bold mb-1">Access Denied</h2>
          <p className="text-sm">You must be an administrator to view this page.</p>
        </div>
      </div>
    )
  }

  const { data: settings } = await supabase.from('org_settings').select('*').limit(1).single()

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6">Organization Settings</h1>
      
      <div className="bg-[var(--color-surface)] p-6 rounded-lg border border-[var(--color-border)] shadow-sm">
        <h2 className="text-lg font-semibold mb-4 border-b pb-2">Company Information</h2>
        
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Organization Name</p>
            <p className="font-medium">{settings?.org_name || 'GIFFTER'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">GST Number</p>
            <p className="font-medium">{settings?.gst_number || 'Not Set'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-gray-500 mb-1">Registered Address</p>
            <p className="font-medium bg-gray-50 p-3 rounded border border-gray-100">{settings?.address || 'Not Set'}</p>
          </div>
        </div>

        <h2 className="text-lg font-semibold mb-4 border-b pb-2">Financial Defaults</h2>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Default Tax Rate (%)</p>
            <p className="font-medium">{settings?.default_tax_rate ? `${settings.default_tax_rate}%` : '18%'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Default Currency</p>
            <p className="font-medium">INR (₹)</p>
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t border-gray-200 flex justify-end">
          <button className="px-4 py-2 bg-gray-200 text-gray-500 rounded font-medium cursor-not-allowed text-sm" disabled>
            Edit Settings (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  )
}