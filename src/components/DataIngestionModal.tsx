import React, { useState } from 'react';
import { RawSalesRecord, RawStoreMaster, DataProcessingAudit } from '../types';
import {
  parseExcelFile,
  parseUploadedDatasetFiles,
  downloadSampleWeeklySalesExcel,
  downloadSampleStoreMasterExcel,
} from '../utils/excelParser';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Database,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';

interface DataIngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataIngested: (rawSales: RawSalesRecord[], storeMaster: RawStoreMaster[]) => void;
  onResetBenchmark: () => void;
  currentAudit: DataProcessingAudit;
}

export const DataIngestionModal: React.FC<DataIngestionModalProps> = ({
  isOpen,
  onClose,
  onDataIngested,
  onResetBenchmark,
  currentAudit,
}) => {
  const [salesFile, setSalesFile] = useState<File | null>(null);
  const [storeMasterFile, setStoreMasterFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleProcessUploads = async () => {
    if (!salesFile) {
      setStatusMessage({ type: 'error', text: 'Please select a retail_weekly_sales (.xlsx or .csv) file.' });
      return;
    }

    try {
      setIsProcessing(true);
      setStatusMessage({ type: 'info', text: 'Dynamically reading and parsing spreadsheets in memory...' });

      const filesToParse: File[] = [];
      if (salesFile) filesToParse.push(salesFile);
      if (storeMasterFile) filesToParse.push(storeMasterFile);

      const result = await parseUploadedDatasetFiles(filesToParse);

      if (!result.rawSales || result.rawSales.length === 0) {
        throw new Error('No valid sales records found. Ensure your file contains weekly sales columns.');
      }

      onDataIngested(result.rawSales, result.storeMaster || []);
      setStatusMessage({
        type: 'success',
        text: `Ingested ${result.rawSales.length.toLocaleString()} sales rows and linked ${result.storeMaster?.length || 0} stores!`,
      });

      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: `Error processing files: ${err instanceof Error ? err.message : 'Invalid spreadsheet format'}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Data Management & File Ingestion
              </h2>
              <p className="text-xs text-slate-500">
                Upload custom retail spreadsheets or load benchmark dataset
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Data processing rules reminder */}
        <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
            Automated Data Pipeline Compliance:
          </div>
          <ul className="list-disc pl-5 space-y-0.5 text-slate-600">
            <li><strong>Store Merge:</strong> Inner/left merges sales & store metadata on <code className="bg-slate-200/80 px-1 py-0.2 rounded text-[11px]">store_id</code>.</li>
            <li><strong>Missing Net Sales:</strong> Missing values imputed using <code className="bg-slate-200/80 px-1 py-0.2 rounded text-[11px]">gross_sales - discount_amount</code>.</li>
            <li><strong>Gross Sales Cleansing:</strong> Currency symbols ($), commas, and invalid non-numerics automatically sanitized.</li>
            <li><strong>Date Normalization:</strong> Serial numbers and non-standard dates standardized to ISO weekly start dates.</li>
          </ul>
        </div>

        {/* Current Active Pipeline Audit Stats */}
        <div className="mt-4 p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs">
          <div className="font-semibold text-indigo-950 mb-2 flex items-center justify-between">
            <span>Active Pipeline Processing Audit</span>
            <span className="text-[11px] font-normal text-indigo-700">Live Verification</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div className="p-2 rounded-lg bg-white border border-indigo-100/60">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Weekly Sales Rows</div>
              <div className="text-sm font-bold text-slate-800 mt-0.5">{currentAudit.rawSalesCount.toLocaleString()}</div>
            </div>
            <div className="p-2 rounded-lg bg-white border border-indigo-100/60">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Store Master Stores</div>
              <div className="text-sm font-bold text-slate-800 mt-0.5">{currentAudit.rawStoreMasterCount.toLocaleString()}</div>
            </div>
            <div className="p-2 rounded-lg bg-white border border-indigo-100/60">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Missing Net Sales Imputed</div>
              <div className="text-sm font-bold text-emerald-600 mt-0.5">{currentAudit.missingNetSalesFixedCount.toLocaleString()}</div>
            </div>
            <div className="p-2 rounded-lg bg-white border border-indigo-100/60">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Gross Sales Sanitized</div>
              <div className="text-sm font-bold text-indigo-600 mt-0.5">{currentAudit.cleanedGrossSalesCount.toLocaleString()}</div>
            </div>
            <div className="p-2 rounded-lg bg-white border border-indigo-100/60">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Dates Standardized</div>
              <div className="text-sm font-bold text-blue-600 mt-0.5">{currentAudit.invalidDatesHandledCount.toLocaleString()}</div>
            </div>
            <div className="p-2 rounded-lg bg-white border border-indigo-100/60">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Store Matches (store_id)</div>
              <div className="text-sm font-bold text-emerald-700 mt-0.5">{currentAudit.storesMatchedCount.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Upload Form */}
        <div className="mt-4 space-y-3">
          {/* File 1: retail_weekly_sales.xlsx */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              1. Retail Weekly Sales File (<span className="text-indigo-600">retail_weekly_sales.xlsx</span> or .csv) *
            </label>
            <div className="flex items-center gap-2">
              <label className="flex-1 flex items-center justify-between p-2.5 border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-xl cursor-pointer bg-slate-50/50 hover:bg-indigo-50/30 transition-colors">
                <div className="flex items-center gap-2 text-xs truncate">
                  <FileSpreadsheet className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className={salesFile ? 'font-semibold text-slate-800' : 'text-slate-500'}>
                    {salesFile ? salesFile.name : 'Choose or drop retail_weekly_sales file...'}
                  </span>
                </div>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 shrink-0">
                  Browse
                </span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => setSalesFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={downloadSampleWeeklySalesExcel}
                className="p-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 transition-colors shrink-0"
                title="Download sample retail_weekly_sales.xlsx"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* File 2: store_master.xlsx */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              2. Store Master File (<span className="text-indigo-600">store_master.xlsx</span> or .csv)
            </label>
            <div className="flex items-center gap-2">
              <label className="flex-1 flex items-center justify-between p-2.5 border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-xl cursor-pointer bg-slate-50/50 hover:bg-indigo-50/30 transition-colors">
                <div className="flex items-center gap-2 text-xs truncate">
                  <FileSpreadsheet className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className={storeMasterFile ? 'font-semibold text-slate-800' : 'text-slate-500'}>
                    {storeMasterFile ? storeMasterFile.name : 'Choose or drop store_master file (optional)...'}
                  </span>
                </div>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 shrink-0">
                  Browse
                </span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => setStoreMasterFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={downloadSampleStoreMasterExcel}
                className="p-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 transition-colors shrink-0"
                title="Download sample store_master.xlsx"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`mt-3 p-2.5 rounded-lg text-xs flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : statusMessage.type === 'error'
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : statusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onResetBenchmark();
              setStatusMessage({ type: 'success', text: 'Benchmark retail dataset reloaded!' });
              setTimeout(() => onClose(), 1000);
            }}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            Reset to Benchmark Dataset
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors flex-1 sm:flex-initial"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!salesFile || isProcessing}
              onClick={handleProcessUploads}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-xs flex items-center justify-center gap-1.5 flex-1 sm:flex-initial"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  Clean & Merge Data
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
