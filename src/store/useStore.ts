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

type TabType = 'Home' | 'Rentals' | 'Chat' | 'Profile';
type StackType = 'AddItem' | 'ItemDetail' | 'EditProfile' | 'Wallet' | 'Notification' | 'ChatDetail' | 'HistoryDetail' | null;

interface AppState {
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

    // Navigation helpers
    navigateToDetail: (item: any) => void;
    openChat: (targetUser: any) => void;
    closeStack: () => void;
}

export const useStore = create<AppState>((set) => ({
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

    navigateToDetail: (item) => set({ selectedItem: item, currentStack: 'ItemDetail' }),
    openChat: (targetUser) => set({ chatUser: targetUser, currentStack: 'ChatDetail' }),
    closeStack: () => set({ currentStack: null, selectedItem: null, chatUser: null }),
}));
