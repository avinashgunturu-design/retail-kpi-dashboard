import React, { useMemo, useState } from 'react';
import { RetailSalesRecord } from '../../types';
import {
  Trophy,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
  Store,
  Search,
  SlidersHorizontal,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { ChartEmptyState } from './ChartEmptyState';

interface StoreLeaderboardProps {
  records: RetailSalesRecord[];
}

type TabType = 'top' | 'bottom' | 'all';
type SortType = 'achievement' | 'sales' | 'variance';

interface StorePerformance {
  store_id: string;
  store_name: string;
  region: string;
  city: string;
  store_format: string;
  net_sales: number;
  sales_target: number;
  achievementPct: number;
  variance: number;
  transactions: number;
}

export const StoreLeaderboard: React.FC<StoreLeaderboardProps> = ({ records }) => {
  const [activeTab, setActiveTab] = useState<TabType>('top');
  const [sortBy, setSortBy] = useState<SortType>('achievement');
  const [searchQuery, setSearchQuery] = useState('');

  // Aggregate by store
  const allStores = useMemo(() => {
    const storeMap = new Map<string, StorePerformance>();

    records.forEach((r) => {
      const existing = storeMap.get(r.store_id) || {
        store_id: r.store_id,
        store_name: r.store_name,
        region: r.region,
        city: r.city,
        store_format: r.store_format,
        net_sales: 0,
        sales_target: 0,
        achievementPct: 0,
        variance: 0,
        transactions: 0,
      };
      existing.net_sales += r.net_sales;
      existing.sales_target += r.sales_target;
      existing.transactions += r.transactions;
      storeMap.set(r.store_id, existing);
    });

    return Array.from(storeMap.values()).map((s) => {
      const achievementPct =
        s.sales_target > 0 ? Number(((s.net_sales / s.sales_target) * 100).toFixed(1)) : 0;
      const variance = s.net_sales - s.sales_target;
      return {
        ...s,
        achievementPct,
        variance,
      };
    });
  }, [records]);

  // Filter by search
  const filteredStores = useMemo(() => {
    if (!searchQuery.trim()) return allStores;
    const q = searchQuery.toLowerCase();
    return allStores.filter(
      (s) =>
        s.store_name.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.region.toLowerCase().includes(q) ||
        s.store_format.toLowerCase().includes(q)
    );
  }, [allStores, searchQuery]);

  // Sorted lists
  const sortedStores = useMemo(() => {
    const list = [...filteredStores];
    if (sortBy === 'achievement') {
      list.sort((a, b) => b.achievementPct - a.achievementPct);
    } else if (sortBy === 'sales') {
      list.sort((a, b) => b.net_sales - a.net_sales);
    } else if (sortBy === 'variance') {
      list.sort((a, b) => b.variance - a.variance);
    }
    return list;
  }, [filteredStores, sortBy]);

  const topStores = useMemo(() => {
    const list = [...allStores].sort((a, b) => b.achievementPct - a.achievementPct);
    return list.slice(0, 5);
  }, [allStores]);

  const bottomStores = useMemo(() => {
    const list = [...allStores].sort((a, b) => a.achievementPct - b.achievementPct);
    return list.slice(0, 5);
  }, [allStores]);

  // Overall summary metrics
  const summaryMetrics = useMemo(() => {
    if (allStores.length === 0) return null;
    const sortedByAch = [...allStores].sort((a, b) => b.achievementPct - a.achievementPct);
    const top = sortedByAch[0];
    const bottom = sortedByAch[sortedByAch.length - 1];
    const metTargetCount = allStores.filter((s) => s.achievementPct >= 100).length;
    const avgAchievement =
      allStores.reduce((acc, s) => acc + s.achievementPct, 0) / allStores.length;

    return {
      top,
      bottom,
      metTargetCount,
      totalCount: allStores.length,
      avgAchievement: avgAchievement.toFixed(1),
    };
  }, [allStores]);

  const formatCurrency = (val: number) => {
    if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
    if (Math.abs(val) >= 1_000) return `$${(val / 1_000).toFixed(1)}k`;
    return `$${Math.round(val).toLocaleString()}`;
  };

  const renderRankBadge = (rank: number, isTop: boolean) => {
    if (isTop) {
      if (rank === 1) {
        return (
          <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 border border-amber-300/80 flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
            <Trophy className="w-3.5 h-3.5 text-amber-700" />
          </div>
        );
      }
      if (rank === 2) {
        return (
          <div className="w-6 h-6 rounded-lg bg-slate-200 text-slate-800 border border-slate-300 flex items-center justify-center text-xs font-bold shrink-0">
            2
          </div>
        );
      }
      if (rank === 3) {
        return (
          <div className="w-6 h-6 rounded-lg bg-orange-100 text-orange-800 border border-orange-200 flex items-center justify-center text-xs font-bold shrink-0">
            3
          </div>
        );
      }
      return (
        <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0">
          {rank}
        </div>
      );
    }

    return (
      <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-800 border border-rose-200 flex items-center justify-center text-xs font-bold shrink-0">
        {rank}
      </div>
    );
  };

  const renderStoreCard = (store: StorePerformance, rank: number, isTop: boolean) => {
    const isExceeded = store.achievementPct >= 100;
    const progressWidth = Math.min(100, Math.max(5, (store.achievementPct / 125) * 100));

    return (
      <div
        key={store.store_id}
        className="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-indigo-200 hover:shadow-xs transition-all duration-150 flex flex-col gap-2.5"
      >
        {/* Top Line: Rank, Store Name, Tags & Achievement */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {renderRankBadge(rank, isTop)}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  {store.store_name}
                </h4>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60 shrink-0">
                  {store.store_format}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 truncate">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  {store.city}, {store.region}
                </span>
                <span>•</span>
                <span>{store.transactions.toLocaleString()} orders</span>
              </div>
            </div>
          </div>

          {/* Achievement Percentage Badge */}
          <div className="shrink-0 text-right">
            <div
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold shadow-2xs ${
                isExceeded
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : store.achievementPct >= 90
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {isExceeded ? (
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
              )}
              <span>{store.achievementPct}%</span>
            </div>
          </div>
        </div>

        {/* Visual Quota Progress Bar */}
        <div className="space-y-1">
          <div className="relative w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            {/* Target 100% marker line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-slate-400/80 z-10"
              style={{ left: '80%' }} // 100% / 125% scale = 80% mark
              title="100% Target Quota"
            />
            {/* Progress Fill */}
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isExceeded
                  ? 'bg-emerald-600'
                  : store.achievementPct >= 90
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${progressWidth}%` }}
            />
          </div>
        </div>

        {/* Bottom Numbers Row: Net Sales, Target, Variance */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="text-slate-400">Sales:</span>
            <strong className="font-semibold text-slate-800">{formatCurrency(store.net_sales)}</strong>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="text-slate-400">Target:</span>
            <span className="font-medium text-slate-700">{formatCurrency(store.sales_target)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Variance:</span>
            <span
              className={`font-semibold ${
                store.variance >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {store.variance >= 0 ? '+' : ''}
              {formatCurrency(store.variance)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      id="visual-store-leaderboard"
      className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs flex flex-col h-full"
    >
      {/* Header Section */}
      <div className="pb-4 border-b border-slate-100 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Store Performance Leaderboard
              </h3>
              <p className="text-xs text-slate-500">
                Ranked by sales quota achievement % and target variance
              </p>
            </div>
          </div>

          {/* View Tab Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('top')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'top'
                  ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Top 5</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('bottom')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'bottom'
                  ? 'bg-white text-rose-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
              <span>Bottom 5</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>All Stores ({allStores.length})</span>
            </button>
          </div>
        </div>

        {/* Quick Executive Metrics Strip */}
        {summaryMetrics && (
          <div className="grid grid-cols-3 gap-2.5 p-2.5 bg-slate-50/80 rounded-xl border border-slate-100 text-xs">
            <div className="px-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Top Store</span>
              <span className="font-bold text-emerald-800 truncate block mt-0.5">
                {summaryMetrics.top?.store_name} ({summaryMetrics.top?.achievementPct}%)
              </span>
            </div>
            <div className="px-2 border-x border-slate-200/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Quota Met</span>
              <span className="font-bold text-slate-800 block mt-0.5">
                {summaryMetrics.metTargetCount} / {summaryMetrics.totalCount} Stores (Avg {summaryMetrics.avgAchievement}%)
              </span>
            </div>
            <div className="px-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Max Deficit</span>
              <span className="font-bold text-rose-800 truncate block mt-0.5">
                {summaryMetrics.bottom?.store_name} ({summaryMetrics.bottom?.achievementPct}%)
              </span>
            </div>
          </div>
        )}

        {/* Search & Secondary Controls (Shown in 'all' view or always available for fast lookup) */}
        {activeTab === 'all' && (
          <div className="flex items-center gap-2 pt-1">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search store name, city, or format..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center gap-1.5 shrink-0 text-xs">
              <span className="text-slate-400 hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortType)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden"
              >
                <option value="achievement">Quota %</option>
                <option value="sales">Net Sales</option>
                <option value="variance">Variance ($)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Main List Container */}
      <div className="pt-4 flex-1">
        {allStores.length === 0 ? (
          <ChartEmptyState
            message="No Store Performance Data"
            subtext="No retail stores match your active location or format criteria."
          />
        ) : activeTab === 'top' ? (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1 text-xs">
              <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-emerald-600" />
                Top 5 Overperforming Stores
              </span>
              <span className="text-[11px] text-slate-400">Reference mark at 100% quota</span>
            </div>
            <div className="space-y-2.5">
              {topStores.map((store, i) => renderStoreCard(store, i + 1, true))}
            </div>
          </div>
        ) : activeTab === 'bottom' ? (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1 text-xs">
              <span className="font-bold text-rose-800 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                Bottom 5 Underperforming Stores
              </span>
              <span className="text-[11px] text-slate-400">Stores requiring quota support</span>
            </div>
            <div className="space-y-2.5">
              {bottomStores.map((store, i) => renderStoreCard(store, i + 1, false))}
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1 text-xs">
              <span className="font-bold text-slate-800">
                All Ranked Stores ({sortedStores.length})
              </span>
              <span className="text-[11px] text-slate-400">
                Sorted by {sortBy === 'achievement' ? 'Quota %' : sortBy === 'sales' ? 'Net Sales' : 'Variance'}
              </span>
            </div>
            {sortedStores.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No stores match "{searchQuery}".
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                {sortedStores.map((store, i) =>
                  renderStoreCard(store, i + 1, store.achievementPct >= 100)
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
