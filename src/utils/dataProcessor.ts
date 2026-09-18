import {
  RawSalesRecord,
  RawStoreMaster,
  RetailSalesRecord,
  KPISummary,
  BusinessInsights,
  DataProcessingAudit,
} from '../types';

/**
 * Clean and parse numeric values, stripping currency symbols, commas, and whitespace.
 * Returns defaultValue if parsing fails.
 */
export function cleanNumeric(
  value: unknown,
  defaultValue = 0
): { value: number; wasCleaned: boolean } {
  if (value === null || value === undefined || value === '') {
    return { value: defaultValue, wasCleaned: false };
  }

  if (typeof value === 'number') {
    if (isNaN(value) || !isFinite(value)) {
      return { value: defaultValue, wasCleaned: true };
    }
    return { value, wasCleaned: false };
  }

  if (typeof value === 'string') {
    const original = value.trim();
    // Check if it's already a clean number
    if (/^-?\d+(\.\d+)?$/.test(original)) {
      return { value: parseFloat(original), wasCleaned: false };
    }

    // Strip currency symbols ($ € £ ¥), commas, and spaces
    const sanitized = original.replace(/[$€£¥, ]/g, '');
    const parsed = parseFloat(sanitized);

    if (isNaN(parsed) || !isFinite(parsed)) {
      return { value: defaultValue, wasCleaned: true };
    }
    return { value: parsed, wasCleaned: true };
  }

  return { value: defaultValue, wasCleaned: true };
}

/**
 * Clean and parse week_start_date.
 * Handles Excel date numbers (e.g., 45180), ISO strings, US dates (MM/DD/YYYY),
 * and dirty values like 'invalid-date' by inferring sequence or falling back cleanly.
 */
export function cleanDate(
  value: unknown,
  contextDate?: string
): { dateStr: string; timestamp: number; wasFixed: boolean } {
  const fallbackDate = '2024-01-01';
  const fallbackTime = new Date(fallbackDate).getTime();

  const recoverFromContext = () => {
    if (contextDate) {
      const cDate = new Date(contextDate);
      if (!isNaN(cDate.getTime())) {
        const nextWeek = new Date(cDate.getTime() + 7 * 86400000);
        const dateStr = nextWeek.toISOString().split('T')[0];
        return { dateStr, timestamp: nextWeek.getTime(), wasFixed: true };
      }
    }
    return { dateStr: fallbackDate, timestamp: fallbackTime, wasFixed: true };
  };

  if (value === null || value === undefined || value === '') {
    return recoverFromContext();
  }

  // Check if it's an Excel numeric date serial
  if (typeof value === 'number' || (!isNaN(Number(value)) && typeof value === 'string' && Number(value) > 30000 && Number(value) < 60000)) {
    const num = Number(value);
    // Excel epoch offset
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const jsDate = new Date(excelEpoch.getTime() + num * 86400000);
    if (!isNaN(jsDate.getTime())) {
      const dateStr = jsDate.toISOString().split('T')[0];
      return { dateStr, timestamp: jsDate.getTime(), wasFixed: true };
    }
  }

  if (value instanceof Date) {
    if (!isNaN(value.getTime())) {
      const dateStr = value.toISOString().split('T')[0];
      return { dateStr, timestamp: value.getTime(), wasFixed: false };
    }
    return recoverFromContext();
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    // Specific dirty values like 'invalid-date' or 'null'
    if (
      trimmed.toLowerCase() === 'invalid-date' ||
      trimmed.toLowerCase() === 'n/a' ||
      trimmed.toLowerCase() === 'null'
    ) {
      return recoverFromContext();
    }

    // Try native date parsing
    const parsedDate = new Date(trimmed);
    if (!isNaN(parsedDate.getTime()) && !/^\d+$/.test(trimmed)) {
      const dateStr = parsedDate.toISOString().split('T')[0];
      const wasFixed = trimmed !== dateStr;
      return { dateStr, timestamp: parsedDate.getTime(), wasFixed };
    }

    // Try MM/DD/YYYY or DD-MM-YYYY
    const parts = trimmed.split(/[/.-]/);
    if (parts.length === 3) {
      // Check year position
      let y = parseInt(parts[0], 10);
      let m = parseInt(parts[1], 10);
      let d = parseInt(parts[2], 10);

      if (parts[2].length === 4) {
        // MM/DD/YYYY
        y = parseInt(parts[2], 10);
        m = parseInt(parts[0], 10);
        d = parseInt(parts[1], 10);
      }

      if (y >= 2000 && y <= 2035 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        const constructDate = new Date(Date.UTC(y, m - 1, d));
        const dateStr = constructDate.toISOString().split('T')[0];
        return { dateStr, timestamp: constructDate.getTime(), wasFixed: true };
      }
    }
  }

  return recoverFromContext();
}

