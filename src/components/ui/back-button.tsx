'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  href?: string;
  label?: string;
  fallback?: string;
  className?: string;
}

export function BackButton({ href, label = 'Back', fallback = '/crm/dashboard', className = '' }: BackButtonProps) {
  const router = useRouter();

  if (href) {
    return (
      <Link href={href} className={`inline-flex items-center text-sm font-medium text-gray-600 hover:text-primary transition-colors ${className}`}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        {label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push(fallback);
        }
      }}
      className={`inline-flex items-center text-sm font-medium text-gray-600 hover:text-primary transition-colors ${className}`}
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      {label}
    </button>
  );
}
