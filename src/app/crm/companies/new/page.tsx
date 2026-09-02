'use client'

import { createCompany } from '../actions'

export default function NewCompanyPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6">Add New Company</h1>
      
      <form action={async (formData) => { await createCompany(formData) }} className="bg-[var(--color-surface)] p-6 rounded-lg border border-[var(--color-border)] shadow-sm flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">Company Name *</label>
            <input type="text" name="name" required className="w-full p-2 border border-[var(--color-border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Industry</label>
            <select name="industry" className="w-full p-2 border border-[var(--color-border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]">
              <option value="">Select Industry</option>
              <option value="IT">IT</option>
              <option value="Finance">Finance</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Retail">Retail</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Website</label>
          <input type="url" name="website" placeholder="https://" className="w-full p-2 border border-[var(--color-border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]" />
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">City</label>
            <input type="text" name="city" className="w-full p-2 border border-[var(--color-border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">State</label>
            <input type="text" name="state" className="w-full p-2 border border-[var(--color-border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Country</label>
            <input type="text" name="country" defaultValue="India" className="w-full p-2 border border-[var(--color-border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Address</label>
          <textarea name="address" rows={3} className="w-full p-2 border border-[var(--color-border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea name="notes" rows={3} className="w-full p-2 border border-[var(--color-border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"></textarea>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button type="button" onClick={() => window.history.back()} className="px-4 py-2 border border-gray-300 rounded text-gray-700 font-medium hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" className="px-6 py-2 bg-[var(--color-primary)] text-white rounded font-medium hover:opacity-90">
            Create Company
          </button>
        </div>
      </form>
    </div>
  )
}