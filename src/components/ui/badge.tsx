import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "default",
  ...props
}: React.ComponentProps<"span"> & {
  tone?: "default" | "success" | "warn" | "danger" | "info" | "muted";
}) {
  const tones = {
    default: "bg-secondary text-secondary-foreground",
    success: "bg-emerald-100 text-emerald-900",
    warn: "bg-amber-100 text-amber-950",
    danger: "bg-red-100 text-red-900",
    info: "bg-sky-100 text-sky-950",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

export function statusTone(status: string): React.ComponentProps<typeof Badge>["tone"] {
  const s = status.toLowerCase();
  if (["active", "accepted", "paid", "delivered", "won", "completed", "hot", "client", "regular_client"].includes(s))
    return "success";
  if (["sent", "in_progress", "confirmed", "quoted", "warm", "partially_paid", "upcoming"].includes(s)) return "info";
  if (["draft", "created", "cold", "prospect"].includes(s)) return "muted";
  if (["overdue", "rejected", "cancelled", "lost", "missed", "discontinued", "expired"].includes(s)) return "danger";
  if (["dispatched", "unpaid"].includes(s)) return "warn";
  return "default";
}
