import { supabase } from './supabase';

export const processCompletedRentals = async () => {
    try {
        const now = new Date().toISOString();

        const { data: expiredRentals, error: fetchError } = await (supabase
            .from('rentals')
            .select('*')
            .eq('status', 'active')
            .lt('end_date', now) as any);

        if (fetchError) throw fetchError;
        if (!expiredRentals || (expiredRentals as any[]).length === 0) return;

        console.log(`Found ${(expiredRentals as any[]).length} expired rentals to process.`);

        const rentalIds = (expiredRentals as any[]).map((r: any) => r.id);
        const itemIds = (expiredRentals as any[]).map((r: any) => r.item_id);

        const { error: rentalUpdateError } = await supabase
            .from('rentals')
            .update({ status: 'completed' })
            .in('id', rentalIds);

        if (rentalUpdateError) throw rentalUpdateError;

        const { error: itemUpdateError } = await supabase
            .from('items')
            .update({ status: 'available' })
            .in('id', itemIds);

        if (itemUpdateError) throw itemUpdateError;

        console.log('Successfully auto-completed rentals and re-listed items.');

    } catch (error) {
        console.error('Error processing completed rentals:', error);
    }
};
