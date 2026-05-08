'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LiveActivityPulse, LiveNeighborhoodMap } from '@/components/app/LiveActivity';
import { ArrowLeft, Share2, Info } from 'lucide-react';
import Link from 'next/link';

export default function LivePage() {
  return (
    <main className="bg-background min-h-screen text-on-background font-body relative overflow-x-hidden">
      <div className="mitti-noise" aria-hidden="true" />
      
      {/* Header */}
      <header className="p-6 flex items-center justify-between max-w-5xl mx-auto">
        <Link href="/" className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center border border-stone-200 text-on-background hover:scale-110 transition-transform">
          <ArrowLeft size={20} />
        </Link>
        <div className="text-center">
          <h1 className="font-headline text-2xl font-black text-[#f17350]">Live Pulse</h1>
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Neighborhood real-time activity</p>
        </div>
        <button className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center border border-stone-200 text-on-background">
          <Share2 size={18} />
        </button>
      </header>

      <section className="max-w-xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-8 bg-primary/5 border border-primary/10 p-6 rounded-[32px] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Info size={80} />
            </div>
            <h2 className="font-headline text-3xl mb-2">Neighborhood is <span className="text-primary italic">Alive.</span></h2>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Watch as your community shares, connects, and grows. Every pulse represents a real neighbor opening a door to trust.
            </p>
          </div>

          <h3 className="font-bold text-xs uppercase tracking-widest text-stone-400 mb-4 px-2">Live Map View</h3>
          <LiveNeighborhoodMap />

          <h3 className="font-bold text-xs uppercase tracking-widest text-stone-400 mb-4 px-2">Recent Activity</h3>
          <LiveActivityPulse />

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mt-12">
            {[
              { label: 'Neighbors Online', value: '2,401', color: '#41B3A3' },
              { label: 'Active Shares', value: '184', color: '#f17350' },
              { label: 'Carbon Saved', value: '420kg', color: '#F64C72' },
              { label: 'Money Saved', value: '₹12.4k', color: '#2D3142' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="bg-white p-6 rounded-[24px] border border-stone-100 shadow-sm"
              >
                <div className="text-xs font-bold text-stone-400 uppercase mb-2">{stat.label}</div>
                <div className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</div>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 text-center p-8 border-2 border-dashed border-stone-200 rounded-[32px]">
            <p className="text-stone-400 text-sm mb-6">Want to be part of the pulse?</p>
            <Link href="/register" className="inline-block px-10 py-4 bg-primary text-white rounded-full font-bold text-lg soft-pop">
              Join the Neighborhood
            </Link>
          </div>
        </motion.div>
      </section>

      <footer className="py-12 text-center text-stone-300 text-xs">
        &copy; {new Date().getFullYear()} Loql Live Dashboard &bull; Beta
      </footer>
    </main>
  );
}
