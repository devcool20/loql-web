import { supabase } from '@/lib/supabase';

export type LocationPermissionState = 'unknown' | 'granted' | 'denied' | 'prompt' | 'unavailable';

export interface GeofenceCoords {
  latitude: number;
  longitude: number;
  accuracyMeters?: number | null;
}

export interface GeofenceAccessResult {
  allowed: boolean;
  distance_meters: number | null;
  radius_meters: number;
  society_id: string | null;
  society_name: string | null;
}

export interface GeofencedItemResult {
  id: string;
  [key: string]: unknown;
}

export interface GeofencedOfferResult {
  id: string;
  [key: string]: unknown;
}

type GeofenceAssertResult = {
  permission: LocationPermissionState;
  coords: GeofenceCoords;
  access: GeofenceAccessResult;
};

const LOCATION_ERROR_MESSAGE = 'Location required for secure neighborhood access.';
const OUTSIDE_ERROR_MESSAGE = "You are outside your society's 500m verified zone.";
const GEOFENCE_CACHE_MS = 15000;

const geofenceAssertCache = new Map<string, { at: number; value: GeofenceAssertResult }>();
const inFlightGeofenceAssert = new Map<string, Promise<GeofenceAssertResult>>();

const normalizePermission = (state?: string): LocationPermissionState => {
  if (state === 'granted' || state === 'denied' || state === 'prompt') return state;
  return 'unknown';
};

const getSingleRow = <T>(value: T | T[] | null): T | null => {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
};

const getAccuracyMeters = (coords: GeofenceCoords) => {
  return Number.isFinite(coords.accuracyMeters) ? Math.max(coords.accuracyMeters ?? 0, 0) : 0;
};

const isRpcSignatureMismatch = (error: { code?: string; message?: string } | null) => {
  if (!error) return false;
  const message = error.message?.toLowerCase() || '';
  return error.code === 'PGRST202' || message.includes('could not find the function') || message.includes('schema cache');
};

export const getLocationPermissionState = async (): Promise<LocationPermissionState> => {
  if (typeof window === 'undefined' || !navigator.geolocation) return 'unavailable';

  try {
    if ('permissions' in navigator && navigator.permissions?.query) {
      const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      return normalizePermission(permission.state);
    }
  } catch {
    // Ignore and fallback to runtime request.
  }

  return 'prompt';
};

export const requestCurrentLocation = (): Promise<GeofenceCoords> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      reject(new Error(LOCATION_ERROR_MESSAGE));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null,
        }),
      () => reject(new Error(LOCATION_ERROR_MESSAGE)),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  });
};

export const checkGeofenceAccess = async (userId: string, coords: GeofenceCoords): Promise<GeofenceAccessResult> => {
  let result = await supabase.rpc('check_geofence_access', {
    p_user_id: userId,
    p_lat: coords.latitude,
    p_lng: coords.longitude,
    p_accuracy_meters: getAccuracyMeters(coords),
  });

  if (result.error && isRpcSignatureMismatch(result.error)) {
    result = await supabase.rpc('check_geofence_access', {
      p_user_id: userId,
      p_lat: coords.latitude,
      p_lng: coords.longitude,
    });
  }

  if (result.error) {
    throw new Error(result.error.message || 'Unable to verify society geofence.');
  }

  const row = getSingleRow<GeofenceAccessResult>(result.data);
  if (!row) throw new Error('Unable to verify society geofence.');
  return row;
};

export const assertGeofenceAllowed = async (
  userId: string,
  opts?: { force?: boolean },
): Promise<GeofenceAssertResult> => {
  const force = !!opts?.force;
  const cached = geofenceAssertCache.get(userId);
  if (!force && cached && Date.now() - cached.at < GEOFENCE_CACHE_MS) {
    return cached.value;
  }

  const running = inFlightGeofenceAssert.get(userId);
  if (!force && running) {
    return running;
  }

  const assertionPromise = (async () => {
    const permission = await getLocationPermissionState();
    if (permission === 'denied' || permission === 'unavailable') throw new Error(LOCATION_ERROR_MESSAGE);

    const coords = await requestCurrentLocation();
    const access = await checkGeofenceAccess(userId, coords);
    if (!access.allowed) throw new Error(OUTSIDE_ERROR_MESSAGE);

    const value: GeofenceAssertResult = { permission: 'granted', coords, access };
    geofenceAssertCache.set(userId, { at: Date.now(), value });
    return value;
  })();

  inFlightGeofenceAssert.set(userId, assertionPromise);

  try {
    return await assertionPromise;
  } finally {
    inFlightGeofenceAssert.delete(userId);
  }
};

