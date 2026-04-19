import { useState, useEffect } from 'react';
import { loyaltyService } from '../../services/loyalty.service';
import type { LoyaltyAccount, LoyaltyTransaction, Reward } from '../../types/loyalty.types';
import { Star, Gift, ArrowUpRight, ArrowDownLeft, Clock, Trophy, ChevronRight } from 'lucide-react';

const TIER_BENEFITS: Record<string, string[]> = {
  BRONZE: ['Earn 1 pt per NPR 10 spent', 'Access to basic rewards', 'Birthday points bonus'],
  SILVER: ['All Bronze perks', 'Priority seating requests', 'Exclusive member discounts', '2x points on weekends'],
  GOLD: ['All Silver perks', 'VIP table reservations', 'Complimentary starter monthly', 'Dedicated concierge service'],
};

const TIER_COLORS = {
  BRONZE: { bg: 'from-amber-700 to-amber-500', badge: 'bg-amber-100 text-amber-800' },
  SILVER: { bg: 'from-gray-500 to-gray-400', badge: 'bg-gray-100 text-gray-800' },
  GOLD: { bg: 'from-yellow-500 to-yellow-400', badge: 'bg-yellow-100 text-yellow-800' },
};

export default function LoyaltyPage() {
  const [account, setAccount] = useState<LoyaltyAccount | null>(null);
  const [history, setHistory] = useState<LoyaltyTransaction[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [redeeming, setRedeeming] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      // Account must load first — it auto-creates if missing, history depends on it
      const acc = await loyaltyService.getMyAccount();
      setAccount(acc);
      const [hist, rews] = await Promise.all([
        loyaltyService.getMyHistory().catch(() => []),
        loyaltyService.getAvailableRewards().catch(() => []),
      ]);
      setHistory(hist);
      setRewards(rews);
    } catch {
      setError('Could not load your loyalty account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRedeem = async (rewardId: number, rewardName: string) => {
    if (!confirm(`Redeem "${rewardName}"?`)) return;
    setRedeeming(rewardId);
    try {
      const updated = await loyaltyService.redeemReward(rewardId);
      setAccount(updated);
      setSuccessMsg(`"${rewardName}" redeemed! Your new balance: ${updated.currentPoints} pts`);
      const hist = await loyaltyService.getMyHistory();
      setHistory(hist);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Redemption failed');
      setTimeout(() => setError(''), 4000);
    } finally {
      setRedeeming(null);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;

  const tierColors = account ? TIER_COLORS[account.tier] : TIER_COLORS.BRONZE;
  const nextTier = account?.tier === 'BRONZE' ? { name: 'SILVER', need: 500, start: 0 } : account?.tier === 'SILVER' ? { name: 'GOLD', need: 1000, start: 500 } : null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-2xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">My Loyalty Points</h1>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm">{error}</div>}
      {successMsg && <div className="bg-green-50 text-green-700 p-3 rounded-xl text-sm font-medium">{successMsg}</div>}

      {account && (
        <>
          {/* Account Card */}
          <div className={`bg-gradient-to-br ${tierColors.bg} rounded-2xl p-6 text-white shadow-lg`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/70 text-sm">Hello,</p>
                <p className="text-xl font-bold">{account.userName}</p>
              </div>
              <div className={`${tierColors.badge} px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1`}>
                <Star size={12} />
                {account.tier}
              </div>
            </div>
            <div className="mt-6">
              <p className="text-white/70 text-sm">Current Points</p>
              <p className="text-4xl font-bold mt-1">{account.currentPoints.toLocaleString()}</p>
            </div>
            <div className="mt-4 flex items-center gap-4 text-sm text-white/80">
              <span>Lifetime: <strong className="text-white">{account.lifetimePoints.toLocaleString()} pts</strong></span>
              {nextTier && (
                <span>{nextTier.need - account.lifetimePoints} pts to <strong className="text-white">{nextTier.name}</strong></span>
              )}
            </div>
            {nextTier && (
              <div className="mt-3 bg-white/20 rounded-full h-2">
                <div
                  className="bg-white rounded-full h-2 transition-all"
                  style={{ width: `${Math.min(100, ((account.lifetimePoints - nextTier.start) / (nextTier.need - nextTier.start)) * 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Tier Benefits */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Trophy size={18} className="text-orange-500" /> Your Perks
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${tierColors.badge}`}>
                  {account.tier}
                </span>
                <span className="text-sm text-gray-500">member benefits</span>
                {nextTier && (
                  <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
                    <ChevronRight size={12} />
                    {nextTier.need - account.lifetimePoints} pts to {nextTier.name}
                  </span>
                )}
              </div>
              <ul className="space-y-1.5">
                {(TIER_BENEFITS[account.tier] || []).map((perk, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <Star size={11} className="text-orange-400 shrink-0" />
                    {perk}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Rewards */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Available Rewards</h2>
            {rewards.length === 0 ? (
              <p className="text-gray-400 text-sm">No rewards available at the moment.</p>
            ) : (
              <div className="space-y-3">
                {rewards.map(reward => {
                  const canRedeem = account.currentPoints >= reward.pointsCost;
                  return (
                    <div key={reward.id} className={`flex items-center justify-between p-4 bg-white rounded-xl border ${canRedeem ? 'border-gray-200' : 'border-gray-100 opacity-70'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${canRedeem ? 'bg-orange-100' : 'bg-gray-100'}`}>
                          <Gift size={18} className={canRedeem ? 'text-orange-600' : 'text-gray-400'} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{reward.name}</p>
                          <p className="text-xs text-gray-500">{reward.pointsCost} pts · NPR {reward.discountAmount} off</p>
                          {reward.description && <p className="text-xs text-gray-400 mt-0.5">{reward.description}</p>}
                        </div>
                      </div>
                      <button
                        disabled={!canRedeem || redeeming === reward.id}
                        onClick={() => handleRedeem(reward.id, reward.name)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          canRedeem
                            ? 'bg-orange-500 text-white hover:bg-orange-600'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {redeeming === reward.id ? '...' : canRedeem ? 'Redeem' : 'Need ' + (reward.pointsCost - account.currentPoints) + ' more'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* History */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Points History</h2>
            {history.length === 0 ? (
              <p className="text-gray-400 text-sm">No transactions yet. Place an order to earn points!</p>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                {history.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        tx.pointsChange > 0 ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {tx.pointsChange > 0
                          ? <ArrowUpRight size={14} className="text-green-600" />
                          : <ArrowDownLeft size={14} className="text-red-500" />
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{tx.description}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(tx.createdAt).toLocaleDateString()} · Balance: {tx.balanceAfter} pts
                        </p>
                      </div>
                    </div>
                    <span className={`font-semibold text-sm ${tx.pointsChange > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {tx.pointsChange > 0 ? '+' : ''}{tx.pointsChange}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
