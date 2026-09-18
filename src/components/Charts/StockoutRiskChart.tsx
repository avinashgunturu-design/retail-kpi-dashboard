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
} from 'recharts';
import { RetailSalesRecord } from '../../types';
import { AlertTriangle, PackageX, Grid3X3, BarChart2 } from 'lucide-react';
import { ChartEmptyState } from './ChartEmptyState';

interface StockoutRiskChartProps {
  records: RetailSalesRecord[];
}

const FORMAT_COLORS: Record<string, string> = {
  Supermarket: '#4F46E5',
  Hypermarket: '#06B6D4',
  Express: '#F59E0B',
  Outlet: '#EC4899',
  Standard: '#64748B',
};

export const StockoutRiskChart: React.FC<StockoutRiskChartProps> = ({ records }) => {
  const [dimension, setDimension] = useState<'format' | 'region'>('format');
  const [viewType, setViewType] = useState<'heatmap' | 'bar'>('heatmap');

  const { chartData, secondaryKeys, heatmapMatrix, maxCount, totalStockoutEvents } = useMemo(() => {
    const secSet = new Set<string>();
    const catSet = new Set<string>();
    const countMap = new Map<string, Record<string, number>>();

    let events = 0;
    let maxVal = 0;

    records.forEach((r) => {
      const secKey = dimension === 'format' ? r.store_format : r.region;
      secSet.add(secKey);
      catSet.add(r.product_category);

      if (r.stockouts > 0) {
        events++;
      }

      const current = countMap.get(r.product_category) || {};
      const nextVal = (current[secKey] || 0) + r.stockouts;
      current[secKey] = nextVal;
      if (nextVal > maxVal) maxVal = nextVal;
      countMap.set(r.product_category, current);
    });

    const secondaries = Array.from(secSet).sort();
    const categories = Array.from(catSet).sort();

    // Bar chart data
    const barData = categories.map((cat) => {
      const row = countMap.get(cat) || {};
      let total = 0;
      secondaries.forEach((s) => {
        total += row[s] || 0;
      });
      return {
        category: cat,
        total,
        ...row,
      };
    });

    barData.sort((a, b) => b.total - a.total);

    // Heatmap matrix
    const matrix = categories.map((cat) => {
      const row = countMap.get(cat) || {};
      return {
        category: cat,
        cells: secondaries.map((sec) => ({
          dimension: sec,
          value: row[sec] || 0,
        })),
      };
    });

    return {
      chartData: barData,
      secondaryKeys: secondaries,
      heatmapMatrix: matrix,
      maxCount: Math.max(maxVal, 1),
      totalStockoutEvents: events,
    };
  }, [records, dimension]);

  const getHeatmapBg = (val: number, max: number) => {
    if (val === 0) return 'bg-slate-50 text-slate-400';
    const ratio = val / max;
    if (ratio > 0.7) return 'bg-rose-600 text-white font-bold';
    if (ratio > 0.4) return 'bg-rose-400 text-white font-semibold';
    if (ratio > 0.2) return 'bg-amber-300 text-amber-950 font-medium';
    return 'bg-amber-100 text-amber-900';
  };

  return (
    <div id="visual-stockout-risk" className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600">
            <PackageX className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Stockout Risk: Store Formats & Categories
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Heatmap and distribution of out-of-stock events across retail channels
            </p>
          </div>
        </div>

        {/* View Mode & Dimension Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Dimension toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
            <button
              onClick={() => setDimension('format')}
              className={`px-2 py-1 rounded-md transition-colors ${
                dimension === 'format' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              By Store Format
            </button>
            <button
              onClick={() => setDimension('region')}
              className={`px-2 py-1 rounded-md transition-colors ${
                dimension === 'region' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              By Region
            </button>
          </div>

          {/* Visualization Type */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
            <button
              onClick={() => setViewType('heatmap')}
              className={`px-2 py-1 rounded-md transition-colors flex items-center gap-1 ${
                viewType === 'heatmap' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Heatmap matrix view"
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>Heatmap</span>
            </button>
            <button
              onClick={() => setViewType('bar')}
              className={`px-2 py-1 rounded-md transition-colors flex items-center gap-1 ${
                viewType === 'bar' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Stacked bar chart view"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Bar Chart</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full pt-4 min-h-[280px]">
        {chartData.length === 0 ? (
          <ChartEmptyState
            message="No Stockout Occurrences"
            subtext="No inventory stockouts recorded for the selected store formats and categories."
          />
        ) : viewType === 'heatmap' ? (
          /* Heatmap Matrix View */
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70">
                  <th className="py-2.5 px-3 font-semibold text-slate-700">Product Category</th>
                  {secondaryKeys.map((sec) => (
                    <th key={sec} className="py-2.5 px-3 font-semibold text-slate-700 text-center">
                      {sec}
                    </th>
                  ))}
                  <th className="py-2.5 px-3 font-semibold text-slate-700 text-right">Total Out-of-Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {heatmapMatrix.map((row) => {
                  const rowTotal = row.cells.reduce((acc, c) => acc + c.value, 0);
                  return (
                    <tr key={row.category} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-medium text-slate-900">{row.category}</td>
                      {row.cells.map((cell) => (
                        <td key={cell.dimension} className="py-1.5 px-2 text-center">
                          <span
                            className={`inline-block w-full py-1.5 px-2 rounded text-[11px] transition-colors ${getHeatmapBg(
                              cell.value,
                              maxCount
                            )}`}
                            title={`${row.category} in ${cell.dimension}: ${cell.value} stockout events`}
                          >
                            {cell.value > 0 ? cell.value : '-'}
                          </span>
                        </td>
                      ))}
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800">
                        {rowTotal.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <span>Intensity Legend:</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px]">Zero</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px]">Low</span>
                <span className="px-1.5 py-0.5 rounded bg-rose-400 text-white text-[10px]">Medium</span>
                <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px]">Critical</span>
              </div>
              <div>
                Total Occurrences: <span className="font-semibold text-slate-700">{totalStockoutEvents} events</span>
              </div>
            </div>
          </div>
        ) : (
          /* Stacked Bar Chart View */
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
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
                  tick={{ fill: '#475569', fontSize: 11 }}
                  stroke="#CBD5E1"
                  width={45}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const row = chartData.find((d) => d.category === label);
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-lg text-xs shadow-lg space-y-1">
                          <div className="font-semibold text-sm text-slate-100">{label}</div>
                          <div className="text-orange-300 font-bold mb-1">
                            Total Stockouts: {row?.total || 0}
                          </div>
                          <div className="border-t border-slate-800 pt-1 space-y-0.5">
                            {payload.map((entry: any) => (
                              <div key={entry.name} className="flex justify-between gap-3 text-slate-300">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
                                  {entry.name}:
                                </span>
                                <span className="font-mono font-medium">{entry.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                />
                {secondaryKeys.map((secKey, idx) => (
                  <Bar
                    key={secKey}
                    dataKey={secKey}
                    name={secKey}
                    stackId="stockoutStack"
                    fill={
                      dimension === 'format'
                        ? FORMAT_COLORS[secKey] || '#6366F1'
                        : ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#64748B'][idx % 6]
                    }
                    radius={[0, 0, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
