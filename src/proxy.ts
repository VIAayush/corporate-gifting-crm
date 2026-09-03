import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { isSafeNext } from "@/lib/safe-next"

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname, search } = request.nextUrl

  if (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return supabaseResponse
  }

  if (pathname.startsWith("/login")) {
    if (user) {
      const next = request.nextUrl.searchParams.get("next")
      const dest = isSafeNext(next) ? next : "/"
      return NextResponse.redirect(new URL(dest, request.url))
    }
    return supabaseResponse
  }

  if (!user) {
    const login = new URL("/login", request.url)
    const intended = `${pathname}${search}`
    if (isSafeNext(intended)) login.searchParams.set("next", intended)
    return NextResponse.redirect(login)
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
