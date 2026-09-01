import Link from 'next/link';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-[hsl(var(--primary))]">GIFFTER Portal</h2>
        <nav className="flex gap-4">
          <Link href="/catalogue" className="text-sm font-medium">Catalogue</Link>
          <Link href="/requirements" className="text-sm font-medium">Requirements</Link>
          <Link href="/orders" className="text-sm font-medium">Orders</Link>
        </nav>
      </header>
      <main className="max-w-6xl mx-auto p-6">
        {children}
      </main>
    </div>
  )
}
