import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Middleware deshabilitado - SPA sin guards de autenticación
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