/**
 * Merge weekly sales and store master data on store_id,
 * handle missing net_sales (gross_sales - discount_amount),
 * clean non-numeric gross_sales, and handle invalid week_start_date.
 */
export function mergeAndProcessData(
  rawSales: RawSalesRecord[],
  storeMaster: RawStoreMaster[]
): {
  data: RetailSalesRecord[];
  audit: DataProcessingAudit;
} {
  // Build lookup map for store master - Left Join deduplicated by store_id with flexible key indexing
  const storeMap = new Map<string, RawStoreMaster>();
  storeMaster.forEach((store) => {
    if (!store || !store.store_id) return;
    const rawId = String(store.store_id).trim();
    const normalizedId = rawId.toUpperCase();
    if (!storeMap.has(normalizedId)) {
      storeMap.set(normalizedId, store);
    }
    const stripped = normalizedId.replace(/[^A-Z0-9]/g, '');
    if (stripped && !storeMap.has(stripped)) {
      storeMap.set(stripped, store);
    }
    const digitsOnly = normalizedId.replace(/\D/g, '');
    if (digitsOnly) {
      const numStr = String(parseInt(digitsOnly, 10));
      if (!storeMap.has(numStr)) {
        storeMap.set(numStr, store);
      }
      if (!storeMap.has(digitsOnly)) {
        storeMap.set(digitsOnly, store);
      }
    }
  });

  let missingNetSalesFixedCount = 0;
  let cleanedGrossSalesCount = 0;
  let invalidDatesHandledCount = 0;
  let storesMatchedCount = 0;

  const lastValidDateByStore = new Map<string, string>();
  const processed: RetailSalesRecord[] = [];

  rawSales.forEach((row, index) => {
    const rawStoreId = String(row.store_id || '').trim();
    const storeIdNormalized = rawStoreId.toUpperCase();
    const storeIdStripped = storeIdNormalized.replace(/[^A-Z0-9]/g, '');
    const digitsOnly = storeIdNormalized.replace(/\D/g, '');
    const numStr = digitsOnly ? String(parseInt(digitsOnly, 10)) : '';

    const storeMeta =
      storeMap.get(storeIdNormalized) ||
      storeMap.get(storeIdStripped) ||
      (digitsOnly ? storeMap.get(digitsOnly) : undefined) ||
      (numStr ? storeMap.get(numStr) : undefined);

    if (storeMeta) {
      storesMatchedCount++;
    }

    // Date cleansing with store timeline context recovery
    const lastStoreDate = lastValidDateByStore.get(storeIdNormalized);
    const dateRes = cleanDate(row.week_start_date, lastStoreDate);
    if (dateRes.wasFixed) {
      invalidDatesHandledCount++;
    }
    lastValidDateByStore.set(storeIdNormalized, dateRes.dateStr);

    // Financial cleansing with specific handling for non-numeric strings like 'not_available'
    const discountRes = cleanNumeric(row.discount_amount, 0);
    const discountAmount = Math.max(0, discountRes.value);

    // Check net_sales provided
    const netRawProvided =
      row.net_sales !== undefined &&
      row.net_sales !== null &&
      row.net_sales !== '' &&
      !isNaN(Number(row.net_sales));
    const netRes = cleanNumeric(row.net_sales, -1);

    let grossSales = 0;
    const rawGrossStr = String(row.gross_sales || '').trim().toLowerCase();
    const isGrossNonNumericString =
      rawGrossStr === 'not_available' ||
      rawGrossStr === 'n/a' ||
      rawGrossStr === 'null' ||
      rawGrossStr === 'nan' ||
      isNaN(Number(rawGrossStr.replace(/[$€£¥, ]/g, '')));

    if (isGrossNonNumericString && rawGrossStr !== '') {
      // Coerce non-numeric string values in gross_sales (e.g., 'not_available')
      // by recalculating as (net_sales + discount_amount) if net_sales is available
      if (netRawProvided && netRes.value >= 0) {
        grossSales = netRes.value + discountAmount;
      } else {
        grossSales = cleanNumeric(row.gross_sales, 0).value;
      }
      cleanedGrossSalesCount++;
    } else {
      const grossRes = cleanNumeric(row.gross_sales, 0);
      if (grossRes.wasCleaned) {
        cleanedGrossSalesCount++;
      }
      grossSales = Math.max(0, grossRes.value);
    }

    if (isNaN(grossSales) || !isFinite(grossSales)) {
      grossSales = 0;
    }

    // Handle missing net_sales values using the formula: (gross_sales - discount_amount)
    let netSales: number;
    if (!netRawProvided || netRes.value < 0 || isNaN(netRes.value)) {
      netSales = Math.max(0, grossSales - discountAmount);
      missingNetSalesFixedCount++;
    } else {
      netSales = Math.max(0, netRes.value);
    }

    if (isNaN(netSales) || !isFinite(netSales)) {
      netSales = Math.max(0, grossSales - discountAmount);
    }

    const salesTarget = Math.max(0, cleanNumeric(row.sales_target, 0).value);
    const footfall = Math.max(0, cleanNumeric(row.footfall, 0).value);
    const transactions = Math.max(0, cleanNumeric(row.transactions, 0).value);
    const unitsSold = Math.max(0, cleanNumeric(row.units_sold, 0).value);
    const inventoryOnHand = Math.max(0, cleanNumeric(row.inventory_on_hand, 0).value);
    const stockouts = Math.max(0, cleanNumeric(row.stockouts, 0).value);
    const returnsAmount = Math.max(0, cleanNumeric(row.returns_amount, 0).value);
    const customerRating = Math.min(5, Math.max(1, cleanNumeric(row.customer_rating, 4.2).value));
    const marketingSpend = Math.max(0, cleanNumeric(row.marketing_spend, 0).value);

    // Metadata unification from store_master with fallback to sales row
    const storeName = storeMeta?.store_name || (row.store_name ? String(row.store_name).trim() : `Store ${storeIdNormalized}`);
    const region = storeMeta?.region || (row.region ? String(row.region).trim() : 'Unknown');
    const city = storeMeta?.city || (row.city ? String(row.city).trim() : 'Unknown');
    const storeFormat = storeMeta?.store_format || (row.store_format ? String(row.store_format).trim() : 'Standard');
    const productCategory = row.product_category ? String(row.product_category).trim() : 'General Retail';

    // Derived metrics (Return Rate calculated vs Net Sales as specified in requirements: Returns / Net Sales * 100)
    const targetAchievementPct = salesTarget > 0 ? (netSales / salesTarget) * 100 : 100;
    const returnRatePct = netSales > 0 ? (returnsAmount / netSales) * 100 : 0;
    const discountRatePct = grossSales > 0 ? (discountAmount / grossSales) * 100 : 0;
    const conversionRatePct = footfall > 0 ? (transactions / footfall) * 100 : 0;
    const atv = transactions > 0 ? netSales / transactions : 0;

    processed.push({
      id: `sale-${index}-${storeIdNormalized}`,
      week_start_date: dateRes.dateStr,
      timestamp: dateRes.timestamp,
      store_id: storeIdNormalized,
      store_name: storeName,
      region,
      city,
      store_format: storeFormat,
      product_category: productCategory,
      footfall,
      transactions,
      units_sold: unitsSold,
      gross_sales: grossSales,
      discount_amount: discountAmount,
      net_sales: netSales,
      sales_target: salesTarget,
      inventory_on_hand: inventoryOnHand,
      stockouts,
      returns_amount: returnsAmount,
      customer_rating: customerRating,
      marketing_spend: marketingSpend,
      target_achievement_pct: Number(targetAchievementPct.toFixed(2)),
      return_rate_pct: Number(returnRatePct.toFixed(2)),
      discount_rate_pct: Number(discountRatePct.toFixed(2)),
      conversion_rate_pct: Number(conversionRatePct.toFixed(2)),
      atv: Number(atv.toFixed(2)),
    });
  });

  // Sort chronologically by date
  processed.sort((a, b) => a.timestamp - b.timestamp);

  const audit: DataProcessingAudit = {
    rawSalesCount: rawSales.length,
    rawStoreMasterCount: storeMaster.length,
    mergedCount: processed.length,
    missingNetSalesFixedCount,
    cleanedGrossSalesCount,
    invalidDatesHandledCount,
    storesMatchedCount,
  };

  return { data: processed, audit };
}

