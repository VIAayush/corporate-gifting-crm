'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LogOut, PackageSearch, Heart, FileText, ShoppingBag, LayoutDashboard, FolderGit2, Files } from 'lucide-react';
import { signOut } from '@/app/login/actions';
import { CompanyAvatar } from '../ui/avatar';

interface PortalLayoutProps {
  children: React.ReactNode;
  user?: {
    name: string;
    company_name: string;
    avatar_url?: string;
  };
}

const navItems = [
  { label: 'Dashboard', href: '/portal', icon: LayoutDashboard },
  { label: 'Campaigns', href: '/portal/campaigns', icon: FolderGit2 },
  { label: 'Products', href: '/portal/catalogue', icon: PackageSearch },
  { label: 'Shortlist', href: '/portal/shortlist', icon: Heart },
  { label: 'Quotations', href: '/portal/quotations', icon: FileText },
  { label: 'Orders', href: '/portal/orders', icon: ShoppingBag },
  { label: 'Documents', href: '/portal/documents', icon: Files },
];

export function PortalLayout({ children, user }: PortalLayoutProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary text-white rounded font-bold flex items-center justify-center text-xl">
                  G
                </div>
                <span className="font-bold text-xl tracking-tight text-primary hidden sm:block">GIFFTER</span>
              </div>
              
              <nav className="hidden md:flex items-center space-x-1">
                {navItems.map((item) => {
                  const isActive = item.href === '/portal'
                    ? pathname === '/portal'
                    : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary/5 text-primary'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
            
            <div className="flex items-center gap-4">
              {user && (
                <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-gray-200">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.company_name}</p>
                  </div>
                  <CompanyAvatar name={user.name} logoPath={user.avatar_url} size="md" />
                </div>
              )}
              <button
                onClick={() => signOut()}
                className="hidden md:flex p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
              
              <button
                type="button"
                className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => {
                  const isActive =
                    item.href === '/portal' ? pathname === '/portal' : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium ${
                      isActive
                        ? 'bg-primary/5 text-primary'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                    {item.label}
                  </Link>
                );
              })}
              <button
                onClick={() => signOut()}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
            {user && (
              <div className="pt-4 pb-3 border-t border-gray-200 px-5 flex items-center gap-3">
                <CompanyAvatar name={user.name} logoPath={user.avatar_url} size="md" />
                <div>
                  <div className="text-base font-medium text-gray-800">{user.name}</div>
                  <div className="text-sm font-medium text-gray-500">{user.company_name}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
