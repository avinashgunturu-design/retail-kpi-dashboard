export interface RawSalesRecord {
  week_start_date: string | number | Date;
  region?: string;
  store_id: string | number;
  store_name?: string;
  city?: string;
  store_format?: string;
  product_category: string;
  footfall: number | string;
  transactions: number | string;
  units_sold: number | string;
  gross_sales: number | string;
  discount_amount: number | string;
  net_sales?: number | string | null;
  sales_target: number | string;
  inventory_on_hand: number | string;
  stockouts: number | string;
  returns_amount: number | string;
  customer_rating?: number | string;
  marketing_spend?: number | string;
}

export interface RawStoreMaster {
  store_id: string | number;
  store_name: string;
  region: string;
  city: string;
  store_format: string;
}

export interface RetailSalesRecord {
  id: string;
  week_start_date: string; // ISO YYYY-MM-DD
  timestamp: number;
  store_id: string;
  store_name: string;
  region: string;
  city: string;
  store_format: string;
  product_category: string;
  footfall: number;
  transactions: number;
  units_sold: number;
  gross_sales: number;
  discount_amount: number;
  net_sales: number;
  sales_target: number;
  inventory_on_hand: number;
  stockouts: number;
  returns_amount: number;
  customer_rating: number;
  marketing_spend: number;
  // Derived metrics
  target_achievement_pct: number;
  return_rate_pct: number;
  discount_rate_pct: number;
  conversion_rate_pct: number;
  atv: number; // average transaction value
}

export interface FilterState {
  weekStartDates: string[];
  regions: string[];
  cities: string[];
  storeFormats: string[];
  storeNames: string[];
  productCategories: string[];
  startDate: string;
  endDate: string;
}

export interface KPISummary {
  totalNetSales: number;
  totalSalesTarget: number;
  targetAchievementPct: number;
  atv: number;
  totalFootfall: number;
  totalTransactions: number;
  conversionRatePct: number;
  totalGrossSales: number;
  totalDiscountAmount: number;
  discountRatePct: number;
  totalReturnsAmount: number;
  returnRatePct: number;
  stockoutOccurrencesCount: number; // Count of records where stockouts > 0
  totalStockoutUnits: number; // Sum of stockout units
  totalUnitsSold: number;
  avgCustomerRating: number;
  recordCount: number;
}

export interface BusinessInsights {
  bestRegion: { name: string; netSales: number; achievementPct: number } | null;
  worstRegion: { name: string; netSales: number; achievementPct: number } | null;
  highestReturnCategory: { category: string; returnRatePct: number; returnsAmount: number } | null;
  lowestReturnCategory: { category: string; returnRatePct: number; returnsAmount: number } | null;
  underperformingStores: Array<{
    store_id: string;
    store_name: string;
    region: string;
    achievementPct: number;
    gapAmount: number;
  }>;
  topPerformingStores: Array<{
    store_id: string;
    store_name: string;
    region: string;
    achievementPct: number;
    surplusAmount: number;
  }>;
  criticalStockoutCategory: { category: string; stockouts: number; primaryRegion: string } | null;
}

export interface DataProcessingAudit {
  rawSalesCount: number;
  rawStoreMasterCount: number;
  mergedCount: number;
  missingNetSalesFixedCount: number;
  cleanedGrossSalesCount: number;
  invalidDatesHandledCount: number;
  storesMatchedCount: number;
}
