'use client';

import React from 'react';

interface TopbarProps {
  user?: {
    name?: string;
    email?: string;
  };
}

export function Topbar({ user }: TopbarProps) {
  const email = user?.email || 'admin@oaklane.demo';

  return (
    <header className="h-14 border-b border-[#E5DFD5] bg-[#F4EFE6] px-8 flex items-center justify-between flex-shrink-0">
      <div className="text-xs text-[#7A7267] font-normal tracking-normal">
        Corporate gifting, from enquiry to payment
      </div>
      <div className="text-xs text-[#5A5248] font-medium">
        {email}
      </div>
    </header>
  );
}
