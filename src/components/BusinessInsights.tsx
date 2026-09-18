import React from 'react';
import { BusinessInsights as IBusinessInsights } from '../types';
import {
  TrendingUp,
  RotateCcw,
  AlertOctagon,
  Sparkles,
  PackageX,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface BusinessInsightsProps {
  insights: IBusinessInsights;
}

export const BusinessInsights: React.FC<BusinessInsightsProps> = ({ insights }) => {
  const formatCurrency = (val: number) => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}k`;
    return `$${val.toLocaleString()}`;
  };

  return (
    <div
      id="business-insights-section"
      className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs mb-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Executive Business Intelligence Insights
            </h3>
            <p className="text-xs text-slate-500">
              Automated analytical findings across regions, returns, store quotas, and supply bottlenecks
            </p>
          </div>
        </div>
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 w-fit">
          Real-Time Synthesis
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
        {/* 1. Regional Dynamics */}
        <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between hover:bg-slate-50 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                Regional Dynamics
              </span>
            </div>

            {insights.bestRegion && insights.worstRegion ? (
              <div className="space-y-2.5 text-xs">
                <div className="p-2.5 rounded-lg bg-white border border-emerald-200/80 shadow-2xs">
                  <div className="flex items-center justify-between text-emerald-900 font-semibold mb-0.5">
                    <span className="flex items-center gap-1">
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                      Leader: {insights.bestRegion.name}
                    </span>
                    <span className="text-emerald-700 font-bold">{insights.bestRegion.achievementPct}%</span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Delivered {formatCurrency(insights.bestRegion.netSales)} in Net Sales, leading territory volume.
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-rose-200/80 shadow-2xs">
                  <div className="flex items-center justify-between text-rose-900 font-semibold mb-0.5">
                    <span className="flex items-center gap-1">
                      <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
                      Lagging: {insights.worstRegion.name}
                    </span>
                    <span className="text-rose-700 font-bold">{insights.worstRegion.achievementPct}%</span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Generated {formatCurrency(insights.worstRegion.netSales)}. Requires promotional support.
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No regional data for current selection.</p>
            )}
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200/60 text-[10px] text-slate-500">
            Benchmarked against territory sales targets
          </div>
        </div>

        {/* 2. Highest Return Category */}
        <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between hover:bg-slate-50 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                Return Rate Analysis
              </span>
            </div>

            {insights.highestReturnCategory ? (
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-white border border-rose-200/80 shadow-2xs">
                  <div className="font-bold text-slate-900 text-xs mb-0.5">
                    {insights.highestReturnCategory.category}
                  </div>
                  <div className="text-rose-700 font-semibold text-xs flex justify-between">
                    <span>Return Rate:</span>
                    <span>{insights.highestReturnCategory.returnRatePct}%</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Refund value: {formatCurrency(insights.highestReturnCategory.returnsAmount)}
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {insights.highestReturnCategory.returnRatePct > 10
                    ? `Elevated return rates in ${insights.highestReturnCategory.category} suggest potential sizing/quality issues.`
                    : `Return rate in ${insights.highestReturnCategory.category} remains within acceptable retail variance.`}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No category return records available.</p>
            )}
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200/60 text-[10px] text-slate-500">
            {insights.lowestReturnCategory && (
              <span>Lowest: {insights.lowestReturnCategory.category} ({insights.lowestReturnCategory.returnRatePct}%)</span>
            )}
          </div>
        </div>

        {/* 3. Underperforming Stores */}
        <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between hover:bg-slate-50 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <AlertOctagon className="w-3.5 h-3.5 text-amber-600" />
                Underperforming Stores
              </span>
            </div>

            {insights.underperformingStores.length > 0 ? (
              <div className="space-y-1.5 text-xs">
                {insights.underperformingStores.slice(0, 3).map((st) => (
                  <div
                    key={st.store_id}
                    className="p-2 rounded-lg bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-slate-900 truncate text-[11px]">
                        {st.store_name}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {st.region} • Gap: {formatCurrency(st.gapAmount)}
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-rose-700 px-1.5 py-0.5 rounded bg-rose-50 border border-rose-200 shrink-0">
                      {st.achievementPct}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">All stores meeting performance benchmarks.</p>
            )}
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200/60 text-[10px] text-slate-500">
            Stores with highest negative quota variance
          </div>
        </div>

        {/* 4. Inventory & Stockouts */}
        <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between hover:bg-slate-50 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <PackageX className="w-3.5 h-3.5 text-orange-600" />
                Stockout Bottlenecks
              </span>
            </div>

            {insights.criticalStockoutCategory ? (
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-white border border-orange-200/80 shadow-2xs">
                  <div className="font-bold text-slate-900 text-xs mb-0.5">
                    {insights.criticalStockoutCategory.category}
                  </div>
                  <div className="text-orange-700 font-semibold text-xs flex justify-between">
                    <span>Incidents:</span>
                    <span>{insights.criticalStockoutCategory.stockouts} events</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Hotspot: <span className="font-medium text-slate-700">{insights.criticalStockoutCategory.primaryRegion}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Supply lag in {insights.criticalStockoutCategory.category} risks footfall conversion. Prioritize replenishment to {insights.criticalStockoutCategory.primaryRegion}.
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No stockout bottlenecks identified.</p>
            )}
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200/60 text-[10px] text-slate-500">
            Triggering automated supply chain alerts
          </div>
        </div>
      </div>
    </div>
  );
};
