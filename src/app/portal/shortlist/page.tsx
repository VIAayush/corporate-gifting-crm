'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function PortalShortlistPage() {
  const [shortlist, setShortlist] = useState<any[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const list = JSON.parse(localStorage.getItem('giffter_shortlist') || '[]')
    setShortlist(list)

    const handleStorage = () => {
      setShortlist(JSON.parse(localStorage.getItem('giffter_shortlist') || '[]'))
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const removeItem = (sku: string) => {
    const newList = shortlist.filter(p => p.sku !== sku)
    setShortlist(newList)
    localStorage.setItem('giffter_shortlist', JSON.stringify(newList))
    window.dispatchEvent(new Event('storage'))
  }

  const clearList = () => {
    setShortlist([])
    localStorage.setItem('giffter_shortlist', '[]')
    window.dispatchEvent(new Event('storage'))
  }

  if (!mounted) return null // Prevent hydration mismatch

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Shortlist</h1>
          <p className="mt-2 text-gray-600">Products you've saved for consideration.</p>
        </div>
        
        {shortlist.length > 0 && (
          <div className="flex gap-3">
            <button 
              onClick={clearList}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear List
            </button>
            <Link 
              href="/portal/requirements/new"
              className="px-4 py-2 text-sm font-medium text-white bg-[#4A235A] rounded-md hover:bg-[#3d1c4a]"
            >
              Create Requirement
            </Link>
          </div>
        )}
      </div>

      {shortlist.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Your shortlist is empty</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Browse our catalogue and click "Add to Shortlist" to save products you're interested in.
          </p>
          <Link href="/portal/catalogue" className="text-[#4A235A] font-medium hover:underline">
            Browse Catalogue →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shortlist.map((product) => (
            <div key={product.sku} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="relative h-48 bg-gray-50">
                {product.image_url ? (
                  <Image src={product.image_url} alt={product.name} fill className="object-contain p-4" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">No Image</div>
                )}
                <button 
                  onClick={() => removeItem(product.sku)}
                  className="absolute top-2 right-2 bg-white/80 p-1.5 rounded-full text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm"
                  title="Remove from shortlist"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-4 flex-1 flex flex-col">
                <span className="text-xs text-gray-500 font-mono mb-1">{product.sku}</span>
                <Link href={`/portal/catalogue/${product.sku}`}>
                  <h3 className="text-md font-bold text-gray-900 hover:text-[#4A235A] line-clamp-2">{product.name}</h3>
                </Link>
                <div className="mt-2 text-sm text-gray-600">
                  Price: ${Number(product.price).toFixed(2)} | MOQ: {product.moq}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
