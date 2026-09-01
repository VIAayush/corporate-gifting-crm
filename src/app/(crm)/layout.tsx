import Link from 'next/link';

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 bg-white border-r p-4 overflow-y-auto">
        <h2 className="text-xl font-bold text-[hsl(var(--primary))] mb-6">GIFFTER CRM</h2>
        <nav className="space-y-1">
          <Link href="/dashboard" className="block py-2 text-sm text-gray-700 hover:text-[hsl(var(--primary))]">Dashboard</Link>
          <div className="pt-4 pb-2 text-xs font-bold text-gray-400">CRM</div>
          <Link href="/companies" className="block py-1 text-sm text-gray-700 hover:text-[hsl(var(--primary))]">Companies</Link>
          <Link href="/contacts" className="block py-1 text-sm text-gray-700 hover:text-[hsl(var(--primary))]">Contacts</Link>
          <Link href="/leads" className="block py-1 text-sm text-gray-700 hover:text-[hsl(var(--primary))]">Leads</Link>
          <Link href="/requirements" className="block py-1 text-sm text-gray-700 hover:text-[hsl(var(--primary))]">Requirements</Link>
          
          <div className="pt-4 pb-2 text-xs font-bold text-gray-400">SALES</div>
          <Link href="/quotations" className="block py-1 text-sm text-gray-700 hover:text-[hsl(var(--primary))]">Quotations</Link>
          <Link href="/orders" className="block py-1 text-sm text-gray-700 hover:text-[hsl(var(--primary))]">Orders</Link>
          
          <div className="pt-4 pb-2 text-xs font-bold text-gray-400">CATALOGUE</div>
          <Link href="/products" className="block py-1 text-sm text-gray-700 hover:text-[hsl(var(--primary))]">Products</Link>
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto bg-[hsl(var(--background))]">
        {children}
      </main>
    </div>
  )
}
