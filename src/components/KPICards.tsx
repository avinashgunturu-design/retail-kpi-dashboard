import React, { useState } from 'react';
import { KPISummary } from '../types';
import {
  DollarSign,
  Target,
  ShoppingCart,
  RotateCcw,
  Percent,
  TrendingUp,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface KPICardsProps {
  summary: KPISummary;
}

interface MetricTooltipProps {
  title: string;
  formula: string;
  description: string;
}

const MetricTooltip: React.FC<MetricTooltipProps> = ({ title, formula, description }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={() => setVisible(!visible)}
        aria-label={`Description for ${title}`}
        className="text-slate-400 hover:text-slate-600 focus:outline-hidden"
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {visible && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 p-2.5 bg-slate-900 text-white rounded-lg shadow-xl text-left text-xs pointer-events-none">
          <div className="font-semibold text-slate-100 mb-1">
            {title}
          </div>
          <div className="text-[11px] text-indigo-300 font-mono bg-slate-800 px-1.5 py-0.5 rounded mb-1.5">
            {formula}
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">{description}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
        </div>
      )}
    </div>
  );
};

export const KPICards: React.FC<KPICardsProps> = ({ summary }) => {
  const formatCurrency = (val: number) => {
    if (val >= 1_000_000) {
      return `$${(val / 1_000_000).toFixed(2)}M`;
    }
    if (val >= 1_000) {
      return `$${(val / 1_000).toFixed(1)}k`;
    }
    return `$${val.toLocaleString()}`;
  };

  const getAchievementBadge = (pct: number) => {
    if (pct >= 100) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          Target Exceeded
        </span>
      );
    }
    if (pct >= 90) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          {(100 - pct).toFixed(1)}% Gap
        </span>
      );
    }
    if (pct >= 80) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          {(100 - pct).toFixed(1)}% Gap
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
        {(100 - pct).toFixed(1)}% Behind
      </span>
    );
  };

  const getReturnBadge = (pct: number) => {
    if (pct <= 5) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          Optimal (&lt;5%)
        </span>
      );
    }
    if (pct <= 10) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          Moderate (5-10%)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full bg-rose-50 text-rose-700 border border-rose-200">
        Elevated Risk (&gt;10%)
      </span>
    );
  };

  const getStockoutBadge = (count: number) => {
    if (count === 0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          No Stockouts
        </span>
      );
    }
    if (count < 50) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          {count} Incident{count > 1 ? 's' : ''}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full bg-rose-50 text-rose-700 border border-rose-200">
        {count} Incident{count > 1 ? 's' : ''} (Supply Risk)
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Net Sales ($) */}
      <div
        id="kpi-net-sales"
        className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors"
      >
        <div>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-600">Net Sales</span>
              <MetricTooltip
                title="Net Sales ($)"
                formula="Σ (gross_sales - discount_amount)"
                description="Actual revenue realized after deducting customer coupons, promotional markdowns, and discounts."
              />
            </div>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {formatCurrency(summary.totalNetSales)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Target: <span className="font-medium text-slate-700">{formatCurrency(summary.totalSalesTarget)}</span>
          </div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Gross: {formatCurrency(summary.totalGrossSales)}</span>
          <span className="text-slate-400">Net Revenue</span>
        </div>
      </div>

      {/* 2. Target Achievement (%) */}
      <div
        id="kpi-target-achievement"
        className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors"
      >
        <div>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-600">Target Achieved</span>
              <MetricTooltip
                title="Target Achievement (%)"
                formula="(Total Net Sales / Total Target) * 100"
                description="Percentage of sales quota achieved across the selected timeframe and filtered stores."
              />
            </div>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {summary.targetAchievementPct.toFixed(1)}%
          </div>
          <div className="mt-1.5">{getAchievementBadge(summary.targetAchievementPct)}</div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
          <span>Variance:</span>
          <span className={summary.totalNetSales >= summary.totalSalesTarget ? 'text-emerald-700 font-medium' : 'text-rose-700 font-medium'}>
            {summary.totalNetSales >= summary.totalSalesTarget ? '+' : ''}
            {formatCurrency(summary.totalNetSales - summary.totalSalesTarget)}
          </span>
        </div>
      </div>

      {/* 3. Average Transaction Value ($) */}
      <div
        id="kpi-atv"
        className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors"
      >
        <div>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-600">Avg Transaction</span>
              <MetricTooltip
                title="Average Transaction Value (ATV)"
                formula="Total Net Sales / Total Transactions"
                description="Average dollar amount spent by a customer per completed checkout basket."
              />
            </div>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            ${summary.atv.toFixed(2)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Across {summary.totalTransactions.toLocaleString()} orders
          </div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
          <span>Units sold:</span>
          <span className="font-medium text-slate-700">{summary.totalUnitsSold.toLocaleString()}</span>
        </div>
      </div>

      {/* 4. Discount Rate (%) */}
      <div
        id="kpi-discount-rate"
        className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors"
      >
        <div>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-600">Discount Rate</span>
              <MetricTooltip
                title="Discount Rate (%)"
                formula="(Total Discount / Total Gross Sales) * 100"
                description="Overall markdown depth. High percentages indicate heavy reliance on promotional markdowns."
              />
            </div>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {summary.discountRatePct.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Discounts: <span className="font-medium text-slate-700">{formatCurrency(summary.totalDiscountAmount)}</span>
          </div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
          <span>Gross Volume:</span>
          <span className="font-medium text-slate-700">{formatCurrency(summary.totalGrossSales)}</span>
        </div>
      </div>

      {/* 5. Customer Footfall & Conversion Rate (%) */}
      <div
        id="kpi-conversion-rate"
        className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors"
      >
        <div>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-600">Footfall & Conversion</span>
              <MetricTooltip
                title="Conversion Rate & Footfall"
                formula="(Total Transactions / Total Footfall) * 100"
                description="Percentage of store visitors who completed a purchase transaction."
              />
            </div>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {summary.conversionRatePct.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            From {summary.totalFootfall.toLocaleString()} visitors
          </div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
          <span>Avg Cust. Rating:</span>
          <span className="font-medium text-slate-700">{summary.avgCustomerRating.toFixed(1)} / 5.0 ★</span>
        </div>
      </div>

      {/* 6. Return Rate (%) */}
      <div
        id="kpi-return-rate"
        className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors"
      >
        <div>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-600">Return Rate</span>
              <MetricTooltip
                title="Return Rate (%)"
                formula="(Total Returns / Total Net Sales) * 100"
                description="Proportion of net revenue reversed through customer returns and refunded merchandise."
              />
            </div>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {summary.returnRatePct.toFixed(1)}%
          </div>
          <div className="mt-1.5">{getReturnBadge(summary.returnRatePct)}</div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
          <span>Refund Value:</span>
          <span className="font-medium text-slate-700">{formatCurrency(summary.totalReturnsAmount)}</span>
        </div>
      </div>

      {/* 7. Stockouts & Supply Risk */}
      <div
        id="kpi-stockouts"
        className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors sm:col-span-2 lg:col-span-2"
      >
        <div>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-600">Stockout Incidents & Supply Risk</span>
              <MetricTooltip
                title="Stockout Incidents"
                formula="Count where stockout units > 0"
                description="Total number of retail SKU instances where product was completely depleted during the trading week."
              />
            </div>
            <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {summary.stockoutOccurrencesCount.toLocaleString()}
            </div>
            <span className="text-xs text-slate-500">out-of-stock events</span>
          </div>
          <div className="mt-1.5">{getStockoutBadge(summary.stockoutOccurrencesCount)}</div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
          <span>Depleted Inventory:</span>
          <span className="font-medium text-slate-700">{summary.totalStockoutUnits.toLocaleString()} units</span>
        </div>
      </div>
    </div>
  );
};
