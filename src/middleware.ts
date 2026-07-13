import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname
    
    // Auto-login redirect: If user is already logged in and visits the login page
    if (path === "/") {
      if (token) {
        if (token.role === "ADMIN") return NextResponse.redirect(new URL("/admin", req.url))
        if (token.role === "DDAPL") return NextResponse.redirect(new URL("/ddapl", req.url))
        if (token.role === "CUSTOMER") return NextResponse.redirect(new URL("/customer", req.url))
      }
      return NextResponse.next()
    }
    
    // Public routes that don't need authentication
    if (path.startsWith("/api/auth") || path.startsWith("/api/public")) {
      return NextResponse.next()
    }

    // If no token exists and they are trying to access a protected route, send them to login
    if (!token) {
      if (path.startsWith("/api")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      return NextResponse.redirect(new URL("/", req.url))
    }

    // Role-based protection
    
    // Admin routes
    if (path.startsWith("/admin") && token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url))
    }
    
    // DDAPL routes
    if (path.startsWith("/ddapl") && token.role !== "DDAPL" && token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url))
    }
    
    // Customer routes
    if (path.startsWith("/customer") && token.role !== "CUSTOMER" && token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      // By returning true here, we ensure our middleware function above always runs
      // so we can handle custom routing logic based on roles explicitly.
      authorized: () => true
    },
  }
)

export const config = {
  matcher: ["/", "/admin/:path*", "/ddapl/:path*", "/customer/:path*", "/api/:path*"]
}
