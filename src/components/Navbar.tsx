import React from 'react';
import {
  BarChart3,
  Download,
  Database,
  Table as TableIcon,
  CheckCircle2,
  Upload,
} from 'lucide-react';
import { DataProcessingAudit } from '../types';

interface NavbarProps {
  audit?: DataProcessingAudit;
  activeCount?: number;
  totalCount?: number;
  hasDataset: boolean;
  onOpenIngestion: () => void;
  onOpenTableView: () => void;
  onExportCSV: () => void;
  onUploadNew?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  audit,
  activeCount = 0,
  totalCount = 0,
  hasDataset,
  onOpenIngestion,
  onOpenTableView,
  onExportCSV,
  onUploadNew,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Retail Sales Intelligence Platform
                </h1>
                {hasDataset && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    Live Dashboard
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Weekly sales, store targets, inventory risks & automated intelligence
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2">
            {hasDataset ? (
              <>
                {/* Upload New / Change Dataset Button */}
                <button
                  onClick={onUploadNew || onOpenIngestion}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-300 text-xs text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/40 transition-colors flex items-center gap-1.5"
                  title="Upload a new Excel dataset"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="hidden sm:inline font-medium">New Dataset</span>
                </button>

                {/* Cleansed Pipeline Status Tooltip / Button */}
                <button
                  onClick={onOpenIngestion}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-300 text-xs text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/40 transition-colors flex items-center gap-1.5"
                  title="Manage data sources, upload retail_weekly_sales.xlsx or store_master.xlsx"
                >
                  <Database className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="hidden md:inline font-medium">Data Pipeline</span>
                  {audit && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                      {audit.storesMatchedCount} Stores
                    </span>
                  )}
                </button>

                {/* View Cleansed Data Table */}
                <button
                  onClick={onOpenTableView}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                  title="Inspect cleansed records table"
                >
                  <TableIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Data Table</span>
                </button>

                {/* Export CSV Button */}
                <button
                  id="export-csv-btn"
                  onClick={onExportCSV}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                  title="Export filtered dataset to CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </>
            ) : (
              <div className="text-xs text-slate-400 italic">
                Awaiting dataset upload...
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
