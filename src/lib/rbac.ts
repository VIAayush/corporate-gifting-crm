export type AppRole = "admin" | "sales" | "operations" | "accounts" | "management";

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: AppRole;
  is_active: boolean;
};

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Admin",
  sales: "Sales",
  operations: "Operations",
  accounts: "Accounts",
  management: "Management",
};

export type NavItem = {
  href: string;
  label: string;
  roles: AppRole[];
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

const all: AppRole[] = ["admin", "sales", "operations", "accounts", "management"];

export const NAV: NavGroup[] = [
  {
    title: "Workspace",
    items: [{ href: "/dashboard", label: "Dashboard", roles: all }],
  },
  {
    title: "CRM",
    items: [
      { href: "/companies", label: "Companies", roles: ["admin", "sales", "management"] },
      { href: "/contacts", label: "Contacts", roles: ["admin", "sales", "management"] },
      { href: "/leads", label: "Leads", roles: ["admin", "sales", "management"] },
      { href: "/requirements", label: "Requirements", roles: ["admin", "sales", "operations", "management"] },
    ],
  },
  {
    title: "Sales",
    items: [
      { href: "/products", label: "Products", roles: ["admin", "sales", "operations", "management"] },
      { href: "/mockups", label: "Mockups", roles: ["admin", "sales", "operations"] },
      { href: "/quotations", label: "Quotations", roles: ["admin", "sales", "operations", "accounts", "management"] },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/orders", label: "Orders", roles: all },
      { href: "/suppliers", label: "Suppliers", roles: ["admin", "operations", "sales", "management"] },
      { href: "/printing-vendors", label: "Printing vendors", roles: ["admin", "operations", "management"] },
      { href: "/couriers", label: "Courier partners", roles: ["admin", "operations", "management"] },
    ],
  },
  {
    title: "Finance",
    items: [
      { href: "/invoices", label: "Invoices", roles: ["admin", "accounts", "management"] },
      { href: "/payments", label: "Payments", roles: ["admin", "accounts", "management"] },
      { href: "/receivables", label: "Receivables", roles: ["admin", "accounts", "management"] },
    ],
  },
  {
    title: "Management",
    items: [
      { href: "/reports", label: "Reports", roles: ["admin", "management"] },
      { href: "/activities", label: "Activities", roles: ["admin", "sales", "operations", "management"] },
    ],
  },
  {
    title: "Admin",
    items: [
      { href: "/team", label: "Team", roles: ["admin"] },
      { href: "/settings", label: "Settings", roles: ["admin"] },
      { href: "/audit", label: "Audit log", roles: ["admin", "management"] },
    ],
  },
];

export function canAccess(role: AppRole, href: string) {
  return NAV.some((g) => g.items.some((i) => i.href === href && i.roles.includes(role)));
}

export function navFor(role: AppRole) {
  return NAV.map((g) => ({
    ...g,
    items: g.items.filter((i) => i.roles.includes(role)),
  })).filter((g) => g.items.length > 0);
}

export function canWriteCrm(role: AppRole) {
  return role === "admin" || role === "sales";
}
export function canWriteOps(role: AppRole) {
  return role === "admin" || role === "operations";
}
export function canWriteFinance(role: AppRole) {
  return role === "admin" || role === "accounts";
}
export function canWriteSales(role: AppRole) {
  return role === "admin" || role === "sales";
}
