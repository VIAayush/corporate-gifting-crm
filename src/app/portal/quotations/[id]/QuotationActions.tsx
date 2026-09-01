'use client'

import { useState } from 'react'
import { respondToQuotation } from '../../actions'

export function QuotationActions({ quotationId }: { quotationId: string }) {
  const [loading, setLoading] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [comment, setComment] = useState('')

  const handleRespond = async (status: 'accepted' | 'rejected') => {
    if (status === 'rejected' && !rejecting) {
      setRejecting(true)
      return
    }

    setLoading(true)
    await respondToQuotation(quotationId, status, comment)
    setLoading(false)
    setRejecting(false)
  }

  return (
    <div className="mt-8 pt-8 border-t border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Decision</h3>
      
      {rejecting ? (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">Reason for rejection (Optional)</label>
          <textarea 
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full p-2 border rounded-md mb-4 focus:ring-[#4A235A] outline-none"
            rows={3}
          />
          <div className="flex gap-3">
            <button 
              onClick={() => handleRespond('rejected')}
              disabled={loading}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 font-medium"
            >
              {loading ? 'Submitting...' : 'Confirm Rejection'}
            </button>
            <button 
              onClick={() => setRejecting(false)}
              disabled={loading}
              className="text-gray-600 bg-white border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-4">
          <button 
            onClick={() => handleRespond('accepted')}
            disabled={loading}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 font-medium shadow-sm"
          >
            {loading ? 'Processing...' : 'Accept Quotation'}
          </button>
          <button 
            onClick={() => handleRespond('rejected')}
            disabled={loading}
            className="text-red-600 bg-white border border-red-200 px-6 py-2 rounded-md hover:bg-red-50 disabled:opacity-50 font-medium"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  )
}
