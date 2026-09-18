import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { RetailSalesRecord } from '../../types';
import { ChartEmptyState } from './ChartEmptyState';

interface RegionalSalesChartProps {
  records: RetailSalesRecord[];
}

export const RegionalSalesChart: React.FC<RegionalSalesChartProps> = ({ records }) => {
  const regionalData = useMemo(() => {
    const map = new Map<string, { region: string; net_sales: number; sales_target: number; storeCount: Set<string> }>();

    records.forEach((r) => {
      const existing = map.get(r.region) || {
        region: r.region,
        net_sales: 0,
        sales_target: 0,
        storeCount: new Set<string>(),
      };
      existing.net_sales += r.net_sales;
      existing.sales_target += r.sales_target;
      existing.storeCount.add(r.store_id);
      map.set(r.region, existing);
    });

    return Array.from(map.values())
      .map((item) => ({
        region: item.region,
        net_sales: Math.round(item.net_sales),
        sales_target: Math.round(item.sales_target),
        stores: item.storeCount.size,
        achievementPct: item.sales_target > 0 ? Number(((item.net_sales / item.sales_target) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.net_sales - a.net_sales);
  }, [records]);

  const formatCurrency = (value: number) => {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
    return `$${value}`;
  };

  const getBarColor = (pct: number) => {
    if (pct >= 100) return '#10B981'; // emerald
    if (pct >= 90) return '#3B82F6'; // blue
    if (pct >= 80) return '#F59E0B'; // amber
    return '#EF4444'; // rose
  };

  return (
    <div id="visual-regional-sales" className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Regional Net Sales Performance
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Total Net Sales ($) and Target Achievement (%) breakdown by territory
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-500">Sorted by Total Volume</span>
        </div>
      </div>

      <div className="h-72 w-full pt-4">
        {regionalData.length === 0 ? (
          <ChartEmptyState
            message="No Regional Data Available"
            subtext="No sales records found for the currently filtered regions, cities, or dates."
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={regionalData}
              margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis
                dataKey="region"
                tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }}
                stroke="#CBD5E1"
              />
              <YAxis
                tickFormatter={formatCurrency}
                tick={{ fill: '#64748B', fontSize: 11 }}
                stroke="#CBD5E1"
                width={65}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-lg text-xs shadow-lg space-y-1">
                        <div className="font-semibold text-sm text-slate-100">{data.region} Region</div>
                        <div className="text-slate-300">Net Sales: <span className="font-bold text-white">${data.net_sales.toLocaleString()}</span></div>
                        <div className="text-slate-300">Target: <span className="font-medium text-slate-200">${data.sales_target.toLocaleString()}</span></div>
                        <div className="text-slate-300">Achievement: <span className={`font-bold ${data.achievementPct >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>{data.achievementPct}%</span></div>
                        <div className="text-slate-400 pt-1 border-t border-slate-700">{data.stores} Active Stores</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="net_sales" radius={[4, 4, 0, 0]}>
                {regionalData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.achievementPct)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500"></span> ≥100% Target
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-blue-500"></span> 90-99% Target
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-amber-500"></span> 80-89% Target
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-rose-500"></span> &lt;80% Target
          </span>
        </div>
      </div>
    </div>
  );
};
