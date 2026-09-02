'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Building2, Users, TrendingUp, FolderGit2, ClipboardList,
  Package, Image as ImageIcon, FileText, ShoppingBag,
  Truck, Printer, Package2, Receipt, CreditCard, ArrowDownToLine,
  BarChart3, Activity, UserCog, Settings, ShieldCheck, LogOut
} from 'lucide-react';
import { signOut } from '@/app/login/actions';

type Role = 'admin' | 'sales' | 'operations' | 'accounts' | 'management' | 'client_admin';

interface SidebarProps {
  role: Role;
  user?: {
    name: string;
    email: string;
    avatar_url?: string;
  };
}

const navGroups = [
  {
    label: 'WORKSPACE',
    roles: ['admin', 'sales', 'operations', 'accounts', 'management'],
    items: [
      { label: 'Dashboard', href: '/crm/dashboard', matchPrefix: '/crm/dashboard', icon: LayoutDashboard }
    ]
  },
  {
    label: 'CRM',
    roles: ['admin', 'sales', 'management'],
    items: [
      { label: 'Companies', href: '/crm/companies', matchPrefix: '/crm/companies', icon: Building2 },
      { label: 'Contacts', href: '/crm/contacts', matchPrefix: '/crm/contacts', icon: Users },
      { label: 'Leads', href: '/crm/leads', matchPrefix: '/crm/leads', icon: TrendingUp },
      { label: 'Campaigns', href: '/crm/campaigns', matchPrefix: '/crm/campaigns', icon: FolderGit2 },
      { label: 'Requirements', href: '/crm/requirements', matchPrefix: '/crm/requirements', icon: ClipboardList }
    ]
  },
  {
    label: 'SALES',
    roles: ['admin', 'sales', 'operations'],
    items: [
      { label: 'Catalogue', href: '/crm/products', matchPrefix: '/crm/products', icon: Package },
      { label: 'Mockups', href: '/crm/mockups', matchPrefix: '/crm/mockups', icon: ImageIcon },
      { label: 'Quotations', href: '/crm/quotations', matchPrefix: '/crm/quotations', icon: FileText }
    ]
  },
  {
    label: 'OPERATIONS',
    roles: ['admin', 'operations', 'management'],
    items: [
      { label: 'Orders', href: '/crm/orders', matchPrefix: '/crm/orders', icon: ShoppingBag },
      { label: 'Suppliers', href: '/crm/suppliers', matchPrefix: '/crm/suppliers', icon: Truck },
      { label: 'Printing vendors', href: '/crm/printing-vendors', matchPrefix: '/crm/printing-vendors', icon: Printer },
      { label: 'Courier partners', href: '/crm/courier-partners', matchPrefix: '/crm/courier-partners', icon: Package2 }
    ]
  },
  {
    label: 'FINANCE',
    roles: ['admin', 'accounts', 'management'],
    items: [
      { label: 'Invoices', href: '/crm/invoices', matchPrefix: '/crm/invoices', icon: Receipt },
      { label: 'Payments', href: '/crm/payments', matchPrefix: '/crm/payments', icon: CreditCard },
      { label: 'Receivables', href: '/crm/receivables', matchPrefix: '/crm/receivables', icon: ArrowDownToLine }
    ]
  },
  {
    label: 'MANAGEMENT',
    roles: ['admin', 'management'],
    items: [
      { label: 'Reports', href: '/crm/reports', matchPrefix: '/crm/reports', icon: BarChart3 },
      { label: 'Activities', href: '/crm/activities', matchPrefix: '/crm/activities', icon: Activity }
    ]
  },
  {
    label: 'ADMIN',
    roles: ['admin'],
    items: [
      { label: 'Team', href: '/crm/team', matchPrefix: '/crm/team', icon: UserCog },
      { label: 'Settings', href: '/crm/settings', matchPrefix: '/crm/settings', icon: Settings },
      { label: 'Audit log', href: '/crm/audit-log', matchPrefix: '/crm/audit-log', icon: ShieldCheck }
    ]
  }
];

export function Sidebar({ role, user }: SidebarProps) {
  const pathname = usePathname();

  const handleLogout = async () => {
    await signOut();
  };

  const displayName = user?.name || (role === 'admin' ? 'Asha Menon' : 'User');
  const roleName = role === 'admin' ? 'Admin' : role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <aside className="w-64 flex-shrink-0 bg-[#16281E] text-[#A3B5AA] flex flex-col justify-between h-screen select-none border-r border-[#1B3224]">
      {/* Brand Header */}
      <div>
        <div className="px-6 pt-6 pb-4 border-b border-[#21382A]">
          <Link href="/crm/dashboard" className="block group">
            <h1 className="font-serif text-2xl font-normal tracking-tight text-[#FAF7F2] group-hover:text-white transition-colors">
              Oaklane
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#8B9E92] mt-0.5">
              GIFT OPERATIONS
            </p>
          </Link>
        </div>

        {/* Navigation list */}
        <div className="px-3 py-4 space-y-5 overflow-y-auto max-h-[calc(100vh-175px)]">
          {navGroups.map((group) => {
            if (!group.roles.includes(role)) return null;

            return (
              <div key={group.label} className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#697D71]">
                  {group.label}
                </div>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href || (item.matchPrefix !== '/crm/dashboard' && pathname.startsWith(item.matchPrefix));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 text-[13px] rounded-lg transition-all font-medium ${
                          isActive
                            ? 'bg-[#274433] text-[#FAF7F2] font-semibold shadow-sm'
                            : 'text-[#9EB0A4] hover:bg-[#1E3628] hover:text-[#FAF7F2]'
                        }`}
                      >
                        <item.icon className={`w-4 h-4 ${isActive ? 'text-[#FAF7F2]' : 'text-[#7D9385]'}`} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer User Profile */}
      <div className="p-4 border-t border-[#21382A] bg-[#122219]">
        <div className="mb-2">
          <p className="text-sm font-medium text-[#FAF7F2] truncate">{displayName}</p>
          <p className="text-xs text-[#7D9385]">{roleName}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs text-[#A3B5AA] hover:text-white transition-colors pt-1"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
