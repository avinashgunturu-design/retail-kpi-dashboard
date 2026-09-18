import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart,
  Line,
} from 'recharts';
import { RetailSalesRecord } from '../../types';
import { Layers, BarChart3, AlertCircle } from 'lucide-react';
import { ChartEmptyState } from './ChartEmptyState';

interface CategoryPerformanceChartProps {
  records: RetailSalesRecord[];
}

export const CategoryPerformanceChart: React.FC<CategoryPerformanceChartProps> = ({ records }) => {
  const [viewMode, setViewMode] = useState<'horizontal' | 'composed'>('horizontal');

  const categoryData = useMemo(() => {
    const map = new Map<
      string,
      {
        category: string;
        net_sales: number;
        gross_sales: number;
        returns_amount: number;
      }
    >();

    records.forEach((r) => {
      const existing = map.get(r.product_category) || {
        category: r.product_category,
        net_sales: 0,
        gross_sales: 0,
        returns_amount: 0,
      };
      existing.net_sales += r.net_sales;
      existing.gross_sales += r.gross_sales;
      existing.returns_amount += r.returns_amount;
      map.set(r.product_category, existing);
    });

    const maxSales = Math.max(...Array.from(map.values()).map((v) => v.net_sales), 1);

    return Array.from(map.values())
      .map((item) => {
        const returnRatePct = item.net_sales > 0 ? (item.returns_amount / item.net_sales) * 100 : 0;
        return {
          category: item.category,
          net_sales: Math.round(item.net_sales),
          returns_amount: Math.round(item.returns_amount),
          return_rate_pct: Number(returnRatePct.toFixed(1)),
          sales_share_pct: Number(((item.net_sales / maxSales) * 100).toFixed(1)),
        };
      })
      .sort((a, b) => b.net_sales - a.net_sales);
  }, [records]);

  const formatCurrency = (value: number) => {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
    return `$${value}`;
  };

  return (
    <div id="visual-category-performance" className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Category Performance: Net Sales & Return Rate
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Grouped comparison of revenue volume against product return friction
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
            <button
              onClick={() => setViewMode('horizontal')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                viewMode === 'horizontal' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Grouped Horizontal
            </button>
            <button
              onClick={() => setViewMode('composed')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                viewMode === 'composed' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dual-Axis
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full pt-4 min-h-[300px]">
        {categoryData.length === 0 ? (
          <ChartEmptyState
            message="No Category Performance Data"
            subtext="No product categories match the selected filters or date range."
          />
        ) : viewMode === 'horizontal' ? (
          /* Grouped Horizontal View */
          <div className="space-y-3.5 pr-1">
            {categoryData.map((cat) => {
              const isHighReturn = cat.return_rate_pct > 10;
              return (
                <div key={cat.category} className="p-2.5 rounded-lg bg-slate-50/70 border border-slate-100 hover:bg-slate-100/60 transition-colors">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-800">{cat.category}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-600 font-medium">
                        Net Sales: <strong className="text-indigo-600 font-mono">${cat.net_sales.toLocaleString()}</strong>
                      </span>
                      <span className={`font-medium flex items-center gap-1 ${isHighReturn ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                        Return Rate: {cat.return_rate_pct}%
                        {isHighReturn && <AlertCircle className="w-3 h-3 text-rose-500 inline" />}
                      </span>
                    </div>
                  </div>

                  {/* Grouped Horizontal Visual Bars */}
                  <div className="space-y-1">
                    {/* Bar 1: Net Sales Volume */}
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span className="w-14 shrink-0">Sales ($)</span>
                      <div className="flex-1 bg-slate-200 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${cat.sales_share_pct}%` }}
                        ></div>
                      </div>
                      <span className="w-12 text-right font-mono font-medium text-slate-700">
                        {formatCurrency(cat.net_sales)}
                      </span>
                    </div>

                    {/* Bar 2: Return Rate (%) */}
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span className="w-14 shrink-0">Return (%)</span>
                      <div className="flex-1 bg-slate-200 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isHighReturn ? 'bg-rose-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(100, cat.return_rate_pct * 4)}%` }}
                        ></div>
                      </div>
                      <span className={`w-12 text-right font-mono font-medium ${isHighReturn ? 'text-rose-600 font-bold' : 'text-slate-700'}`}>
                        {cat.return_rate_pct}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Dual-Axis Composed Chart */
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={categoryData}
                margin={{ top: 10, right: 20, left: 10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="category"
                  angle={-15}
                  textAnchor="end"
                  interval={0}
                  tick={{ fill: '#475569', fontSize: 11 }}
                  stroke="#CBD5E1"
                  height={40}
                />
                <YAxis
                  yAxisId="left"
                  tickFormatter={formatCurrency}
                  tick={{ fill: '#475569', fontSize: 11 }}
                  stroke="#CBD5E1"
                  width={65}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fill: '#E11D48', fontSize: 11 }}
                  stroke="#FDA4AF"
                  domain={[0, 'auto']}
                  width={45}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-lg text-xs shadow-lg space-y-1">
                          <div className="font-semibold text-sm text-slate-100">{d.category}</div>
                          <div className="text-slate-300">
                            Net Sales: <span className="font-bold text-indigo-300">${d.net_sales.toLocaleString()}</span>
                          </div>
                          <div className="text-slate-300">
                            Returns: <span className="font-medium text-rose-300">${d.returns_amount.toLocaleString()}</span>
                          </div>
                          <div className="text-slate-300">
                            Return Rate: <span className="font-bold text-rose-400">{d.return_rate_pct}%</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="net_sales"
                  name="Net Sales ($)"
                  fill="#4F46E5"
                  radius={[4, 4, 0, 0]}
                  barSize={24}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="return_rate_pct"
                  name="Return Rate (%)"
                  stroke="#E11D48"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#E11D48' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
