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

    // Desktop and mobile users → show the landing page (default behavior)
    return NextResponse.next();
}

export const config = {
    // Only run middleware on the root path
    matcher: ['/'],
};
