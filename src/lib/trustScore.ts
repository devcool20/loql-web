import { supabase } from './supabase';

export const calculateTrustScore = async (userId: string) => {
    let score = 100;

    try {
        const { data: renterHistory } = await supabase
            .from('rentals')
            .select('return_date, end_date, status')
            .eq('renter_id', userId)
            .eq('status', 'completed');

        if (renterHistory && renterHistory.length > 0) {
            renterHistory.forEach((r: any) => {
                if (r.return_date && r.end_date) {
                    const ret = new Date(r.return_date);
                    const end = new Date(r.end_date);
                    if (ret.getTime() > end.getTime()) {
                        const diffMs = ret.getTime() - end.getTime();
                        const daysLate = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                        score -= (10 * daysLate);
                    } else {
                        score += 5;
                    }
                }
            });
        }

        const { count: itemsCount } = await supabase
            .from('items')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', userId);

        if (itemsCount) {
            score += (itemsCount * 2);
        }

        return Math.max(0, Math.min(100, score));

    } catch (e) {
        console.error('Error calculating trust score:', e);
        return 80;
    }
};
