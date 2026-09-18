import * as XLSX from 'xlsx';
import { RawSalesRecord, RawStoreMaster } from '../types';
import { sampleStoreMaster, generateBenchmarkSalesData } from '../data/sampleData';

/**
 * Standardize and map arbitrary column headers from uploaded Excel/CSV files
 * to canonical retail dataset properties.
 */
export function normalizeColumnKey(rawKey: string): string {
  const clean = rawKey
    .trim()
    .toLowerCase()
    .replace(/[\s\-\.]+/g, '_')
    .replace(/[^a-z0-9_]/g, '');

  // Column aliases mapping
  if (['store_id', 'storeid', 'store_no', 'store_code', 'store_number', 'store'].includes(clean)) {
    return 'store_id';
  }
  if (['store_name', 'storename', 'store_title', 'store_location_name'].includes(clean)) {
    return 'store_name';
  }
  if (['region', 'store_region', 'territory', 'zone', 'area'].includes(clean)) {
    return 'region';
  }
  if (['city', 'store_city', 'location', 'town'].includes(clean)) {
    return 'city';
  }
  if (['store_format', 'storeformat', 'format', 'store_type', 'type', 'channel'].includes(clean)) {
    return 'store_format';
  }
  if (['week_start_date', 'weekstartdate', 'week_date', 'date', 'week', 'week_start', 'start_date'].includes(clean)) {
    return 'week_start_date';
  }
  if (['product_category', 'productcategory', 'category', 'product_cat', 'department', 'dept', 'merchandise_cat'].includes(clean)) {
    return 'product_category';
  }
  if (['footfall', 'foot_fall', 'footfalls', 'traffic', 'store_traffic', 'visitors', 'walkins'].includes(clean)) {
    return 'footfall';
  }
  if (['transactions', 'transaction_count', 'txns', 'orders', 'bills', 'receipts'].includes(clean)) {
    return 'transactions';
  }
  if (['units_sold', 'unitssold', 'units', 'quantity', 'qty_sold', 'qty', 'volume'].includes(clean)) {
    return 'units_sold';
  }
  if (['gross_sales', 'grosssales', 'gross', 'total_sales', 'gross_revenue', 'gross_amount'].includes(clean)) {
    return 'gross_sales';
  }
  if (['discount_amount', 'discountamount', 'discount', 'discounts', 'total_discount', 'markdown_amount'].includes(clean)) {
    return 'discount_amount';
  }
  if (['net_sales', 'netsales', 'net', 'net_revenue', 'net_amount'].includes(clean)) {
    return 'net_sales';
  }
  if (['sales_target', 'salestarget', 'target', 'target_sales', 'weekly_target', 'budget'].includes(clean)) {
    return 'sales_target';
  }
  if (['inventory_on_hand', 'inventoryonhand', 'inventory', 'stock_on_hand', 'ioh', 'stock', 'closing_stock'].includes(clean)) {
    return 'inventory_on_hand';
  }
  if (['stockouts', 'stockout', 'stockout_units', 'stockout_occurrences', 'out_of_stock', 'oos_units'].includes(clean)) {
    return 'stockouts';
  }
  if (['returns_amount', 'returnsamount', 'returns', 'return_amount', 'return_sales', 'refunds'].includes(clean)) {
    return 'returns_amount';
  }
  if (['customer_rating', 'customerrating', 'rating', 'csat', 'avg_rating'].includes(clean)) {
    return 'customer_rating';
  }
  if (['marketing_spend', 'marketingspend', 'marketing', 'ad_spend', 'advertising'].includes(clean)) {
    return 'marketing_spend';
  }

  return clean;
}

/**
 * Normalizes all keys of an un-typed row record from an Excel sheet.
 */
function normalizeRecordKeys(row: Record<string, any>): Record<string, any> {
  const normalized: Record<string, any> = {};
  for (const [key, value] of Object.entries(row)) {
    const canonicalKey = normalizeColumnKey(key);
    normalized[canonicalKey] = value;
  }
  return normalized;
}

/**
 * In-memory spreadsheet parser using SheetJS (XLSX).
 * Reads ArrayBuffer dynamically in memory without saving to server.
 */
export async function parseExcelFile<T>(file: File): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error('No worksheets found in uploaded spreadsheet.');
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: null });
        const normalizedJson = rawJson.map((r) => normalizeRecordKeys(r) as T);

        resolve(normalizedJson);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

export interface IngestionResult {
  rawSales?: RawSalesRecord[];
  storeMaster?: RawStoreMaster[];
  salesCount: number;
  storeCount: number;
  message: string;
}

