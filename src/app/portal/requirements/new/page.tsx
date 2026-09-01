'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createPortalRequirement } from '@/app/portal/actions'

export default function NewRequirementPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Get shortlisted items
  const [shortlistedProducts, setShortlistedProducts] = useState<any[]>([])
  useEffect(() => {
    setShortlistedProducts(JSON.parse(localStorage.getItem('giffter_shortlist') || '[]'))
  }, [])

  const [formData, setFormData] = useState({
    name: '',
    purpose: '',
    description: '',
    budget_per_unit: '',
    quantity: '',
    deadline: '',
    delivery_city: '',
    products: [] as string[] // array of SKUs
  })

  useEffect(() => {
    setFormData(prev => ({ ...prev, products: shortlistedProducts.map(p => p.sku) }))
  }, [shortlistedProducts])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step < 3) {
      setStep(step + 1)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const result = await createPortalRequirement(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        router.push('/portal/requirements')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Requirement</h1>
        <p className="mt-2 text-gray-600">Tell us what you need, and we'll prepare a custom quotation.</p>
      </div>

      <div className="flex mb-8 items-center justify-between relative">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -z-10"></div>
        {[1, 2, 3].map(i => (
          <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
            step >= i ? 'bg-[#4A235A] text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            {i}
          </div>
        ))}
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 border-b pb-2">Step 1: What do you need?</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Requirement Name</label>
                <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full p-2 border rounded focus:ring-[#4A235A] focus:border-[#4A235A] outline-none" placeholder="e.g. Diwali Gifts 2026" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose / Occasion</label>
                <select name="purpose" required value={formData.purpose} onChange={handleChange} className="w-full p-2 border rounded focus:ring-[#4A235A] focus:border-[#4A235A] outline-none">
                  <option value="">Select an occasion</option>
                  <option value="festival">Festival (Diwali, Christmas, etc)</option>
                  <option value="welcome_kit">Employee Welcome Kit</option>
                  <option value="anniversary">Work Anniversary</option>
                  <option value="client_gifting">Client Gifting</option>
                  <option value="event">Event / Conference</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full p-2 border rounded focus:ring-[#4A235A] focus:border-[#4A235A] outline-none" placeholder="Any specific themes, colors, or preferences?"></textarea>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 border-b pb-2">Step 2: Budget & Logistics</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget per unit ($)</label>
                  <input type="number" name="budget_per_unit" required value={formData.budget_per_unit} onChange={handleChange} min="1" step="0.01" className="w-full p-2 border rounded focus:ring-[#4A235A] focus:border-[#4A235A] outline-none" placeholder="e.g. 50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Quantity</label>
                  <input type="number" name="quantity" required value={formData.quantity} onChange={handleChange} min="1" className="w-full p-2 border rounded focus:ring-[#4A235A] focus:border-[#4A235A] outline-none" placeholder="e.g. 100" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Required By Date</label>
                <input type="date" name="deadline" required value={formData.deadline} onChange={handleChange} className="w-full p-2 border rounded focus:ring-[#4A235A] focus:border-[#4A235A] outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery City</label>
                <input type="text" name="delivery_city" required value={formData.delivery_city} onChange={handleChange} className="w-full p-2 border rounded focus:ring-[#4A235A] focus:border-[#4A235A] outline-none" placeholder="e.g. New York" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 border-b pb-2">Step 3: Included Products</h2>
              <p className="text-sm text-gray-600">The products currently in your shortlist will be attached to this requirement for reference.</p>
              
              {shortlistedProducts.length === 0 ? (
                <div className="bg-gray-50 p-4 rounded text-sm text-gray-500 text-center">
                  You haven't shortlisted any products. We'll suggest options based on your description and budget.
                </div>
              ) : (
                <ul className="divide-y border rounded">
                  {shortlistedProducts.map(p => (
                    <li key={p.sku} className="p-3 flex items-center justify-between bg-gray-50">
                      <div className="text-sm font-medium">{p.name}</div>
                      <div className="text-xs text-gray-500">{p.sku}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="mt-8 flex justify-between pt-6 border-t border-gray-100">
            {step > 1 ? (
              <button type="button" onClick={() => setStep(step - 1)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50">
                Back
              </button>
            ) : (
              <div></div>
            )}
            
            <button type="submit" disabled={loading} className="px-6 py-2 text-sm font-medium text-white bg-[#4A235A] rounded hover:bg-[#3d1c4a] disabled:opacity-50 transition-colors">
              {step < 3 ? 'Next Step' : loading ? 'Submitting...' : 'Submit Requirement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
