import { supabase } from './supabase';

export const subscribeToNotifications = (userId: string, onNotification: (notification: any) => void) => {
    if (!userId) return null;
    const channel = supabase
        .channel('user_notifications')
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
        }, (payload) => {
            onNotification(payload.new);
        })
        .subscribe();

    return channel;
};

export const fetchUnreadCount = async (userId: string): Promise<number> => {
    const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

    return count || 0;
};

export const markAsRead = async (notificationIds: string[]) => {
    if (notificationIds.length === 0) return;
    await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', notificationIds);
};

export const markAsActioned = async (notificationId: string) => {
    await supabase
        .from('notifications')
        .update({ is_actioned: true })
        .eq('id', notificationId);
};

export const createNotification = async (notif: {
    user_id: string;
    title: string;
    message: string;
    type: string;
    related_user_id?: string;
    related_rental_id?: string;
    action_buttons?: string[];
}) => {
    const { error } = await supabase.from('notifications').insert(notif);
    if (error) console.error('Error creating notification:', error);
};
