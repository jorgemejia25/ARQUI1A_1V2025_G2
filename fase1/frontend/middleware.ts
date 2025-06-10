import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Solo manejar redirección desde la raíz
  if (request.nextUrl.pathname === "/") {
    // Siempre redirigir a login desde la raíz
    // El componente React se encargará de verificar autenticación y redirección
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Solo coincidir con la ruta raíz
    "/",
  ],
};
