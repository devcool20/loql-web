import { create } from 'zustand';

interface AlertAction {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
}

interface AlertState {
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
    showCancel?: boolean;
    onConfirm?: () => void;
    onCancel?: () => void;
    actions?: AlertAction[];
}

type ThemeType = 'light' | 'dark';
type TabType = 'Home' | 'Rentals' | 'Chat' | 'Profile';
type StackType = 'AddItem' | 'ItemDetail' | 'EditProfile' | 'Wallet' | 'Notification' | 'ChatDetail' | 'HistoryDetail' | null;
type RentalsModeType = 'owned' | 'borrowing';
type LocationPermissionState = 'unknown' | 'granted' | 'denied' | 'prompt' | 'unavailable';
type GeofenceStatus = 'unknown' | 'inside' | 'outside';
type RefreshTarget = 'home' | 'rentals' | 'chat' | 'profile' | 'notifications';

interface GeofenceCoords {
    latitude: number;
    longitude: number;
    accuracyMeters?: number | null;
}

interface AppState {
    theme: ThemeType;
    toggleTheme: () => void;

    user: any | null;
    setUser: (user: any) => void;
    isLoading: boolean;
    setLoading: (loading: boolean) => void;

    isProfileComplete: boolean;
    setProfileComplete: (complete: boolean) => void;

    // Navigation
    currentTab: TabType;
    setCurrentTab: (tab: TabType) => void;
    currentStack: StackType;
    setCurrentStack: (stack: StackType) => void;
    rentalsMode: RentalsModeType;
    setRentalsMode: (mode: RentalsModeType) => void;

    // Selected data
    selectedItem: any | null;
    setSelectedItem: (item: any | null) => void;
    chatUser: any | null;
    setChatUser: (user: any | null) => void;
    historyType: 'rented' | 'for_rent';
    setHistoryType: (type: 'rented' | 'for_rent') => void;

    // Alert System
    alert: AlertState;
    showAlert: (title: string, message: string, type?: 'success' | 'error' | 'info', onConfirm?: () => void, showCancel?: boolean, actions?: AlertAction[]) => void;
    hideAlert: () => void;

    // Refresh Trigger
    refreshTrigger: number;
    refreshApp: () => void;
    refreshRequests: Record<RefreshTarget, number>;
    refreshScreen: (target: RefreshTarget) => void;

    // Screen data cache
    homeItems: any[];
    homeLastFetchedAt: number;
    homeIsHydrated: boolean;
    setHomeItems: (items: any[], fetchedAt?: number) => void;
    upsertHomeItem: (item: any) => void;
    removeHomeItem: (id: string) => void;

    rentalsData: {
        listings: any[];
        bookings: any[];
        offers: any[];
    };
    rentalsLastFetchedAt: number;
    rentalsIsHydrated: boolean;
    setRentalsData: (data: Partial<AppState['rentalsData']>, fetchedAt?: number) => void;
    markScreenStale: (target: RefreshTarget) => void;

    // Geofence State
    locationPermission: LocationPermissionState;
    currentCoords: GeofenceCoords | null;
    geofenceStatus: GeofenceStatus;
    distanceMeters: number | null;
    radiusMeters: number;
    geofenceSocietyName: string | null;
    setPermission: (permission: LocationPermissionState) => void;
    setCoords: (coords: GeofenceCoords | null) => void;
    refreshGeofence: (payload: {
        geofenceStatus: GeofenceStatus;
        distanceMeters: number | null;
        radiusMeters?: number;
        geofenceSocietyName?: string | null;
        locationPermission?: LocationPermissionState;
    }) => void;

    // Navigation helpers
    navigateToDetail: (item: any) => void;
    openChat: (targetUser: any) => void;
    closeStack: () => void;
}

const getInitialTheme = (): ThemeType => {
    if (typeof window !== 'undefined') {
        return (localStorage.getItem('loql-theme') as ThemeType) || 'light';
    }
    return 'light';
};

