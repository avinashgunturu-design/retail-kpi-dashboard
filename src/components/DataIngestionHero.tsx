import React, { useState, useEffect, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  Download,
  ArrowRight,
  Database,
  Building2,
  RefreshCw,
  FileCheck,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { RawSalesRecord, RawStoreMaster } from '../types';
import {
  parseExcelFile,
  parseUploadedDatasetFiles,
  downloadSampleWeeklySalesExcel,
  downloadSampleStoreMasterExcel,
} from '../utils/excelParser';
import { generateBenchmarkSalesData, sampleStoreMaster } from '../data/sampleData';

interface DataIngestionHeroProps {
  onGenerate: (sales: RawSalesRecord[], stores: RawStoreMaster[]) => void;
}

export const DataIngestionHero: React.FC<DataIngestionHeroProps> = ({ onGenerate }) => {
  const [salesFile, setSalesFile] = useState<File | null>(null);
  const [storeFile, setStoreFile] = useState<File | null>(null);

  const [salesParsedData, setSalesParsedData] = useState<RawSalesRecord[] | null>(null);
  const [storeParsedData, setStoreParsedData] = useState<RawStoreMaster[] | null>(null);

  const [isDraggingOverall, setIsDraggingOverall] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const salesInputRef = useRef<HTMLInputElement>(null);
  const storeInputRef = useRef<HTMLInputElement>(null);
  const multiInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Press Enter to generate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !isProcessing) {
        handleGenerateClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [salesParsedData, storeParsedData, salesFile, storeFile, isProcessing]);

  // Handle sales file upload
  const handleSalesFileSelect = async (file: File) => {
    setErrorMessage(null);
    setSalesFile(file);
    setStatusMessage(`Parsing "${file.name}" in memory...`);
    try {
      const records = await parseExcelFile<RawSalesRecord>(file);
      if (!records || records.length === 0) {
        throw new Error('Spreadsheet appears to be empty or has no recognizable data rows.');
      }
      setSalesParsedData(records);
      setStatusMessage(`Parsed ${records.length.toLocaleString()} rows from "${file.name}". Ready to generate!`);
    } catch (err: any) {
      setErrorMessage(`Error parsing sales file: ${err.message || 'Invalid format'}`);
    }
  };

  // Handle store master file upload
  const handleStoreFileSelect = async (file: File) => {
    setErrorMessage(null);
    setStoreFile(file);
    try {
      const stores = await parseExcelFile<RawStoreMaster>(file);
      setStoreParsedData(stores);
      setStatusMessage(`Parsed ${stores.length} stores from "${file.name}".`);
    } catch (err: any) {
      setErrorMessage(`Error parsing store master file: ${err.message || 'Invalid format'}`);
    }
  };

  // Handle multi-file drop or selection
  const handleFilesIngestion = async (files: FileList | File[]) => {
    setErrorMessage(null);
    setIsProcessing(true);
    setStatusMessage('Reading and parsing uploaded files in memory...');

    try {
      const result = await parseUploadedDatasetFiles(files);
      if (result.rawSales && result.rawSales.length > 0) {
        setSalesParsedData(result.rawSales);
        setSalesFile(new File([], 'Uploaded_Sales.xlsx'));
      }
      if (result.storeMaster && result.storeMaster.length > 0) {
        setStoreParsedData(result.storeMaster);
        setStoreFile(new File([], 'Uploaded_StoreMaster.xlsx'));
      }

      setStatusMessage(
        `Parsed ${result.salesCount.toLocaleString()} sales rows and linked ${result.storeCount} stores.`
      );
    } catch (err: any) {
      setErrorMessage(`File ingestion error: ${err.message || 'Failed to parse'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Click handler to trigger generation
  const handleGenerateClick = () => {
    if (isProcessing) return;

    if (!salesParsedData || salesParsedData.length === 0) {
      setErrorMessage('Please upload retail_weekly_sales.xlsx or click "Load Benchmark Dataset" to begin.');
      return;
    }

    setIsProcessing(true);
    setStatusMessage('Cleaning records, joining store dimensions, and computing KPIs...');

    setTimeout(() => {
      let storesToUse = storeParsedData || [];
      if (storesToUse.length === 0) {
        const extracted = new Map<string, RawStoreMaster>();
        salesParsedData.forEach((r) => {
          const id = String(r.store_id || '').trim();
          if (id && !extracted.has(id.toUpperCase())) {
            extracted.set(id.toUpperCase(), {
              store_id: id,
              store_name: r.store_name ? String(r.store_name).trim() : `Store ${id}`,
              region: r.region ? String(r.region).trim() : 'Unknown',
              city: r.city ? String(r.city).trim() : 'Unknown',
              store_format: r.store_format ? String(r.store_format).trim() : 'Standard',
            });
          }
        });
        if (extracted.size > 0) {
          storesToUse = Array.from(extracted.values());
        }
      }

      onGenerate(salesParsedData, storesToUse);
      setIsProcessing(false);
    }, 350);
  };

  // Quick Benchmark Loader
  const handleLoadBenchmark = () => {
    setIsProcessing(true);
    setStatusMessage('Loading benchmark dataset (1,920 rows across 20 stores)...');
    setTimeout(() => {
      const benchmarkSales = generateBenchmarkSalesData();
      const benchmarkStores = sampleStoreMaster;
      onGenerate(benchmarkSales, benchmarkStores);
      setIsProcessing(false);
    }, 250);
  };

  const hasStagedData = Boolean(salesParsedData && salesParsedData.length > 0);

  return (
    <div className="w-full max-w-4xl mx-auto py-8 sm:py-14 px-4">
      {/* Header Section */}
      <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-3">
          <Zap className="w-3.5 h-3.5 text-indigo-600" />
          <span>Client In-Memory Analytics Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          Retail Sales Intelligence
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Upload your retail sales and store master spreadsheets to generate live executive KPI metrics, weekly trends, regional dynamics, and inventory risks.
        </p>
      </div>

      {/* Primary Ingestion Card */}
      <div
        className={`bg-white rounded-2xl border transition-all duration-200 shadow-sm overflow-hidden ${
          isDraggingOverall
            ? 'border-indigo-500 ring-4 ring-indigo-500/10'
            : 'border-slate-200'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOverall(true);
        }}
        onDragLeave={() => setIsDraggingOverall(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDraggingOverall(false);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFilesIngestion(e.dataTransfer.files);
          }
        }}
      >
        <div className="p-6 sm:p-8 space-y-6">
          {/* Dual File Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* File 1: Weekly Sales Sheet */}
            <div
              className={`p-5 rounded-xl border transition-all flex flex-col justify-between ${
                salesParsedData
                  ? 'bg-emerald-50/40 border-emerald-300'
                  : 'bg-slate-50/60 border-slate-200 hover:border-indigo-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                        salesParsedData ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
                      }`}
                    >
                      1
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        retail_weekly_sales.xlsx
                        <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          Required
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Transactions, footfall, gross/net sales, targets
                      </p>
                    </div>
                  </div>
                </div>

                {salesParsedData ? (
                  <div className="p-3 bg-white rounded-lg border border-emerald-200 flex items-center justify-between mb-3 shadow-xs">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div className="truncate text-xs">
                        <div className="font-semibold text-slate-900 truncate">
                          {salesFile?.name || 'Weekly Sales Spreadsheet'}
                        </div>
                        <div className="text-[11px] text-emerald-700 font-medium">
                          {salesParsedData.length.toLocaleString()} rows verified
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => salesInputRef.current?.click()}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => salesInputRef.current?.click()}
                    className="p-4 border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl text-center cursor-pointer transition-colors bg-white hover:bg-indigo-50/20 mb-3"
                  >
                    <Upload className="w-5 h-5 text-indigo-600 mx-auto mb-1.5" />
                    <span className="text-xs font-semibold text-slate-800 block">
                      Choose or drop sales spreadsheet
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Accepts .xlsx, .xls, or .csv
                    </span>
                  </div>
                )}

                <input
                  ref={salesInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleSalesFileSelect(f);
                  }}
                  className="hidden"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200/80 text-[11px]">
                <span className="text-slate-500">Need template?</span>
                <button
                  type="button"
                  onClick={downloadSampleWeeklySalesExcel}
                  className="text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Download Sample (1,920 rows)
                </button>
              </div>
            </div>

            {/* File 2: Store Master */}
            <div
              className={`p-5 rounded-xl border transition-all flex flex-col justify-between ${
                storeParsedData
                  ? 'bg-emerald-50/40 border-emerald-300'
                  : 'bg-slate-50/60 border-slate-200 hover:border-indigo-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                        storeParsedData ? 'bg-emerald-600 text-white' : 'bg-slate-500 text-white'
                      }`}
                    >
                      2
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        store_master.xlsx
                        <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          Optional
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        store_id, region, city, store_format
                      </p>
                    </div>
                  </div>
                </div>

                {storeParsedData ? (
                  <div className="p-3 bg-white rounded-lg border border-emerald-200 flex items-center justify-between mb-3 shadow-xs">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div className="truncate text-xs">
                        <div className="font-semibold text-slate-900 truncate">
                          {storeFile?.name || 'Store Master Spreadsheet'}
                        </div>
                        <div className="text-[11px] text-emerald-700 font-medium">
                          {storeParsedData.length} stores linked
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => storeInputRef.current?.click()}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => storeInputRef.current?.click()}
                    className="p-4 border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl text-center cursor-pointer transition-colors bg-white hover:bg-indigo-50/20 mb-3"
                  >
                    <Building2 className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
                    <span className="text-xs font-semibold text-slate-800 block">
                      Choose or drop store_master.xlsx
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Auto-extracted if columns are present in sales sheet
                    </span>
                  </div>
                )}

                <input
                  ref={storeInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleStoreFileSelect(f);
                  }}
                  className="hidden"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200/80 text-[11px]">
                <span className="text-slate-500">Need template?</span>
                <button
                  type="button"
                  onClick={downloadSampleStoreMasterExcel}
                  className="text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Download Sample (20 stores)
                </button>
              </div>
            </div>
          </div>

          {/* Quick Dropzone for Multi-file */}
          <div
            onClick={() => multiInputRef.current?.click()}
            className="p-3.5 rounded-xl border border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/40 hover:bg-indigo-50/10 text-center cursor-pointer transition-colors"
          >
            <input
              ref={multiInputRef}
              type="file"
              multiple
              accept=".xlsx, .xls, .csv"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFilesIngestion(e.target.files);
                }
              }}
              className="hidden"
            />
            <p className="text-xs text-slate-500">
              💡 Tip: Drag and drop both files simultaneously or a workbook with multiple tabs.
            </p>
          </div>

          {/* Alerts / Feedback */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {statusMessage && !errorMessage && (
            <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-900 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="font-medium">{statusMessage}</span>
            </div>
          )}

          {/* Actions Bar */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500 text-center sm:text-left">
              {hasStagedData ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Ready to calculate metrics for {salesParsedData?.length.toLocaleString()} rows. Press Enter ↵
                </span>
              ) : (
                <span>Upload your sales spreadsheet to activate dashboard generation.</span>
              )}
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleLoadBenchmark}
                disabled={isProcessing}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                title="Explore dashboard with the benchmark 1,920 rows & 20 stores dataset"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isProcessing ? 'animate-spin' : ''}`} />
                <span>Load Benchmark Data</span>
              </button>

              <button
                type="button"
                id="btn-generate-dashboard"
                onClick={handleGenerateClick}
                disabled={!hasStagedData || isProcessing}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  hasStagedData && !isProcessing
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-xs active:scale-98'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>{isProcessing ? 'Processing...' : 'Generate Dashboard'}</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-mono">
                  Enter ↵
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-900 mb-0.5">100% In-Memory</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Data is parsed and joined in browser memory with zero external server storage.
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
            <Zap className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-900 mb-0.5">Automated Cleaning</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Imputes missing net sales, handles invalid date strings, and cleans numeric fields.
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center mb-2">
            <Database className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-900 mb-0.5">Dynamic BI Metrics</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Generates 7 executive KPIs, automated insights, and 5 interactive charts instantly.
          </p>
        </div>
      </div>
    </div>
  );
};
