'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { calculateTrustScore } from '@/lib/trustScore';
import { getSafeImageUrl } from '@/lib/imageUtils';
import AppSheet from '@/components/app/AppSheet';
import StatCells from '@/components/app/StatCells';
import TrustRow from '@/components/app/TrustRow';

type Props = { visible: boolean; userId: string | null; user?: any; onClose: () => void };
const UserProfileModal = ({ visible, userId, user = {}, onClose }: Props) => {
  const [stats, setStats] = useState({ rented:0, listed:0, trustScore:0 });
  const [loading, setLoading] = useState(true);
  useEffect(() => { if (!visible || !userId) return; let active = true; (async () => {
    setLoading(true);
    try {
      const [rented, listed, score] = await Promise.all([
        supabase.from('rentals').select('*', { count: 'exact', head: true }).eq('renter_id', userId).eq('status', 'completed'),
        supabase.from('items').select('*', { count: 'exact', head: true }).eq('owner_id', userId),
        calculateTrustScore(userId),
      ]);
      if (active) setStats({ rented: rented.count || 0, listed: listed.count || 0, trustScore: score });
    } catch (e) { console.error(e); } finally { if (active) setLoading(false); }
  })(); return () => { active = false; }; }, [visible, userId]);
  const name = user.full_name || user.name || 'Neighbour';
  return <AppSheet open={visible} onClose={onClose} labelledBy="user-sheet-title" className="user-sheet">
    <div className="sheet-head"><span className="v2-eyebrow">Neighbour profile</span><button className="app-icon-button" onClick={onClose} aria-label="Close profile"><X size={18}/></button></div>
    {loading ? <div className="sheet-loading"><div className="spinner" /></div> : <>
      <div className="user-hero">{user.avatar_url ? <img src={getSafeImageUrl(user.avatar_url)} alt="" /> : <span>{name[0]}</span>}<div><h2 id="user-sheet-title" className="font-serif">{name}</h2><TrustRow label="Verified neighbour" /></div></div>
      <StatCells cells={[{value:String(stats.listed),label:'Items shared'},{value:String(stats.rented),label:'Borrowed'},{value:`${stats.trustScore}/100`,label:'Trust score'}]} />
      <div className="user-safe-note"><ShieldCheck size={18}/><p>Identity and activity are verified through Loql’s neighbourhood rental history.</p></div>
    </>}
  </AppSheet>;
};
export default UserProfileModal;
