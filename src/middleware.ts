import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Mobile user-agent patterns
const MOBILE_REGEX = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Only intercept the root path "/"
    if (pathname !== '/') {
        return NextResponse.next();
    }

    const userAgent = request.headers.get('user-agent') || '';
    const isMobile = MOBILE_REGEX.test(userAgent);

    if (isMobile) {
        // Mobile users → redirect to the app experience
        const url = request.nextUrl.clone();
        url.pathname = '/app';
        return NextResponse.redirect(url);
    }

    // Desktop users → show the landing page (default behavior)
    return NextResponse.next();
}

export const config = {
    // Only run middleware on the root path
    matcher: ['/'],
};
