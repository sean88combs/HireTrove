import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { checkRateLimit, createIPHash, createUAHash } from '@/lib/rateLimiter';
import { prisma } from '@/lib/database';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle public bias checker rate limiting
  if (pathname === '/api/public/bias-check') {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'anonymous';
    const userAgent = request.headers.get('user-agent') || '';
    const ipHash = createIPHash(ip);
    const uaHash = createUAHash(userAgent);

    // Rate limit: 5 requests per hour per IP
    const rateLimitResult = await checkRateLimit(ipHash, 5, 60 * 60 * 1000);
    
    if (!rateLimitResult.success) {
      // Log rate limit event
      try {
        await prisma.guestLog.create({
          data: {
            ip_hash: ipHash,
            ua_hash: uaHash,
            referer: request.headers.get('referer'),
            event: 'RATE_LIMITED',
            request_id: crypto.randomUUID()
          }
        });
      } catch (error) {
        console.error('Failed to log rate limit event:', error);
      }

      return NextResponse.json(
        { 
          error: 'Rate limit exceeded', 
          resetTime: rateLimitResult.resetTime,
          message: 'You have exceeded the request limit. Please try again later.'
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type'
          }
        }
      );
    }

    // Add rate limit headers to successful requests
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', '5');
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;
  }

  // Protect authenticated API routes
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/public/') && !pathname.startsWith('/api/auth/')) {
    try {
      await getUserFromRequest(request);
    } catch (error) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
  }

  // Protect authenticated pages
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/jobs') || pathname.startsWith('/candidates')) {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
    '/jobs/:path*',
    '/candidates/:path*',
    '/interviews/:path*',
    '/templates/:path*'
  ]
};