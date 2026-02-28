
const SUPABASE_DOMAIN = 'jusbswsbucsvmmdmxthn.supabase.co';
const PROXY_DOMAIN = 'loql-proxy.sharmadivyanshu265.workers.dev';

/**
 * Wraps a Supabase image URL to use a Cloudflare proxy if the user is in a blocked region.
 */
export const getSafeImageUrl = (url: string | null | undefined): string => {
    if (!url) return '';

    if (url.includes(SUPABASE_DOMAIN)) {
        return url.replace(SUPABASE_DOMAIN, PROXY_DOMAIN);
    }

    return url;
};
