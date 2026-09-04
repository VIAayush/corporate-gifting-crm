import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "GIFFTER — Corporate Gifting Platform",
  description: "GIFFTER corporate gifting CRM from enquiry through fulfilment, invoicing, and payment.",
}

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children
}
