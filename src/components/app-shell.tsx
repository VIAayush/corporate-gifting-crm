import Link from "next/link";
import { LogOut, Menu } from "lucide-react";
import { navFor, ROLE_LABELS, type Profile } from "@/lib/rbac";
import { logout } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

export function AppShell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const groups = navFor(profile.role);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
        <div className="px-5 py-5">
          <Link href="/dashboard" className="block">
            <div className="font-heading text-xl tracking-tight text-sidebar-primary-foreground">Oaklane</div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-sidebar-foreground/70">Gift operations</div>
          </Link>
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-6">
          {groups.map((g) => (
            <div key={g.title}>
              <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/55">
                {g.title}
              </div>
              <div className="space-y-0.5">
                {g.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-4">
          <div className="text-sm font-medium">{profile.full_name}</div>
          <div className="text-xs text-sidebar-foreground/70">{ROLE_LABELS[profile.role]}</div>
          <form action={logout}>
            <Button variant="ghost" size="sm" className="mt-2 w-full justify-start text-sidebar-foreground">
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </form>
        </div>
      </aside>
      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center gap-2 lg:hidden">
            <Menu className="h-5 w-5" />
            <span className="font-heading text-lg">Oaklane</span>
          </div>
          <div className="hidden text-sm text-muted-foreground lg:block">
            Corporate gifting, from enquiry to payment
          </div>
          <div className="text-xs text-muted-foreground">{profile.email}</div>
        </header>
        <div className="lg:hidden overflow-x-auto border-b border-border bg-card px-3 py-2">
          <div className="flex gap-2">
            {groups.flatMap((g) => g.items).map((i) => (
              <Link key={i.href} href={i.href} className="whitespace-nowrap rounded-full border border-border px-3 py-1 text-xs">
                {i.label}
              </Link>
            ))}
          </div>
        </div>
        <main className="px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
