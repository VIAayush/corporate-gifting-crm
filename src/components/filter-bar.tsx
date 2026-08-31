import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";

export function FilterBar({
  action,
  children,
  q,
}: {
  action: string;
  q?: string;
  children?: React.ReactNode;
}) {
  return (
    <form action={action} className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
      <Input name="q" placeholder="Search…" defaultValue={q} className="sm:max-w-xs" />
      {children}
      <Button type="submit" variant="secondary">
        Apply
      </Button>
    </form>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  href,
}: {
  page: number;
  pageSize: number;
  total: number;
  href: (p: number) => string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <span className="text-muted-foreground">
        {total} records · page {page} of {pages}
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link className="rounded-md border border-border px-2 py-1" href={href(page - 1)}>
            Previous
          </Link>
        ) : null}
        {page < pages ? (
          <Link className="rounded-md border border-border px-2 py-1" href={href(page + 1)}>
            Next
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export { Select };
