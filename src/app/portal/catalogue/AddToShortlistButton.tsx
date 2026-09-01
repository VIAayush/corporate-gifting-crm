'use client'

import { useState, useEffect } from 'react'

export function AddToShortlistButton({ product }: { product: any }) {
  const [isShortlisted, setIsShortlisted] = useState(false)

  useEffect(() => {
    const list = JSON.parse(localStorage.getItem('giffter_shortlist') || '[]')
    setIsShortlisted(list.some((p: any) => p.sku === product.sku))
  }, [product.sku])

  const toggleShortlist = () => {
    let list = JSON.parse(localStorage.getItem('giffter_shortlist') || '[]')
    if (isShortlisted) {
      list = list.filter((p: any) => p.sku !== product.sku)
    } else {
      list.push(product)
    }
    localStorage.setItem('giffter_shortlist', JSON.stringify(list))
    setIsShortlisted(!isShortlisted)
    window.dispatchEvent(new Event('storage')) // for cross-component update
  }

  return (
    <button
      onClick={toggleShortlist}
      className={`flex-1 py-2 rounded-md font-medium text-sm transition-colors ${
        isShortlisted 
          ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100' 
          : 'bg-[#4A235A] text-white hover:bg-[#3d1c4a]'
      }`}
    >
      {isShortlisted ? '✓ Shortlisted' : 'Add to Shortlist'}
    </button>
  )
}
