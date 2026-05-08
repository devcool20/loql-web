const SPLASH_SEEN_KEY = 'loql:splash-seen:v1';

export function hasSeenSessionSplash() {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(SPLASH_SEEN_KEY) === '1';
}

export function markSessionSplashSeen() {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(SPLASH_SEEN_KEY, '1');
}
