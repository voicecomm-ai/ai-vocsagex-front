import { NextResponse } from 'next/server';

// 需要拦截的路由（需要登录才能访问）
const protectedRoutes = ['/main'];

// 白名单路由（无需登录即可访问，直接放行）
const whitelistRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/api', // API 路由
  '/chat',
];

// 静态资源路径前缀（直接放行）
const staticPathPrefixes = [
  '/_next/',
  '/static/',
  '/favicon.ico',
];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // 1. 检查是否为静态资源（文件扩展名或特定路径前缀）
  const isStaticResource = 
    /\.[a-zA-Z0-9]+$/.test(pathname) || 
    staticPathPrefixes.some(prefix => pathname.startsWith(prefix));
  
  if (isStaticResource) {
    return NextResponse.next();
  }

  // 2. 检查是否在白名单中
  const isWhitelisted = whitelistRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  if (isWhitelisted) {
    return NextResponse.next();
  }

  // 3. 获取登录状态
  const userToken = request.cookies.get('userToken')?.value;

  // 4. 处理根路径：已登录跳转到 /main，未登录跳转到 /login
  if (pathname === '/') {
    if (userToken) {
      return NextResponse.redirect(new URL('/main', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 5. 检查是否为受保护路由
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // 6. 未登录且访问受保护路由时重定向到登录页
  if (isProtectedRoute && !userToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 7. 其他情况直接放行
  return NextResponse.next();
}

// 配置中间件匹配规则
export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};