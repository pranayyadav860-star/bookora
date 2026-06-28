// client/src/pages/LoyaltyPoints.js
// NEW FEATURE: Shows user's points balance, tier, history, and redemption options

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { StatCardSkeleton } from '../components/Skeleton';
import toast from 'react-hot-toast';

const TIER_CONFIG = {
  Bronze:   { color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   icon: '🥉', next: 'Silver',   nextAt: 5000 },
  Silver:   { color: 'text-slate-600',   bg: 'bg-slate-50',   border: 'border-slate-200',   icon: '🥈', next: 'Gold',     nextAt: 20000 },
  Gold:     { color: 'text-yellow-600',  bg: 'bg-yellow-50',  border: 'border-yellow-200',  icon: '🥇', next: 'Platinum', nextAt: 50000 },
  Platinum: { color: 'text-purple-700',  bg: 'bg-purple-50',  border: 'border-purple-200',  icon: '💎', next: null,       nextAt: null },
};

export default function LoyaltyPoints() {
  const [loyalty, setLoyalty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/loyalty')
      .then(({ data }) => setLoyalty(data))
      .catch(() => toast.error('Could not load loyalty data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCardSkeleton /><StatCardSkeleton />
      </div>
    </div>
  );

  if (!loyalty) return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <div className="text-5xl mb-4">🏅</div>
      <h2 className="text-xl font-semibold mb-2">No loyalty data yet</h2>
      <p className="text-gray-500 mb-6">Make your first booking to start earning points.</p>
      <Link to="/hotels" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Browse hotels</Link>
    </div>
  );

  const tier = TIER_CONFIG[loyalty.tier] || TIER_CONFIG.Bronze;
  const progressToNext = tier.nextAt
    ? Math.min(100, Math.round((loyalty.lifetimePoints / tier.nextAt) * 100))
    : 100;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Your Loyalty Points</h1>

      {/* Tier card */}
      <div className={`rounded-2xl border p-6 ${tier.bg} ${tier.border}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{tier.icon}</span>
              <span className={`text-xl font-bold ${tier.color}`}>{loyalty.tier} Member</span>
            </div>
            <p className="text-gray-500 text-sm">{loyalty.lifetimePoints.toLocaleString()} lifetime points earned</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-800">{loyalty.points.toLocaleString()}</p>
            <p className="text-sm text-gray-500">available points · worth ₹{loyalty.points.toLocaleString()}</p>
          </div>
        </div>

        {tier.next && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{loyalty.tier}</span>
              <span>{tier.next} at {tier.nextAt?.toLocaleString()} pts</span>
            </div>
            <div className="h-2 bg-white rounded-full overflow-hidden">
              <div className={`h-full rounded-full bg-current ${tier.color} transition-all duration-500`} style={{ width: `${progressToNext}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-1">{(tier.nextAt - loyalty.lifetimePoints).toLocaleString()} points to {tier.next}</p>
          </div>
        )}
      </div>

      {/* How to earn */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 mb-3">How to earn points</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: '🏨', label: 'Book a hotel', desc: '₹100 spent = 1 point' },
            { icon: '👥', label: 'Refer a friend', desc: '500 bonus points per referral' },
            { icon: '⭐', label: 'Leave a review', desc: '50 points per verified review' },
          ].map(({ icon, label, desc }) => (
            <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl mb-1">{icon}</div>
              <div className="text-sm font-medium text-gray-700">{label}</div>
              <div className="text-xs text-gray-400">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tier benefits */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 mb-3">Tier benefits</h2>
        <div className="space-y-2 text-sm">
          {[
            { tier: 'Bronze 🥉', perks: ['Earn 1 pt per ₹100', 'Points redeemable as cash discount'] },
            { tier: 'Silver 🥈', perks: ['All Bronze perks', 'Free breakfast on 5th booking', 'Priority customer support'] },
            { tier: 'Gold 🥇',   perks: ['All Silver perks', 'Early check-in when available', '5% extra discount on all bookings'] },
            { tier: 'Platinum 💎', perks: ['All Gold perks', 'Free room upgrade when available', 'Dedicated relationship manager'] },
          ].map(({ tier: t, perks }) => (
            <div key={t} className={`p-3 rounded-lg ${loyalty.tier === t.split(' ')[0] ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50'}`}>
              <div className="font-medium text-gray-700 mb-1">{t}</div>
              <ul className="text-gray-500 space-y-0.5">
                {perks.map(p => <li key={p} className="flex items-start gap-1"><span>·</span>{p}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction history */}
      {loyalty.transactions?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-3">Point history</h2>
          <div className="space-y-2">
            {loyalty.transactions.slice(-20).reverse().map((tx, i) => (
              <div key={i} className="flex justify-between items-start py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm text-gray-700">{tx.description}</p>
                  <p className="text-xs text-gray-400">{new Date(tx.date).toLocaleDateString('en-IN')}</p>
                </div>
                <span className={`text-sm font-semibold ${tx.type === 'earned' || tx.type === 'bonus' ? 'text-green-600' : 'text-red-500'}`}>
                  {tx.type === 'earned' || tx.type === 'bonus' ? '+' : '-'}{tx.points}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