export const useStore = create<AppState>((set) => ({
    theme: getInitialTheme(),
    toggleTheme: () => set((state) => {
        const next = state.theme === 'light' ? 'dark' : 'light';
        if (typeof window !== 'undefined') localStorage.setItem('loql-theme', next);
        return { theme: next };
    }),

    user: null,
    setUser: (user) => set({ user }),
    isLoading: true,
    setLoading: (isLoading) => set({ isLoading }),

    isProfileComplete: false,
    setProfileComplete: (isProfileComplete) => set({ isProfileComplete }),

    // Navigation
    currentTab: 'Home',
    setCurrentTab: (currentTab) => set({ currentTab, currentStack: null }),
    currentStack: null,
    setCurrentStack: (currentStack) => set({ currentStack }),
    rentalsMode: 'owned',
    setRentalsMode: (rentalsMode) => set({ rentalsMode }),

    // Selected data
    selectedItem: null,
    setSelectedItem: (selectedItem) => set({ selectedItem }),
    chatUser: null,
    setChatUser: (chatUser) => set({ chatUser }),
    historyType: 'rented',
    setHistoryType: (historyType) => set({ historyType }),

    alert: { visible: false, title: '', message: '', type: 'info' },
    showAlert: (title, message, type = 'info', onConfirm, showCancel = false, actions) =>
        set({ alert: { visible: true, title, message, type, onConfirm, showCancel, actions } }),
    hideAlert: () =>
        set({ alert: { visible: false, title: '', message: '', type: 'info', onConfirm: undefined, actions: undefined } }),

    refreshTrigger: 0,
    refreshApp: () => set((state) => ({ refreshTrigger: state.refreshTrigger + 1 })),
    refreshRequests: { home: 0, rentals: 0, chat: 0, profile: 0, notifications: 0 },
    refreshScreen: (target) => set((state) => ({
        refreshRequests: {
            ...state.refreshRequests,
            [target]: state.refreshRequests[target] + 1,
        },
    })),

    homeItems: [],
    homeLastFetchedAt: 0,
    homeIsHydrated: false,
    setHomeItems: (homeItems, fetchedAt = Date.now()) => set({
        homeItems,
        homeLastFetchedAt: fetchedAt,
        homeIsHydrated: true,
    }),
    upsertHomeItem: (item) => set((state) => {
        if (!item?.id) return state;
        const exists = state.homeItems.some((current) => current.id === item.id);
        return {
            homeItems: exists
                ? state.homeItems.map((current) => current.id === item.id ? { ...current, ...item } : current)
                : [item, ...state.homeItems],
            homeIsHydrated: true,
        };
    }),
    removeHomeItem: (id) => set((state) => ({
        homeItems: state.homeItems.filter((item) => item.id !== id),
    })),

    rentalsData: {
        listings: [],
        bookings: [],
        offers: [],
    },
    rentalsLastFetchedAt: 0,
    rentalsIsHydrated: false,
    setRentalsData: (data, fetchedAt = Date.now()) => set((state) => ({
        rentalsData: {
            ...state.rentalsData,
            ...data,
        },
        rentalsLastFetchedAt: fetchedAt,
        rentalsIsHydrated: true,
    })),
    markScreenStale: (target) => set((state) => {
        if (target === 'home') return { homeLastFetchedAt: 0 };
        if (target === 'rentals') return { rentalsLastFetchedAt: 0 };
        return state;
    }),

    locationPermission: 'unknown',
    currentCoords: null,
    geofenceStatus: 'unknown',
    distanceMeters: null,
    radiusMeters: 500,
    geofenceSocietyName: null,
    setPermission: (locationPermission) => set({ locationPermission }),
    setCoords: (currentCoords) => set({ currentCoords }),
    refreshGeofence: (payload) => set((state) => ({
        geofenceStatus: payload.geofenceStatus,
        distanceMeters: payload.distanceMeters,
        radiusMeters: payload.radiusMeters ?? state.radiusMeters,
        geofenceSocietyName: payload.geofenceSocietyName ?? state.geofenceSocietyName,
        locationPermission: payload.locationPermission ?? state.locationPermission,
    })),

    navigateToDetail: (item) => set({ selectedItem: item, currentStack: 'ItemDetail' }),
    openChat: (targetUser) => set({ chatUser: targetUser, currentStack: 'ChatDetail' }),
    closeStack: () => set({ currentStack: null, selectedItem: null, chatUser: null }),
}));
