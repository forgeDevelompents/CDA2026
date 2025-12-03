import { NextResponse, type NextRequest } from "next/server"
import { parseSession } from "@/lib/auth"

export async function updateSession(request: NextRequest) {
  const sessionUser = parseSession(request.cookies.get("simple_session")?.value)

  // Redirect to login if trying to access protected routes without authentication
  if (
    !sessionUser &&
    (request.nextUrl.pathname.startsWith("/dashboard") ||
      request.nextUrl.pathname.startsWith("/gastos") ||
      request.nextUrl.pathname.startsWith("/calendario") ||
      request.nextUrl.pathname.startsWith("/cargos") ||
      request.nextUrl.pathname.startsWith("/normas") ||
      request.nextUrl.pathname.startsWith("/votaciones") ||
      request.nextUrl.pathname.startsWith("/documentos") ||
      request.nextUrl.pathname.startsWith("/estadisticas") ||
      request.nextUrl.pathname.startsWith("/asistencias"))
  ) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  // Redirect to dashboard if logged in and trying to access login
  if (sessionUser && request.nextUrl.pathname === "/auth/login") {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}
