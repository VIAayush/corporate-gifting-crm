import type { Metadata } from "next"
import type { ReactNode } from "react"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "GIFFTER — Corporate Gifting CRM",
  description: "Sign in to GIFFTER, the corporate gifting CRM.",
  applicationName: "GIFFTER",
}

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children
}
