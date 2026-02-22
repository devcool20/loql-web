'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, Wallet as WalletIcon, CreditCard, Plus, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';

const WalletScreen = () => {
  const { user, closeStack } = useStore();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWallet();
    fetchTransactions();
  }, []);

  const fetchWallet = async () => {
    try {
      const { data } = await supabase.from('wallets').select('balance').eq('user_id', user.id).maybeSingle();
      if (data) setBalance(data.balance);
    } catch (e) { console.error(e); }
  };

  const fetchTransactions = async () => {
    try {
      const { data } = await supabase
        .from('rentals')
        .select('*, items(title)')
        .or(`renter_id.eq.${user.id},owner_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(10);
      setTransactions(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#FAFAFA', zIndex: 200, overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
        <button className="scale-pressable" onClick={closeStack} style={{ padding: 8 }}>
          <ChevronLeft size={24} color="#111827" />
        </button>
        <span style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Wallet</span>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ padding: 24, paddingBottom: 100 }}>
        {/* Balance Card */}
        <div style={{ textAlign: 'center', marginBottom: 40, marginTop: 20 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 40, background: 'white', border: '1px solid #E5E7EB',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
          }}>
            <WalletIcon size={32} color="#111827" />
          </div>
          <span style={{ fontSize: 14, color: '#6B7280', fontWeight: 500, display: 'block', marginBottom: 8 }}>Total Money Available</span>
          <span style={{ fontSize: 40, fontWeight: 700, color: '#111827', display: 'block' }}>₹{balance.toFixed(2)}</span>
          <span style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4, display: 'block' }}>(Money earned - Money spent)</span>
        </div>

        {/* Payment Methods */}
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Payment Methods</h3>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>Methods for both cash in and cash out</p>

        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E7EB', padding: 8, marginBottom: 16 }}>
          <div className="scale-pressable" style={{ display: 'flex', alignItems: 'center', padding: 12, cursor: 'pointer' }}>
            <div style={{ width: 40, height: 40, borderRadius: 20, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <CreditCard size={20} color="#374151" />
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#111827', display: 'block' }}>HDFC Bank **** 4582</span>
              <span style={{ fontSize: 12, color: '#6B7280' }}>Primary</span>
            </div>
            <ChevronRight size={20} color="#9CA3AF" />
          </div>
          <div style={{ height: 1, background: '#F3F4F6', margin: '0 12px' }} />
          <div className="scale-pressable" style={{ display: 'flex', alignItems: 'center', padding: 12, cursor: 'pointer' }}>
            <div style={{ width: 40, height: 40, borderRadius: 20, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>G</span>
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#111827', display: 'block' }}>Google Pay</span>
              <span style={{ fontSize: 12, color: '#6B7280' }}>Linked</span>
            </div>
            <ChevronRight size={20} color="#9CA3AF" />
          </div>
        </div>

        <button className="scale-pressable" style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: 16, borderRadius: 16, border: '1px dashed #E5E7EB', marginBottom: 40, background: 'transparent',
        }}>
          <Plus size={20} color="#111827" />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Add New Method</span>
        </button>

        {/* Recent Transactions */}
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Recent Transactions</h3>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <div className="spinner" style={{ borderTopColor: '#111827', borderColor: '#E5E7EB' }} />
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', background: '#F9FAFB', borderRadius: 12 }}>
            <span style={{ color: '#9CA3AF', fontSize: 14, fontWeight: 500 }}>No recent transactions</span>
          </div>
        ) : (
          transactions.map((tx) => {
            const isEarning = tx.owner_id === user.id;
            return (
              <div key={tx.id} style={{
                display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #F3F4F6',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 18, background: isEarning ? '#D1FAE5' : '#FEE2E2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12, fontSize: 14,
                }}>
                  {isEarning ? '↓' : '↑'}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#111827', display: 'block' }}>{tx.items?.title || 'Rental'}</span>
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>{new Date(tx.created_at).toLocaleDateString()}</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: isEarning ? '#10B981' : '#EF4444' }}>
                  {isEarning ? '+' : '-'}₹{tx.final_price || tx.total_price || 0}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default WalletScreen;