/**
 * Comprehensive in-memory parsing pipeline for one or more uploaded files
 * (retail_weekly_sales.xlsx and store_master.xlsx, or combined multi-sheet workbook).
 */
export async function parseUploadedDatasetFiles(
  files: File[] | FileList
): Promise<IngestionResult> {
  const fileArray = Array.from(files);
  if (fileArray.length === 0) {
    throw new Error('No files provided for ingestion.');
  }

  let parsedSales: RawSalesRecord[] | undefined;
  let parsedStores: RawStoreMaster[] | undefined;
  const messages: string[] = [];

  for (const file of fileArray) {
    const buffer = await file.arrayBuffer();
    const data = new Uint8Array(buffer);
    const workbook = XLSX.read(data, { type: 'array', cellDates: true });

    for (const sheetName of workbook.SheetNames) {
      const lowerSheet = sheetName.toLowerCase();
      const worksheet = workbook.Sheets[sheetName];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: null });
      if (rawRows.length === 0) continue;

      const normalizedRows = rawRows.map((r) => normalizeRecordKeys(r));
      const sampleRow = normalizedRows[0];

      // Identify whether this sheet is Sales or Store Master
      const hasSalesColumns =
        'week_start_date' in sampleRow ||
        'gross_sales' in sampleRow ||
        'product_category' in sampleRow ||
        'units_sold' in sampleRow;

      const isStoreSheetName =
        lowerSheet.includes('store') ||
        lowerSheet.includes('master') ||
        file.name.toLowerCase().includes('store');

      const isSalesSheetName =
        lowerSheet.includes('sale') ||
        lowerSheet.includes('weekly') ||
        file.name.toLowerCase().includes('sale') ||
        file.name.toLowerCase().includes('weekly');

      if (hasSalesColumns || (isSalesSheetName && !isStoreSheetName)) {
        parsedSales = normalizedRows as unknown as RawSalesRecord[];
        messages.push(`Parsed ${parsedSales.length} weekly sales rows from "${file.name}" [Sheet: ${sheetName}]`);
      } else if (
        isStoreSheetName ||
        ('store_id' in sampleRow && ('store_name' in sampleRow || 'region' in sampleRow || 'store_format' in sampleRow))
      ) {
        parsedStores = normalizedRows as unknown as RawStoreMaster[];
        messages.push(`Parsed ${parsedStores.length} store records from "${file.name}" [Sheet: ${sheetName}]`);
      }
    }
  }

  // If sales rows contain store metadata (region, city, store_name, store_format) and no separate store master was provided,
  // dynamically extract the store master directly from the sales records!
  if (parsedSales && parsedSales.length > 0 && (!parsedStores || parsedStores.length === 0)) {
    const extractedStoresMap = new Map<string, RawStoreMaster>();
    parsedSales.forEach((r) => {
      const id = String(r.store_id || '').trim();
      if (id && !extractedStoresMap.has(id.toUpperCase())) {
        extractedStoresMap.set(id.toUpperCase(), {
          store_id: id,
          store_name: r.store_name ? String(r.store_name).trim() : `Store ${id}`,
          region: r.region ? String(r.region).trim() : 'Unknown',
          city: r.city ? String(r.city).trim() : 'Unknown',
          store_format: r.store_format ? String(r.store_format).trim() : 'Standard',
        });
      }
    });

    if (extractedStoresMap.size > 0) {
      parsedStores = Array.from(extractedStoresMap.values());
      messages.push(`Dynamically derived ${parsedStores.length} unique stores from sales dataset metadata.`);
    }
  }

  return {
    rawSales: parsedSales,
    storeMaster: parsedStores,
    salesCount: parsedSales?.length || 0,
    storeCount: parsedStores?.length || 0,
    message: messages.join(' • ') || 'Spreadsheet parsed successfully.',
  };
}

/**
 * Export retail_weekly_sales.xlsx file (1,920 rows) for testing and evaluation
 */
export function downloadSampleWeeklySalesExcel() {
  const data = generateBenchmarkSalesData();
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'retail_weekly_sales');
  XLSX.writeFile(workbook, 'retail_weekly_sales.xlsx');
}

/**
 * Export store_master.xlsx file (20 stores) for testing and evaluation
 */
export function downloadSampleStoreMasterExcel() {
  const data = sampleStoreMaster;
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'store_master');
  XLSX.writeFile(workbook, 'store_master.xlsx');
}
