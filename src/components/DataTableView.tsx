import React, { useState, useMemo } from 'react';
import { RetailSalesRecord } from '../types';
import { X, Search, ArrowUpDown, Download, Table as TableIcon } from 'lucide-react';
import { exportToCSV } from '../utils/dataProcessor';

interface DataTableViewProps {
  isOpen: boolean;
  onClose: () => void;
  records: RetailSalesRecord[];
}

export const DataTableView: React.FC<DataTableViewProps> = ({
  isOpen,
  onClose,
  records,
}) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [sortField, setSortField] = useState<keyof RetailSalesRecord>('week_start_date');
  const [sortAsc, setSortAsc] = useState(true);

  if (!isOpen) return null;

  const filtered = useMemo(() => {
    let result = records;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.store_name.toLowerCase().includes(q) ||
          r.store_id.toLowerCase().includes(q) ||
          r.region.toLowerCase().includes(q) ||
          r.city.toLowerCase().includes(q) ||
          r.product_category.toLowerCase().includes(q) ||
          r.week_start_date.includes(q)
      );
    }

    return [...result].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortAsc ? aVal - bVal : bVal - aVal;
      }
      return sortAsc
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [records, search, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPageRecords = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (field: keyof RetailSalesRecord) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // default desc for metric comparison
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6">
      <div className="bg-white rounded-2xl w-full max-w-7xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <TableIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Merged & Cleansed Retail Dataset
              </h2>
              <p className="text-xs text-slate-500">
                Viewing {filtered.length} active filtered records across all dimensional attributes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportToCSV(filtered, 'retail_cleansed_table.csv')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download CSV
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Pagination Bar */}
        <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search store, city, category..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 w-full sm:w-auto justify-between sm:justify-end">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-2.5 py-1 rounded bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-2.5 py-1 rounded bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 z-10 select-none">
              <tr>
                <th onClick={() => handleSort('week_start_date')} className="p-2.5 cursor-pointer hover:bg-slate-200 whitespace-nowrap">
                  Week Date <ArrowUpDown className="inline w-3 h-3 ml-0.5" />
                </th>
                <th onClick={() => handleSort('store_name')} className="p-2.5 cursor-pointer hover:bg-slate-200 whitespace-nowrap">
                  Store <ArrowUpDown className="inline w-3 h-3 ml-0.5" />
                </th>
                <th onClick={() => handleSort('region')} className="p-2.5 cursor-pointer hover:bg-slate-200 whitespace-nowrap">
                  Region <ArrowUpDown className="inline w-3 h-3 ml-0.5" />
                </th>
                <th onClick={() => handleSort('city')} className="p-2.5 cursor-pointer hover:bg-slate-200 whitespace-nowrap">
                  City <ArrowUpDown className="inline w-3 h-3 ml-0.5" />
                </th>
                <th onClick={() => handleSort('store_format')} className="p-2.5 cursor-pointer hover:bg-slate-200 whitespace-nowrap">
                  Format <ArrowUpDown className="inline w-3 h-3 ml-0.5" />
                </th>
                <th onClick={() => handleSort('product_category')} className="p-2.5 cursor-pointer hover:bg-slate-200 whitespace-nowrap">
                  Category <ArrowUpDown className="inline w-3 h-3 ml-0.5" />
                </th>
                <th onClick={() => handleSort('gross_sales')} className="p-2.5 text-right cursor-pointer hover:bg-slate-200 whitespace-nowrap">
                  Gross Sales <ArrowUpDown className="inline w-3 h-3 ml-0.5" />
                </th>
                <th onClick={() => handleSort('discount_amount')} className="p-2.5 text-right cursor-pointer hover:bg-slate-200 whitespace-nowrap">
                  Discount <ArrowUpDown className="inline w-3 h-3 ml-0.5" />
                </th>
                <th onClick={() => handleSort('net_sales')} className="p-2.5 text-right cursor-pointer hover:bg-slate-200 whitespace-nowrap text-indigo-700">
                  Net Sales <ArrowUpDown className="inline w-3 h-3 ml-0.5" />
                </th>
                <th onClick={() => handleSort('sales_target')} className="p-2.5 text-right cursor-pointer hover:bg-slate-200 whitespace-nowrap">
                  Target <ArrowUpDown className="inline w-3 h-3 ml-0.5" />
                </th>
                <th onClick={() => handleSort('target_achievement_pct')} className="p-2.5 text-right cursor-pointer hover:bg-slate-200 whitespace-nowrap">
                  Achieve % <ArrowUpDown className="inline w-3 h-3 ml-0.5" />
                </th>
                <th onClick={() => handleSort('transactions')} className="p-2.5 text-right cursor-pointer hover:bg-slate-200 whitespace-nowrap">
                  Transactions <ArrowUpDown className="inline w-3 h-3 ml-0.5" />
                </th>
                <th onClick={() => handleSort('atv')} className="p-2.5 text-right cursor-pointer hover:bg-slate-200 whitespace-nowrap">
                  ATV <ArrowUpDown className="inline w-3 h-3 ml-0.5" />
                </th>
                <th onClick={() => handleSort('returns_amount')} className="p-2.5 text-right cursor-pointer hover:bg-slate-200 whitespace-nowrap">
                  Returns <ArrowUpDown className="inline w-3 h-3 ml-0.5" />
                </th>
                <th onClick={() => handleSort('stockouts')} className="p-2.5 text-right cursor-pointer hover:bg-slate-200 whitespace-nowrap text-orange-700">
                  Stockouts <ArrowUpDown className="inline w-3 h-3 ml-0.5" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {currentPageRecords.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-2.5 font-mono text-slate-600 whitespace-nowrap">{r.week_start_date}</td>
                  <td className="p-2.5 font-medium text-slate-900 whitespace-nowrap">
                    <div>{r.store_name}</div>
                    <div className="text-[10px] text-slate-400">{r.store_id}</div>
                  </td>
                  <td className="p-2.5 whitespace-nowrap">{r.region}</td>
                  <td className="p-2.5 whitespace-nowrap">{r.city}</td>
                  <td className="p-2.5 whitespace-nowrap">
                    <span className="px-1.5 py-0.5 text-[10px] rounded bg-slate-100 font-medium">
                      {r.store_format}
                    </span>
                  </td>
                  <td className="p-2.5 whitespace-nowrap">{r.product_category}</td>
                  <td className="p-2.5 text-right font-mono">${r.gross_sales.toLocaleString()}</td>
                  <td className="p-2.5 text-right font-mono text-amber-700">-${r.discount_amount.toLocaleString()}</td>
                  <td className="p-2.5 text-right font-mono font-semibold text-indigo-600">${r.net_sales.toLocaleString()}</td>
                  <td className="p-2.5 text-right font-mono text-slate-600">${r.sales_target.toLocaleString()}</td>
                  <td className="p-2.5 text-right">
                    <span
                      className={`font-semibold px-1.5 py-0.5 rounded text-[11px] ${
                        r.target_achievement_pct >= 100
                          ? 'bg-emerald-50 text-emerald-700'
                          : r.target_achievement_pct >= 90
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {r.target_achievement_pct}%
                    </span>
                  </td>
                  <td className="p-2.5 text-right font-mono">{r.transactions.toLocaleString()}</td>
                  <td className="p-2.5 text-right font-mono">${r.atv.toFixed(2)}</td>
                  <td className="p-2.5 text-right font-mono text-rose-600">${r.returns_amount.toLocaleString()}</td>
                  <td className="p-2.5 text-right font-mono font-medium text-orange-600">{r.stockouts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
