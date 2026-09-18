import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  RotateCcw,
  ShieldCheck,
  FileCheck,
  Activity,
  Layers,
} from 'lucide-react';
import { DataProcessingAudit, RawSalesRecord, RawStoreMaster } from '../types';
import {
  parseExcelFile,
  parseUploadedDatasetFiles,
  downloadSampleWeeklySalesExcel,
  downloadSampleStoreMasterExcel,
} from '../utils/excelParser';
import { generateBenchmarkSalesData, sampleStoreMaster } from '../data/sampleData';

interface FileUploadBannerProps {
  audit: DataProcessingAudit;
  onDataIngested: (sales: RawSalesRecord[], stores: RawStoreMaster[]) => void;
  onResetBenchmark: () => void;
}

export const FileUploadBanner: React.FC<FileUploadBannerProps> = ({
  audit,
  onDataIngested,
  onResetBenchmark,
}) => {
  // Default to false so the user immediately sees their KPIs and charts!
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [salesFileName, setSalesFileName] = useState<string | null>(null);
  const [storeFileName, setStoreFileName] = useState<string | null>(null);

  const handleSalesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatusMessage(`Parsing "${file.name}" in memory...`);
    setSalesFileName(file.name);

    try {
      const records = await parseExcelFile<RawSalesRecord>(file);
      setStatusMessage(`Loaded ${records.length.toLocaleString()} rows from ${file.name}.`);
      onDataIngested(records, []);
    } catch (err: any) {
      alert(`Error parsing Excel: ${err.message || 'Invalid format'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStoresUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatusMessage(`Parsing store master "${file.name}"...`);
    setStoreFileName(file.name);

    try {
      const stores = await parseExcelFile<RawStoreMaster>(file);
      setStatusMessage(`Loaded ${stores.length} stores from ${file.name}.`);
      onDataIngested([], stores);
    } catch (err: any) {
      alert(`Error parsing Store Master: ${err.message || 'Invalid format'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetToBenchmark = () => {
    setLoading(true);
    setStatusMessage('Restoring benchmark dataset (1,920 rows across 20 stores)...');
    setTimeout(() => {
      const benchmarkSales = generateBenchmarkSalesData();
      const benchmarkStores = sampleStoreMaster;
      onDataIngested(benchmarkSales, benchmarkStores);
      setSalesFileName(null);
      setStoreFileName(null);
      setLoading(false);
      setStatusMessage('Benchmark dataset restored.');
      onResetBenchmark();
    }, 250);
  };

  const unmatchedStores = Math.max(0, audit.rawStoreMasterCount - audit.storesMatchedCount);

  return (
    <div className="mb-6 bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden transition-all duration-200">
      {/* Compact Status Bar (always visible) */}
      <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="truncate text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">
                Active Dataset: {audit.rawSalesCount.toLocaleString()} weekly sales records
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {audit.storesMatchedCount} stores matched (100%)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden md:block truncate mt-0.5">
              In-memory join on <code className="font-mono text-indigo-600">store_id</code> • Cleaned {audit.cleanedGrossSalesCount} formatted sales • Imputed {audit.missingNetSalesFixedCount} missing values
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>{isExpanded ? 'Hide Data Settings' : 'Data Pipeline & Audit'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* Expanded Pipeline Details & Dropzone */}
      {isExpanded && (
        <div className="p-4 sm:p-5 bg-slate-50/70 border-t border-slate-100">
          {/* Audit Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="p-3 bg-white rounded-lg border border-slate-200/80 shadow-2xs">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Records</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">{audit.rawSalesCount.toLocaleString()}</div>
              <div className="text-[11px] text-emerald-600 mt-0.5">100% In-Memory</div>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200/80 shadow-2xs">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Matched Stores</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">{audit.storesMatchedCount} / {audit.rawStoreMasterCount}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{unmatchedStores} unmatched</div>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200/80 shadow-2xs">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Net Sales Imputed</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">{audit.missingNetSalesFixedCount}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Gross - Discount applied</div>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200/80 shadow-2xs">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Dates Normalized</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">{audit.invalidDatesHandledCount}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Standard ISO format</div>
            </div>
          </div>

          {/* Quick Upload Panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-slate-900">
                    Replace Weekly Sales (retail_weekly_sales.xlsx)
                  </span>
                  <button
                    type="button"
                    onClick={downloadSampleWeeklySalesExcel}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    Template
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mb-3">
                  Upload a new spreadsheet to replace active weekly sales data dynamically.
                </p>
              </div>

              <label className="block border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-lg p-3 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-indigo-50/20">
                <Upload className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
                <span className="text-xs font-medium text-slate-700 block truncate">
                  {salesFileName ? `Loaded: ${salesFileName}` : 'Choose or drop sales spreadsheet'}
                </span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleSalesUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-slate-900">
                    Update Store Master (store_master.xlsx)
                  </span>
                  <button
                    type="button"
                    onClick={downloadSampleStoreMasterExcel}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    Template
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mb-3">
                  Update store dimension metadata (store_id, region, city, store_format).
                </p>
              </div>

              <label className="block border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-lg p-3 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-indigo-50/20">
                <Upload className="w-4 h-4 text-slate-500 mx-auto mb-1" />
                <span className="text-xs font-medium text-slate-700 block truncate">
                  {storeFileName ? `Loaded: ${storeFileName}` : 'Choose or drop store master'}
                </span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleStoresUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-200/80 text-xs gap-2">
            <div className="text-slate-600 text-[11px]">
              {loading ? (
                <span className="inline-flex items-center gap-1.5 font-medium text-indigo-600 animate-pulse">
                  <Activity className="w-3.5 h-3.5" />
                  Processing spreadsheet in memory...
                </span>
              ) : statusMessage ? (
                <span className="text-indigo-700 font-medium">{statusMessage}</span>
              ) : (
                <span className="text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  No server persistence: All calculations execute strictly in your local browser sandbox.
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleResetToBenchmark}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 text-slate-500" />
              <span>Reset to Standard Benchmark (1.92k rows)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