/**
 * Calculate dashboard summary KPIs from filtered dataset.
 */
export function calculateKPISummary(records: RetailSalesRecord[]): KPISummary {
  if (records.length === 0) {
    return {
      totalNetSales: 0,
      totalSalesTarget: 0,
      targetAchievementPct: 0,
      atv: 0,
      totalFootfall: 0,
      totalTransactions: 0,
      conversionRatePct: 0,
      totalGrossSales: 0,
      totalDiscountAmount: 0,
      discountRatePct: 0,
      totalReturnsAmount: 0,
      returnRatePct: 0,
      stockoutOccurrencesCount: 0,
      totalStockoutUnits: 0,
      totalUnitsSold: 0,
      avgCustomerRating: 0,
      recordCount: 0,
    };
  }

  let totalNetSales = 0;
  let totalSalesTarget = 0;
  let totalGrossSales = 0;
  let totalDiscountAmount = 0;
  let totalReturnsAmount = 0;
  let totalFootfall = 0;
  let totalTransactions = 0;
  let stockoutOccurrencesCount = 0;
  let totalStockoutUnits = 0;
  let totalUnitsSold = 0;
  let ratingSum = 0;

  records.forEach((r) => {
    totalNetSales += r.net_sales;
    totalSalesTarget += r.sales_target;
    totalGrossSales += r.gross_sales;
    totalDiscountAmount += r.discount_amount;
    totalReturnsAmount += r.returns_amount;
    totalFootfall += r.footfall;
    totalTransactions += r.transactions;
    if (r.stockouts > 0) {
      stockoutOccurrencesCount++;
    }
    totalStockoutUnits += r.stockouts;
    totalUnitsSold += r.units_sold;
    ratingSum += r.customer_rating;
  });

  const targetAchievementPct = totalSalesTarget > 0 ? (totalNetSales / totalSalesTarget) * 100 : 0;
  const atv = totalTransactions > 0 ? totalNetSales / totalTransactions : 0;
  // Return Rate (%): (Total Returns Amount / Total Net Sales) * 100
  const returnRatePct = totalNetSales > 0 ? (totalReturnsAmount / totalNetSales) * 100 : 0;
  // Discount Rate (%): (Total Discount Amount / Total Gross Sales) * 100
  const discountRatePct = totalGrossSales > 0 ? (totalDiscountAmount / totalGrossSales) * 100 : 0;
  // Conversion Rate (%): (Total Transactions / Total Footfall) * 100
  const conversionRatePct = totalFootfall > 0 ? (totalTransactions / totalFootfall) * 100 : 0;
  const avgCustomerRating = records.length > 0 ? ratingSum / records.length : 0;

  return {
    totalNetSales: Math.round(totalNetSales),
    totalSalesTarget: Math.round(totalSalesTarget),
    targetAchievementPct: Number(targetAchievementPct.toFixed(1)),
    atv: Number(atv.toFixed(2)),
    totalFootfall,
    totalTransactions,
    conversionRatePct: Number(conversionRatePct.toFixed(1)),
    totalGrossSales: Math.round(totalGrossSales),
    totalDiscountAmount: Math.round(totalDiscountAmount),
    discountRatePct: Number(discountRatePct.toFixed(1)),
    totalReturnsAmount: Math.round(totalReturnsAmount),
    returnRatePct: Number(returnRatePct.toFixed(1)),
    stockoutOccurrencesCount,
    totalStockoutUnits,
    totalUnitsSold,
    avgCustomerRating: Number(avgCustomerRating.toFixed(2)),
    recordCount: records.length,
  };
}

