
const SUPABASE_DOMAIN = 'jusbswsbucsvmmdmxthn.supabase.co';
const PROXY_DOMAIN = 'loql-proxy.sharmadivyanshu265.workers.dev';

/**
 * Wraps a Supabase image URL to use a Cloudflare proxy if the user is in a blocked region.
 */
export const getSafeImageUrl = (url: string | null | undefined): string => {
    if (!url) return '';

    const trimmed = url.trim();
    if (!trimmed) return '';

    if (trimmed.startsWith('data:') || trimmed.startsWith('blob:') || trimmed.startsWith('/')) {
        return trimmed;
    }

    if (trimmed.includes(SUPABASE_DOMAIN)) {
        return trimmed.replace(SUPABASE_DOMAIN, PROXY_DOMAIN);
    }

    return trimmed;
};
