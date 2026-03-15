// middleware.js
// YOU360 — Proteção de rotas /admin/* via JWT no cookie
// Coloque este arquivo na raiz do projeto

import { NextResponse } from 'next/server'

export function middleware(req) {
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')
  const isLoginPage  = req.nextUrl.pathname === '/admin/login'

  // Lê token do cookie (definido pelo login.js após autenticar)
  const token = req.cookies.get('you360_token')?.value

  if (isAdminRoute && !isLoginPage && !token) {
    return NextResponse.redirect(new URL('/admin/login', req.url))
  }

  if (isLoginPage && token) {
    return NextResponse.redirect(new URL('/admin', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
