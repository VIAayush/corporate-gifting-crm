import { login } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#efe6d4,_#f7f3ea_40%,_#ece7dc)]">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-4 py-12 lg:flex-row lg:items-center lg:gap-16">
        <div className="mb-10 max-w-md lg:mb-0">
          <div className="font-heading text-4xl tracking-tight text-foreground">Oaklane</div>
          <p className="mt-2 text-sm uppercase tracking-[0.18em] text-muted-foreground">Corporate gifting operations</p>
          <p className="mt-6 text-lg leading-relaxed text-foreground/80">
            One workspace from the first enquiry to a delivered, invoiced, and paid order.
          </p>
        </div>
        <form action={login} className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h1 className="font-heading text-2xl">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">Use a demo account below, or your own team login.</p>
          {sp.error ? <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{sp.error}</p> : null}
          <input type="hidden" name="next" value={sp.next || "/dashboard"} />
          <div className="mt-5 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required defaultValue="admin@oaklane.demo" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required defaultValue="Oaklane-Demo-2026!" />
            </div>
            <Button className="w-full" type="submit">
              Continue
            </Button>
          </div>
          <div className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">
            <div className="font-medium text-foreground">Demo access</div>
            <p className="mt-1">Password for all accounts: Oaklane-Demo-2026!</p>
            <ul className="mt-2 space-y-1">
              <li>admin@oaklane.demo — full access</li>
              <li>sales@oaklane.demo — CRM and quotations</li>
              <li>ops@oaklane.demo — orders and vendors</li>
              <li>accounts@oaklane.demo — invoices and payments</li>
              <li>management@oaklane.demo — dashboard and reports</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  );
}
