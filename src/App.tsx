import React, { useState, useMemo, useEffect } from 'react';
import {
  RawSalesRecord,
  RawStoreMaster,
  RetailSalesRecord,
  FilterState,
} from './types';
import { sampleStoreMaster, generateBenchmarkSalesData } from './data/sampleData';
import {
  mergeAndProcessData,
  calculateKPISummary,
  generateBusinessInsights,
  exportToCSV,
  exportInsightsToCSV,
} from './utils/dataProcessor';
import { Navbar } from './components/Navbar';
import { SidebarFilters } from './components/SidebarFilters';
import { KPICards } from './components/KPICards';
import { BusinessInsights } from './components/BusinessInsights';
import { SalesTrendChart } from './components/Charts/SalesTrendChart';
import { RegionalSalesChart } from './components/Charts/RegionalSalesChart';
import { CategoryPerformanceChart } from './components/Charts/CategoryPerformanceChart';
import { StoreLeaderboard } from './components/Charts/StoreLeaderboard';
import { StockoutRiskChart } from './components/Charts/StockoutRiskChart';
import { FileUploadBanner } from './components/FileUploadBanner';
import { DataIngestionHero } from './components/DataIngestionHero';
import { DataIngestionModal } from './components/DataIngestionModal';
import { DataTableView } from './components/DataTableView';
import { Download, FileSpreadsheet, Eye, FilterX, RotateCcw, Upload } from 'lucide-react';

