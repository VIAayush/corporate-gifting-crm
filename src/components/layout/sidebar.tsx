'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Building2, Users, TrendingUp, ClipboardList, Activity,
  Package, Image as ImageIcon, FlaskConical, FileText, ShoppingBag,
  Layers, Truck, Printer, Package2, Receipt, ArrowDownToLine, ArrowUpFromLine,
  CreditCard, Target, BarChart3, CheckSquare, Megaphone, Star, UserCog, Settings, LogOut
} from 'lucide-react';
import { signOut } from '@/app/login/actions';
import { CompanyAvatar } from '../ui/avatar';

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
    label: 'OVERVIEW',
    roles: ['admin', 'sales', 'operations', 'accounts', 'management'],
    items: [
      { label: 'Dashboard', href: '/crm/dashboard', icon: LayoutDashboard }
    ]
  },
  {
    label: 'CRM',
    roles: ['admin', 'sales'],
    items: [
      { label: 'Companies', href: '/crm/companies', icon: Building2 },
      { label: 'Contacts', href: '/crm/contacts', icon: Users },
      { label: 'Leads', href: '/crm/leads', icon: TrendingUp },
      { label: 'Requirements', href: '/crm/requirements', icon: ClipboardList },
      { label: 'Activities', href: '/crm/activities', icon: Activity }
    ]
  },
  {
    label: 'CATALOGUE',
    roles: ['admin', 'sales'],
    items: [
      { label: 'Products', href: '/crm/products', icon: Package },
      { label: 'Mockups', href: '/crm/mockups', icon: ImageIcon },
      { label: 'Samples', href: '/crm/samples', icon: FlaskConical }
    ]
  },
  {
    label: 'SALES',
    roles: ['admin', 'sales', 'operations'],
    items: [
      { label: 'Quotations', href: '/crm/quotations', icon: FileText, roles: ['admin', 'sales'] },
      { label: 'Orders', href: '/crm/orders', icon: ShoppingBag }
    ]
  },
  {
    label: 'OPERATIONS',
    roles: ['admin', 'operations'],
    items: [
      { label: 'Order Management', href: '/crm/order-management', icon: Layers },
      { label: 'Suppliers', href: '/crm/suppliers', icon: Truck },
      { label: 'Printing Vendors', href: '/crm/printing-vendors', icon: Printer },
      { label: 'Courier Partners', href: '/crm/courier-partners', icon: Package2 }
    ]
  },
  {
    label: 'FINANCE',
    roles: ['admin', 'accounts'],
    items: [
      { label: 'Invoices', href: '/crm/invoices', icon: Receipt },
      { label: 'Receivables', href: '/crm/receivables', icon: ArrowDownToLine },
      { label: 'Payables', href: '/crm/payables', icon: ArrowUpFromLine },
      { label: 'Payments', href: '/crm/payments', icon: CreditCard }
    ]
  },
  {
    label: 'MANAGEMENT',
    roles: ['admin', 'management'],
    items: [
      { label: 'Goals', href: '/crm/goals', icon: Target },
      { label: 'Reports', href: '/crm/reports', icon: BarChart3 },
      { label: 'Tasks', href: '/crm/tasks', icon: CheckSquare },
      { label: 'Announcements', href: '/crm/announcements', icon: Megaphone },
      { label: 'Reviews', href: '/crm/reviews', icon: Star },
      { label: 'Team', href: '/crm/team', icon: UserCog }
    ]
  },
  {
    label: 'ADMIN',
    roles: ['admin'],
    items: [
      { label: 'Settings', href: '/crm/settings', icon: Settings }
    ]
  }
];

export function Sidebar({ role, user }: SidebarProps) {
  const pathname = usePathname();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="flex flex-col w-64 h-screen bg-white border-r border-gray-200">
      <div className="flex items-center h-16 px-6 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2 text-primary">
          <div className="w-8 h-8 bg-primary text-white rounded font-bold flex items-center justify-center text-xl">
            G
          </div>
          <span className="font-bold text-xl tracking-tight">GIFFTER</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        {navGroups.map((group) => {
          if (!group.roles.includes(role)) return null;

          const visibleItems = group.items.filter(item => !item.roles || item.roles.includes(role));
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.label} className="mb-6 px-4">
              <h3 className="px-2 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {group.label}
              </h3>
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive 
                          ? 'bg-primary/10 text-primary' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {user && (
        <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <CompanyAvatar name={user.name || 'User'} logoPath={user.avatar_url} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate capitalize">{role.replace('_', ' ')}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