export const fetchFeedItemsGeofenced = async (userId: string, coords: GeofenceCoords) => {
  let result = await supabase.rpc('get_feed_items_geofenced', {
    p_user_id: userId,
    p_lat: coords.latitude,
    p_lng: coords.longitude,
    p_accuracy_meters: getAccuracyMeters(coords),
  });

  if (result.error && isRpcSignatureMismatch(result.error)) {
    result = await supabase.rpc('get_feed_items_geofenced', {
      p_user_id: userId,
      p_lat: coords.latitude,
      p_lng: coords.longitude,
    });
  }

  if (result.error) throw new Error(result.error.message || 'Unable to load geofenced feed.');
  return (result.data || []) as unknown[];
};

export const createItemGeofenced = async (params: {
  userId: string;
  title: string;
  description?: string;
  dailyRate: number;
  category: string;
  images: string[];
  marketPrice?: number | null;
  coords: GeofenceCoords;
}) => {
  let result = await supabase.rpc('create_item_geofenced', {
    p_owner_id: params.userId,
    p_title: params.title,
    p_description: params.description || '',
    p_daily_rate: params.dailyRate,
    p_category: params.category,
    p_images: params.images,
    p_market_price: params.marketPrice ?? null,
    p_lat: params.coords.latitude,
    p_lng: params.coords.longitude,
    p_accuracy_meters: getAccuracyMeters(params.coords),
  });

  if (result.error && isRpcSignatureMismatch(result.error)) {
    result = await supabase.rpc('create_item_geofenced', {
      p_owner_id: params.userId,
      p_title: params.title,
      p_description: params.description || '',
      p_daily_rate: params.dailyRate,
      p_category: params.category,
      p_images: params.images,
      p_market_price: params.marketPrice ?? null,
      p_lat: params.coords.latitude,
      p_lng: params.coords.longitude,
    });
  }

  if (result.error) throw new Error(result.error.message || 'Unable to create item inside geofence.');
  return getSingleRow<GeofencedItemResult>(result.data);
};

export const createOfferGeofenced = async (params: {
  senderId: string;
  receiverId: string;
  itemId: string;
  offeredPrice: number;
  durationHours: number;
  coords: GeofenceCoords;
}) => {
  let result = await supabase.rpc('create_offer_geofenced', {
    p_sender_id: params.senderId,
    p_receiver_id: params.receiverId,
    p_item_id: params.itemId,
    p_offered_price: params.offeredPrice,
    p_duration_hours: params.durationHours,
    p_lat: params.coords.latitude,
    p_lng: params.coords.longitude,
    p_accuracy_meters: getAccuracyMeters(params.coords),
  });

  if (result.error && isRpcSignatureMismatch(result.error)) {
    result = await supabase.rpc('create_offer_geofenced', {
      p_sender_id: params.senderId,
      p_receiver_id: params.receiverId,
      p_item_id: params.itemId,
      p_offered_price: params.offeredPrice,
      p_duration_hours: params.durationHours,
      p_lat: params.coords.latitude,
      p_lng: params.coords.longitude,
    });
  }

  if (result.error) throw new Error(result.error.message || 'Unable to create offer outside geofence.');
  return getSingleRow<GeofencedOfferResult>(result.data);
};

export const GEOFENCE_MESSAGES = {
  permissionRequired: LOCATION_ERROR_MESSAGE,
  outsideFence: OUTSIDE_ERROR_MESSAGE,
};