/**
 * Generate automated Business Insights for best/worst regions, highest return categories,
 * underperforming stores, and critical stockouts.
 */
export function generateBusinessInsights(records: RetailSalesRecord[]): BusinessInsights {
  if (records.length === 0) {
    return {
      bestRegion: null,
      worstRegion: null,
      highestReturnCategory: null,
      lowestReturnCategory: null,
      underperformingStores: [],
      topPerformingStores: [],
      criticalStockoutCategory: null,
    };
  }

  // 1. Regional aggregation - ranked based on Target Achievement Rate (%) as required
  const regionStats = new Map<string, { netSales: number; target: number }>();
  records.forEach((r) => {
    const current = regionStats.get(r.region) || { netSales: 0, target: 0 };
    current.netSales += r.net_sales;
    current.target += r.sales_target;
    regionStats.set(r.region, current);
  });

  const regionsRanked = Array.from(regionStats.entries())
    .map(([name, stats]) => ({
      name,
      netSales: stats.netSales,
      achievementPct: stats.target > 0 ? Number(((stats.netSales / stats.target) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.achievementPct - a.achievementPct);

  const bestRegion = regionsRanked[0] || null;
  const worstRegion = regionsRanked[regionsRanked.length - 1] || null;

  // 2. Product Category Returns (Returns / Net Sales)
  const categoryStats = new Map<string, { netSales: number; grossSales: number; returnsAmount: number }>();
  records.forEach((r) => {
    const current = categoryStats.get(r.product_category) || { netSales: 0, grossSales: 0, returnsAmount: 0 };
    current.netSales += r.net_sales;
    current.grossSales += r.gross_sales;
    current.returnsAmount += r.returns_amount;
    categoryStats.set(r.product_category, current);
  });

  const categoriesRanked = Array.from(categoryStats.entries())
    .map(([category, stats]) => ({
      category,
      returnsAmount: stats.returnsAmount,
      returnRatePct: stats.netSales > 0 ? Number(((stats.returnsAmount / stats.netSales) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.returnRatePct - a.returnRatePct);

  const highestReturnCategory = categoriesRanked[0] || null;
  const lowestReturnCategory = categoriesRanked[categoriesRanked.length - 1] || null;

  // 3. Store Performance & Leaderboards - highlight stores under 80%
  const storeStats = new Map<
    string,
    { store_id: string; store_name: string; region: string; netSales: number; target: number }
  >();

  records.forEach((r) => {
    const current = storeStats.get(r.store_id) || {
      store_id: r.store_id,
      store_name: r.store_name,
      region: r.region,
      netSales: 0,
      target: 0,
    };
    current.netSales += r.net_sales;
    current.target += r.sales_target;
    storeStats.set(r.store_id, current);
  });

  const storesRanked = Array.from(storeStats.values())
    .map((s) => {
      const achievementPct = s.target > 0 ? Number(((s.netSales / s.target) * 100).toFixed(1)) : 0;
      return {
        store_id: s.store_id,
        store_name: s.store_name,
        region: s.region,
        achievementPct,
        gapAmount: Math.max(0, s.target - s.netSales),
        surplusAmount: Math.max(0, s.netSales - s.target),
      };
    })
    .sort((a, b) => b.achievementPct - a.achievementPct);

  const topPerformingStores = storesRanked.slice(0, 5);

  // Underperforming: stores where Target Achievement is under 80% (or lowest 5 if none below 80)
  const storesUnder80 = storesRanked.filter((s) => s.achievementPct < 80).sort((a, b) => a.achievementPct - b.achievementPct);
  const underperformingStores = storesUnder80.length > 0
    ? storesUnder80.slice(0, 5)
    : [...storesRanked].sort((a, b) => a.achievementPct - b.achievementPct).slice(0, 5);

  // 4. Stockout Risk Hotspots
  const stockoutStats = new Map<string, { stockouts: number; regions: Map<string, number> }>();
  records.forEach((r) => {
    const current = stockoutStats.get(r.product_category) || { stockouts: 0, regions: new Map() };
    current.stockouts += r.stockouts;
    const rCount = current.regions.get(r.region) || 0;
    current.regions.set(r.region, rCount + r.stockouts);
    stockoutStats.set(r.product_category, current);
  });

  let criticalStockoutCategory: BusinessInsights['criticalStockoutCategory'] = null;
  let maxStockouts = -1;

  stockoutStats.forEach((val, cat) => {
    if (val.stockouts > maxStockouts) {
      maxStockouts = val.stockouts;
      let primaryRegion = 'All Regions';
      let maxRegionStockout = -1;
      val.regions.forEach((count, reg) => {
        if (count > maxRegionStockout) {
          maxRegionStockout = count;
          primaryRegion = reg;
        }
      });
      criticalStockoutCategory = {
        category: cat,
        stockouts: val.stockouts,
        primaryRegion,
      };
    }
  });

  return {
    bestRegion,
    worstRegion,
    highestReturnCategory,
    lowestReturnCategory,
    underperformingStores,
    topPerformingStores,
    criticalStockoutCategory,
  };
}

/**
 * Convert dataset to CSV string and initiate browser download
 */
export function exportToCSV(records: RetailSalesRecord[], filename = 'retail_weekly_sales_filtered.csv') {
  if (!records || records.length === 0) {
    alert('No data available to export.');
    return;
  }

  const headers = [
    'Week Start Date',
    'Store ID',
    'Store Name',
    'Region',
    'City',
    'Store Format',
    'Product Category',
    'Footfall',
    'Transactions',
    'Units Sold',
    'Gross Sales ($)',
    'Discount Amount ($)',
    'Net Sales ($)',
    'Sales Target ($)',
    'Target Achievement (%)',
    'Inventory On Hand',
    'Stockouts',
    'Returns Amount ($)',
    'Return Rate (%)',
    'Discount Rate (%)',
    'Conversion Rate (%)',
    'Average Transaction Value ($)',
    'Customer Rating',
    'Marketing Spend ($)',
  ];

  const rows = records.map((r) => [
    `"${r.week_start_date}"`,
    `"${r.store_id}"`,
    `"${r.store_name.replace(/"/g, '""')}"`,
    `"${r.region}"`,
    `"${r.city}"`,
    `"${r.store_format}"`,
    `"${r.product_category}"`,
    r.footfall,
    r.transactions,
    r.units_sold,
    r.gross_sales.toFixed(2),
    r.discount_amount.toFixed(2),
    r.net_sales.toFixed(2),
    r.sales_target.toFixed(2),
    r.target_achievement_pct.toFixed(2),
    r.inventory_on_hand,
    r.stockouts,
    r.returns_amount.toFixed(2),
    r.return_rate_pct.toFixed(2),
    r.discount_rate_pct.toFixed(2),
    r.conversion_rate_pct.toFixed(2),
    r.atv.toFixed(2),
    r.customer_rating.toFixed(1),
    r.marketing_spend.toFixed(2),
  ]);

  const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export Business Insights executive summary tables as CSV
 */
export function exportInsightsToCSV(insights: BusinessInsights, filename = 'retail_business_insights_summary.csv') {
  const lines: string[] = [];

  lines.push('RETAIL SALES INTELLIGENCE - EXECUTIVE INSIGHT SUMMARY');
  lines.push(`Generated on,${new Date().toISOString()}`);
  lines.push('');

  lines.push('REGIONAL PERFORMANCE');
  lines.push('Metric,Region,Net Sales ($),Target Achievement (%)');
  if (insights.bestRegion) {
    lines.push(`Best Performing Region,${insights.bestRegion.name},${insights.bestRegion.netSales},${insights.bestRegion.achievementPct}%`);
  }
  if (insights.worstRegion) {
    lines.push(`Worst Performing Region,${insights.worstRegion.name},${insights.worstRegion.netSales},${insights.worstRegion.achievementPct}%`);
  }
  lines.push('');

  lines.push('CATEGORY RETURN RATES');
  lines.push('Metric,Category,Returns Amount ($),Return Rate (%)');
  if (insights.highestReturnCategory) {
    lines.push(`Highest Return Category,${insights.highestReturnCategory.category},${insights.highestReturnCategory.returnsAmount},${insights.highestReturnCategory.returnRatePct}%`);
  }
  if (insights.lowestReturnCategory) {
    lines.push(`Lowest Return Category,${insights.lowestReturnCategory.category},${insights.lowestReturnCategory.returnsAmount},${insights.lowestReturnCategory.returnRatePct}%`);
  }
  lines.push('');

  lines.push('STORES MISSING TARGET (UNDER 80% ACHIEVEMENT)');
  lines.push('Store ID,Store Name,Region,Target Achievement (%),Revenue Shortfall ($)');
  insights.underperformingStores.forEach((s) => {
    lines.push(`"${s.store_id}","${s.store_name}","${s.region}",${s.achievementPct}%,${s.gapAmount}`);
  });
  lines.push('');

  lines.push('TOP PERFORMING STORES');
  lines.push('Store ID,Store Name,Region,Target Achievement (%),Target Surplus ($)');
  insights.topPerformingStores.forEach((s) => {
    lines.push(`"${s.store_id}","${s.store_name}","${s.region}",${s.achievementPct}%,${s.surplusAmount}`);
  });

  const csvContent = lines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