export default function App() {
  // 1. Raw Data State - Starts EMPTY until the user provides the Excel file & clicks enter/generate!
  const [rawSales, setRawSales] = useState<RawSalesRecord[]>([]);
  const [storeMaster, setStoreMaster] = useState<RawStoreMaster[]>([]);
  const [isGenerated, setIsGenerated] = useState<boolean>(false);

  // 2. Modals state
  const [isIngestionOpen, setIsIngestionOpen] = useState(false);
  const [isTableViewOpen, setIsTableViewOpen] = useState(false);

  // 3. Process & Merge Pipeline
  const { data: processedRecords, audit } = useMemo(() => {
    return mergeAndProcessData(rawSales, storeMaster);
  }, [rawSales, storeMaster]);

  // 4. Initial filter state
  const [filters, setFilters] = useState<FilterState>({
    weekStartDates: [],
    regions: [],
    cities: [],
    storeFormats: [],
    storeNames: [],
    productCategories: [],
    startDate: '',
    endDate: '',
  });

  // Keep filters in sync when records are generated or updated
  useEffect(() => {
    if (processedRecords.length > 0) {
      const dates = processedRecords
        .map((r) => r.week_start_date)
        .filter(Boolean)
        .sort();

      setFilters((prev) => ({
        ...prev,
        startDate: prev.startDate && dates.includes(prev.startDate) ? prev.startDate : dates[0] || '',
        endDate: prev.endDate && dates.includes(prev.endDate) ? prev.endDate : dates[dates.length - 1] || '',
      }));
    }
  }, [processedRecords]);

  // 5. Filter application
  const filteredRecords = useMemo(() => {
    return processedRecords.filter((r) => {
      // Date filter: check multi-select first, then range
      if (filters.weekStartDates && filters.weekStartDates.length > 0) {
        if (!filters.weekStartDates.includes(r.week_start_date)) return false;
      } else {
        if (filters.startDate && r.week_start_date < filters.startDate) return false;
        if (filters.endDate && r.week_start_date > filters.endDate) return false;
      }

      // Multi-select filters
      if (filters.regions.length > 0 && !filters.regions.includes(r.region)) return false;
      if (filters.cities.length > 0 && !filters.cities.includes(r.city)) return false;
      if (filters.storeFormats.length > 0 && !filters.storeFormats.includes(r.store_format)) return false;
      if (filters.storeNames.length > 0 && !filters.storeNames.includes(r.store_name)) return false;
      if (filters.productCategories.length > 0 && !filters.productCategories.includes(r.product_category)) return false;

      return true;
    });
  }, [processedRecords, filters]);

  // 6. Metrics & Business Insights
  const kpiSummary = useMemo(() => calculateKPISummary(filteredRecords), [filteredRecords]);
  const businessInsights = useMemo(() => generateBusinessInsights(filteredRecords), [filteredRecords]);

  // 7. Handler when user submits/generates from the primary Ingestion screen
  const handleGenerateData = (newSales: RawSalesRecord[], newStores: RawStoreMaster[]) => {
    setRawSales(newSales);
    setStoreMaster(newStores);
    setIsGenerated(true);

    const { data: cleaned } = mergeAndProcessData(newSales, newStores);
    const dates = cleaned.map((r) => r.week_start_date).filter(Boolean).sort();
    setFilters({
      weekStartDates: [],
      regions: [],
      cities: [],
      storeFormats: [],
      storeNames: [],
      productCategories: [],
      startDate: dates[0] || '',
      endDate: dates[dates.length - 1] || '',
    });
  };

  // 8. Handler for custom file ingestion from banner / modal while in dashboard view
  const handleDataIngested = (newSales: RawSalesRecord[], newStores: RawStoreMaster[]) => {
    setRawSales(newSales);
    if (newStores && newStores.length > 0) {
      setStoreMaster(newStores);
    }
    const { data: cleaned } = mergeAndProcessData(newSales, newStores.length > 0 ? newStores : storeMaster);
    const dates = cleaned.map((r) => r.week_start_date).filter(Boolean).sort();
    setFilters({
      weekStartDates: [],
      regions: [],
      cities: [],
      storeFormats: [],
      storeNames: [],
      productCategories: [],
      startDate: dates[0] || '',
      endDate: dates[dates.length - 1] || '',
    });
  };

  // 9. Reset to default benchmark
  const handleResetBenchmark = () => {
    setRawSales(generateBenchmarkSalesData());
    setStoreMaster(sampleStoreMaster);
    setIsGenerated(true);
    setFilters({
      weekStartDates: [],
      regions: [],
      cities: [],
      storeFormats: [],
      storeNames: [],
      productCategories: [],
      startDate: '2024-09-02',
      endDate: '2024-12-16',
    });
  };

  // 10. Switch back to ingestion screen to upload a new dataset
  const handleReturnToIngestion = () => {
    setIsGenerated(false);
  };

  // 11. Export filtered CSV
  const handleExportCSV = () => {
    exportToCSV(filteredRecords, `retail_weekly_sales_${filters.startDate || 'all'}_to_${filters.endDate || 'all'}.csv`);
  };

  const handleExportInsightsCSV = () => {
    exportInsightsToCSV(businessInsights, `retail_executive_insights_${filters.startDate || 'all'}_to_${filters.endDate || 'all'}.csv`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased">
      {/* Navigation Header */}
      <Navbar
        audit={audit}
        activeCount={filteredRecords.length}
        totalCount={processedRecords.length}
        hasDataset={isGenerated && processedRecords.length > 0}
        onOpenIngestion={() => setIsIngestionOpen(true)}
        onOpenTableView={() => setIsTableViewOpen(true)}
        onExportCSV={handleExportCSV}
        onUploadNew={handleReturnToIngestion}
      />

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {!isGenerated || processedRecords.length === 0 ? (
          /* Initial Screen: NO dummy data shown. User provides Excel and clicks Generate / presses Enter! */
          <DataIngestionHero onGenerate={handleGenerateData} />
        ) : (
          /* Analytics Dashboard View - Rendered dynamically based strictly on the uploaded Excel data! */
          <>
            {/* Interactive Ingestion & Cleaning Engine Banner */}
            <FileUploadBanner
              audit={audit}
              onDataIngested={handleDataIngested}
              onResetBenchmark={handleResetBenchmark}
            />

            {/* Data & Insights Export Actions Bar */}
            <div className="mb-6 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="font-semibold text-slate-800">Filtered View:</span>
                <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                  {filteredRecords.length.toLocaleString()} of {processedRecords.length.toLocaleString()} records
                </span>
                {filters.startDate && filters.endDate && (
                  <span className="text-slate-500 hidden sm:inline">
                    • Period: <strong className="font-mono text-slate-700">{filters.startDate}</strong> to <strong className="font-mono text-slate-700">{filters.endDate}</strong>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsTableViewOpen(true)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="View full cleansed data records in an interactive table"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>Data Table ({filteredRecords.length.toLocaleString()})</span>
                </button>

                <button
                  type="button"
                  id="btn-download-insights"
                  onClick={handleExportInsightsCSV}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Download Executive Insights & Store Lists as CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Export Insights (CSV)</span>
                </button>

                <button
                  type="button"
                  id="btn-download-csv"
                  onClick={handleExportCSV}
                  disabled={filteredRecords.length === 0}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 ${
                    filteredRecords.length === 0
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
                  }`}
                  title={
                    filteredRecords.length === 0
                      ? 'No filtered records match current criteria'
                      : `Download ${filteredRecords.length} filtered sales records as CSV`
                  }
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Filtered CSV</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* Sidebar Multi-Select Filters */}
              <SidebarFilters
                allRecords={processedRecords}
                filters={filters}
                onFilterChange={setFilters}
                filteredCount={filteredRecords.length}
              />

              {/* Core Analytics Dashboard Area */}
              <div className="flex-1 w-full min-w-0">
                {/* Empty State Notification Banner when conflicting filters return 0 records */}
                {filteredRecords.length === 0 && (
                  <div
                    id="empty-filter-state-alert"
                    className="mb-6 bg-white border border-amber-200 rounded-xl p-6 text-center shadow-xs"
                  >
                    <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
                      <FilterX className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 mb-1">
                      No Data Available
                    </h3>
                    <p className="text-xs text-slate-600 max-w-md mx-auto mb-4 leading-relaxed">
                      No weekly sales records match your current filter combination.
                      This can occur when selecting a store format, category, or store that does not exist in the selected city or timeframe.
                    </p>
                    <button
                      onClick={() => {
                        const dates = processedRecords.map((r) => r.week_start_date).filter(Boolean).sort();
                        setFilters({
                          weekStartDates: [],
                          regions: [],
                          cities: [],
                          storeFormats: [],
                          storeNames: [],
                          productCategories: [],
                          startDate: dates[0] || '',
                          endDate: dates[dates.length - 1] || '',
                        });
                      }}
                      className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset All Filters to Default
                    </button>
                  </div>
                )}

                {/* 1. KPI Cards (7 required KPIs calculated from filtered dataset) */}
                <KPICards summary={kpiSummary} />

                {/* 2. Business Insights Section */}
                <BusinessInsights insights={businessInsights} />

                {/* 3. Visual Analytics Section */}
                <div className="space-y-6">
                  {/* Line chart: Net Sales vs. Sales Target over week_start_date */}
                  <div className="w-full">
                    <SalesTrendChart records={filteredRecords} />
                  </div>

                  {/* Two-Column Charts Row 1: Regional Bar Chart & Category Grouped Chart */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Bar chart: Regional Net Sales performance */}
                    <RegionalSalesChart records={filteredRecords} />

                    {/* Grouped chart: Product Category Net Sales vs. Return Rate */}
                    <CategoryPerformanceChart records={filteredRecords} />
                  </div>

                  {/* Two-Column Charts Row 2: Store Leaderboard & Stockout Risk Chart */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Leaderboard: Top 5 and Bottom 5 stores by Target Achievement % */}
                    <StoreLeaderboard records={filteredRecords} />

                    {/* Stockout Risk chart: Stockouts by Product Category and Region */}
                    <StockoutRiskChart records={filteredRecords} />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Retail Sales Intelligence Platform • Engineered for Executive Decision-Making
          </div>
          <div>
            {isGenerated && processedRecords.length > 0 ? (
              <span>Active Filtered Set: <strong className="text-slate-700">{filteredRecords.length.toLocaleString()} weekly records</strong></span>
            ) : (
              <span>Awaiting spreadsheet upload</span>
            )}
          </div>
        </div>
      </footer>

      {/* Modals */}
      <DataIngestionModal
        isOpen={isIngestionOpen}
        onClose={() => setIsIngestionOpen(false)}
        onDataIngested={handleDataIngested}
        onResetBenchmark={handleResetBenchmark}
        currentAudit={audit}
      />

      <DataTableView
        isOpen={isTableViewOpen}
        onClose={() => setIsTableViewOpen(false)}
        records={filteredRecords}
      />
    </div>
  );
}
