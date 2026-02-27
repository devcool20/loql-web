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
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--background)', zIndex: 200, overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
        <button className="scale-pressable" onClick={closeStack} style={{ padding: 8 }}>
          <ChevronLeft size={24} color="var(--text-primary)" />
        </button>
        <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Wallet</span>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ padding: 24, paddingBottom: 100 }}>
        {/* Balance Card */}
        <div style={{ textAlign: 'center', marginBottom: 40, marginTop: 20 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 40, background: 'var(--surface)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
          }}>
            <WalletIcon size={32} color="var(--text-primary)" />
          </div>
          <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: 8 }}>Total Money Available</span>
          <span style={{ fontSize: 40, fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>₹{balance.toFixed(2)}</span>
          <span style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 4, display: 'block' }}>(Money earned - Money spent)</span>
        </div>

        {/* Payment Methods */}
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Payment Methods</h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>Methods for both cash in and cash out</p>

        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: 8, marginBottom: 16 }}>
          <div className="scale-pressable" style={{ display: 'flex', alignItems: 'center', padding: 12, cursor: 'pointer' }}>
            <div style={{ width: 40, height: 40, borderRadius: 20, background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <CreditCard size={20} color="var(--text-label)" />
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>HDFC Bank **** 4582</span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Primary</span>
            </div>
            <ChevronRight size={20} color="var(--text-light)" />
          </div>
          <div style={{ height: 1, background: 'var(--border-light)', margin: '0 12px' }} />
          <div className="scale-pressable" style={{ display: 'flex', alignItems: 'center', padding: 12, cursor: 'pointer' }}>
            <div style={{ width: 40, height: 40, borderRadius: 20, background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>G</span>
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>Google Pay</span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Linked</span>
            </div>
            <ChevronRight size={20} color="var(--text-light)" />
          </div>
        </div>

        <button className="scale-pressable" style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: 16, borderRadius: 16, border: '1px dashed var(--border)', marginBottom: 40, background: 'transparent',
        }}>
          <Plus size={20} color="var(--text-primary)" />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Add New Method</span>
        </button>

        {/* Recent Transactions */}
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Recent Transactions</h3>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <div className="spinner" style={{ borderTopColor: 'var(--text-primary)', borderColor: 'var(--border)' }} />
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', background: 'var(--surface-alt)', borderRadius: 12 }}>
            <span style={{ color: 'var(--text-light)', fontSize: 14, fontWeight: 500 }}>No recent transactions</span>
          </div>
        ) : (
          transactions.map((tx) => {
            const isEarning = tx.owner_id === user.id;
            return (
              <div key={tx.id} style={{
                display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-light)',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 18, background: isEarning ? '#D1FAE5' : '#FEE2E2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12, fontSize: 14,
                }}>
                  {isEarning ? '↓' : '↑'}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>{tx.items?.title || 'Rental'}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-light)' }}>{new Date(tx.created_at).toLocaleDateString()}</span>
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
