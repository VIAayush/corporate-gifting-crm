import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"
import { NavHistoryTracker } from "@/components/ui/nav-history"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "GIFFTER — Corporate Gifting CRM",
  description: "B2B corporate gifting CRM/ERP from first enquiry through fulfilment, invoicing, and payment.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="h-full antialiased">
        <NavHistoryTracker />
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  )
}
