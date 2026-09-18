import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { RetailSalesRecord } from '../../types';
import { ChartEmptyState } from './ChartEmptyState';

interface SalesTrendChartProps {
  records: RetailSalesRecord[];
}

export const SalesTrendChart: React.FC<SalesTrendChartProps> = ({ records }) => {
  const trendData = useMemo(() => {
    const map = new Map<string, { week_start_date: string; net_sales: number; sales_target: number }>();

    records.forEach((r) => {
      const existing = map.get(r.week_start_date) || {
        week_start_date: r.week_start_date,
        net_sales: 0,
        sales_target: 0,
      };
      existing.net_sales += r.net_sales;
      existing.sales_target += r.sales_target;
      map.set(r.week_start_date, existing);
    });

    const list = Array.from(map.values());
    list.sort((a, b) => new Date(a.week_start_date).getTime() - new Date(b.week_start_date).getTime());

    return list.map((item) => ({
      ...item,
      variance: item.net_sales - item.sales_target,
      achievementPct: item.sales_target > 0 ? Number(((item.net_sales / item.sales_target) * 100).toFixed(1)) : 0,
    }));
  }, [records]);

  const formatCurrency = (value: number) => {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
    return `$${value}`;
  };

  const formatDateLabel = (val: string) => {
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return val;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return val;
    }
  };

  return (
    <div id="visual-sales-trend" className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Net Sales vs. Sales Target
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Weekly trajectory over week_start_date across selected filters
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span>
            <span className="text-slate-600 font-medium">Net Sales ($)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-amber-500 inline-block border-t-2 border-dashed border-amber-500"></span>
            <span className="text-slate-600 font-medium">Target ($)</span>
          </div>
        </div>
      </div>

      <div className="h-72 w-full pt-4">
        {trendData.length === 0 ? (
          <ChartEmptyState
            message="No Sales Trend Data"
            subtext="No weekly transactions match the active territory, category, or date range."
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis
                dataKey="week_start_date"
                tickFormatter={formatDateLabel}
                tick={{ fill: '#64748B', fontSize: 11 }}
                stroke="#CBD5E1"
              />
              <YAxis
                tickFormatter={formatCurrency}
                tick={{ fill: '#64748B', fontSize: 11 }}
                stroke="#CBD5E1"
                width={65}
              />
              <Tooltip
                formatter={(val: any, name: any) => [
                  `$${Number(val || 0).toLocaleString()}`,
                  name === 'net_sales' ? 'Net Sales' : 'Sales Target',
                ]}
                labelFormatter={(label) => `Week Starting: ${label}`}
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
                }}
              />
              <Line
                type="monotone"
                dataKey="net_sales"
                name="Net Sales"
                stroke="#2563EB"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#2563EB' }}
                activeDot={{ r: 6, stroke: '#FFFFFF', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="sales_target"
                name="Sales Target"
                stroke="#F59E0B"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 2.5, fill: '#F59E0B' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
