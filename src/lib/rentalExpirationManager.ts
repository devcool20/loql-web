import { supabase } from './supabase';
import { createNotification } from './notificationManager';

export const checkExpiredRentals = async () => {
    try {
        const now = new Date().toISOString();

        const { data: expiredRentals, error } = await supabase
            .from('rentals')
            .select('*, items(*)')
            .eq('status', 'active')
            .lt('end_time', now);

        if (error) throw error;

        if (!expiredRentals || expiredRentals.length === 0) {
            return;
        }

        console.log(`Found ${expiredRentals.length} expired rentals to process`);

        for (const rental of expiredRentals) {
            await handleExpiredRental(rental);
        }
    } catch (error) {
        console.error('Error checking expired rentals:', error);
    }
};

const handleExpiredRental = async (rental: any) => {
    try {
        console.log(`Processing expired rental ${rental.id} for item ${rental.item_id}`);

        const { error: rentalError } = await supabase
            .from('rentals')
            .update({ status: 'completed' })
            .eq('id', rental.id);

        if (rentalError) throw rentalError;

        const { error: itemError } = await supabase
            .from('items')
            .update({ status: 'available' })
            .eq('id', rental.item_id);

        if (itemError) throw itemError;

        await createNotification({
            user_id: rental.owner_id,
            title: 'Rental Period Ended',
            message: `The rental period for "${rental.items?.title}" has ended. Please collect your item from the renter.`,
            type: 'rental_expired_owner',
            related_user_id: rental.renter_id,
            related_rental_id: rental.id,
        });

        await createNotification({
            user_id: rental.renter_id,
            title: 'Rental Period Ended',
            message: `Your rental period for "${rental.items?.title}" has ended. Please return the item or extend the rental.`,
            type: 'rental_expired_renter',
            related_user_id: rental.owner_id,
            related_rental_id: rental.id,
        });

        console.log(`Successfully processed expired rental ${rental.id}`);
    } catch (error) {
        console.error(`Error handling expired rental ${rental.id}:`, error);
    }
};

export const checkExpiringRentals = async () => {
    try {
        const now = new Date();
        const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();

        const { data: expiringRentals, error } = await supabase
            .from('rentals')
            .select('*, items(*)')
            .eq('status', 'active')
            .gt('end_time', now.toISOString())
            .lt('end_time', twoHoursFromNow);

        if (error) throw error;

        if (!expiringRentals || expiringRentals.length === 0) {
            return;
        }

        for (const rental of expiringRentals) {
            const { data: existingNotif } = await supabase
                .from('notifications')
                .select('id')
                .eq('related_rental_id', rental.id)
                .eq('type', 'rental_expiring_soon')
                .single();

            if (existingNotif) continue;

            await createNotification({
                user_id: rental.renter_id,
                title: 'Rental Expiring Soon',
                message: `Your rental for "${rental.items?.title}" will expire in less than 2 hours. Consider extending if needed.`,
                type: 'rental_expiring_soon',
                related_user_id: rental.owner_id,
                related_rental_id: rental.id,
            });
        }
    } catch (error) {
        console.error('Error checking expiring rentals:', error);
    }
};

export const startRentalExpirationChecker = () => {
    checkExpiredRentals();
    checkExpiringRentals();

    const interval = setInterval(() => {
        checkExpiredRentals();
        checkExpiringRentals();
    }, 60 * 1000);

    return () => clearInterval(interval);
};
