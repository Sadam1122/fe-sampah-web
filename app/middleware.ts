import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtDecode } from "jwt-decode"

interface DecodedToken {
  userId: string
  role: "superadmin" | "admin" | "staff"
  exp: number
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value
  const path = request.nextUrl.pathname

  // Jika tidak ada token, redirect ke login, kecuali sedang di halaman login
  if (!token && path !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (token) {
    try {
      const decodedToken = jwtDecode(token) as DecodedToken

      // Cek apakah token sudah expired
      if (decodedToken.exp * 1000 < Date.now()) {
        const response = NextResponse.redirect(new URL("/login", request.url))
        response.cookies.delete("token") // Hapus token dari cookies jika expired
        return response
      }

      // Jika pengguna sudah login, jangan izinkan akses ke /login
      if (path === "/login") {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
    } catch (error) {
      console.error("Token decoding failed:", error)
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
}
