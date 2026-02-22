const CACHE_PREFIX = 'ss_cache_';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

export async function cacheSet<T>(key: string, data: T, ttlMs = 5 * 60 * 1000): Promise<void> {
    try {
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            ttl: ttlMs,
        };
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch (e) {
        console.warn('[Cache] Write failed for key:', key, e);
    }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
    try {
        const raw = localStorage.getItem(CACHE_PREFIX + key);
        if (!raw) return null;

        const entry: CacheEntry<T> = JSON.parse(raw);
        const age = Date.now() - entry.timestamp;

        if (age > entry.ttl) {
            localStorage.removeItem(CACHE_PREFIX + key);
            return null;
        }

        return entry.data;
    } catch (e) {
        console.warn('[Cache] Read failed for key:', key, e);
        return null;
    }
}

export async function cacheGetStale<T>(key: string): Promise<{ data: T | null; isStale: boolean }> {
    try {
        const raw = localStorage.getItem(CACHE_PREFIX + key);
        if (!raw) return { data: null, isStale: false };

        const entry: CacheEntry<T> = JSON.parse(raw);
        const age = Date.now() - entry.timestamp;
        const isStale = age > entry.ttl;

        return { data: entry.data, isStale };
    } catch (e) {
        return { data: null, isStale: false };
    }
}

export async function cacheInvalidate(key: string): Promise<void> {
    try {
        localStorage.removeItem(CACHE_PREFIX + key);
    } catch (e) {
        console.warn('[Cache] Invalidate failed for key:', key, e);
    }
}

export async function cacheInvalidatePrefix(prefix: string): Promise<void> {
    try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith(CACHE_PREFIX + prefix)) {
                keysToRemove.push(k);
            }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {
        console.warn('[Cache] Prefix invalidate failed:', prefix, e);
    }
}

export const CACHE_KEYS = {
    homeItems: (societyId: string) => `home_items_${societyId}`,
    listings: (userId: string) => `listings_${userId}`,
    bookings: (userId: string) => `bookings_${userId}`,
    offers: (userId: string) => `offers_${userId}`,
    notifications: (userId: string) => `notifications_${userId}`,
    profile: (userId: string) => `profile_${userId}`,
    societyName: (societyId: string) => `society_name_${societyId}`,
};

export const TTL = {
    SHORT: 2 * 60 * 1000,
    MEDIUM: 5 * 60 * 1000,
    LONG: 30 * 60 * 1000,
};
