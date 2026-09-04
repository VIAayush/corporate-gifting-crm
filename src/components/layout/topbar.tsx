'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { Bell, Search, Menu } from 'lucide-react';
import { markNotificationRead } from '@/app/crm/notifications/actions';

type Note = {
  id: string
  title: string
  body: string | null
  link: string | null
  read_at: string | null
  created_at: string
}

export function Topbar({
  user,
  notifications = [],
  onMenuClick,
}: {
  user?: { name?: string; email?: string }
  notifications?: Note[]
  onMenuClick?: () => void
}) {
  const email = user?.email || ''
  const unread = notifications.filter((n) => !n.read_at).length
  const [open, setOpen] = useState(false)
  const [, start] = useTransition()

  return (
    <header className="h-14 border-b border-[#E5DFD5] bg-[#F4EFE6] px-4 sm:px-8 flex items-center justify-between flex-shrink-0 relative">
      <div className="flex items-center gap-3 min-w-0">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg border border-[#E5DFD5] bg-white text-[#1A3022] hover:bg-[#FAF7F2]"
            aria-label="Open navigation"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
        <div className="text-xs text-[#7A7267] font-normal tracking-normal hidden sm:block">
          Corporate gifting, from enquiry to payment
        </div>
      </div>
      <form action="/crm/search" className="hidden md:flex items-center gap-2 flex-1 max-w-md mx-8">
        <Search className="w-4 h-4 text-[#7A7267]" />
        <input
          name="q"
          placeholder="Search orders, clients, campaigns…"
          className="w-full bg-transparent text-xs border-b border-[#E5DFD5] py-1 outline-none"
        />
      </form>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="relative p-2 rounded-lg hover:bg-white border border-transparent hover:border-[#E5DFD5]"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4 text-[#5A5248]" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#1A3022] text-white text-[10px] leading-4">
              {unread}
            </span>
          )}
        </button>
        <div className="text-xs text-[#5A5248] font-medium">{email}</div>
      </div>
      {open && (
        <div className="absolute right-6 top-12 w-80 bg-white border border-[#E5DFD5] rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-3 py-2 text-[11px] uppercase tracking-wider font-semibold text-[#7A7267] border-b">
            Notifications
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="p-4 text-xs text-gray-500">No notifications yet.</p>
            )}
            {notifications.slice(0, 12).map((n) => (
              <Link
                key={n.id}
                href={n.link || '/crm/dashboard'}
                onClick={() => {
                  setOpen(false)
                  if (!n.read_at) start(() => markNotificationRead(n.id))
                }}
                className={`block px-3 py-2.5 border-b border-[#F4EFE6] hover:bg-[#FAF7F2] ${n.read_at ? '' : 'bg-[#FAF7F2]'}`}
              >
                <p className="text-xs font-semibold text-[#1C1917]">{n.title}</p>
                {n.body && <p className="text-[11px] text-[#7A7267] mt-0.5 line-clamp-2">{n.body}</p>}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
