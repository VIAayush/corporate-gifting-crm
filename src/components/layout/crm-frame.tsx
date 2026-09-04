'use client'

import React, { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import type { Role } from '@/lib/types'

type Note = {
  id: string
  title: string
  body: string | null
  link: string | null
  read_at: string | null
  created_at: string
}

export function CrmFrame({
  role,
  user,
  notifications,
  children,
}: {
  role: Role
  user: { name: string; email: string }
  notifications: Note[]
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4EFE6]">
      <div className="hidden lg:flex">
        <Sidebar role={role} user={user} />
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="relative h-full w-64">
            <Sidebar role={role} user={user} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Topbar
          user={user}
          notifications={notifications}
          onMenuClick={() => setOpen(true)}
        />
        <main className="flex-1 overflow-y-auto bg-[#F4EFE6]">
          {children}
        </main>
      </div>
    </div>
  )
}
