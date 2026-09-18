import { RawSalesRecord, RawStoreMaster } from '../types';

/**
 * Standard Store Master dataset containing exactly 20 stores
 * balanced across 4 strategic regions (East, West, South, North)
 * and 5 distinct store formats.
 */
export const sampleStoreMaster: RawStoreMaster[] = [
  // East Region (5 stores)
  { store_id: 'STR-001', store_name: 'Metro Center Flagship', region: 'East', city: 'New York', store_format: 'Flagship' },
  { store_id: 'STR-002', store_name: 'Harbor Point Supermarket', region: 'East', city: 'Boston', store_format: 'Supermarket' },
  { store_id: 'STR-003', store_name: 'Liberty Outlet Mall', region: 'East', city: 'Philadelphia', store_format: 'Outlet' },
  { store_id: 'STR-004', store_name: 'Empire Hypermarket', region: 'East', city: 'Newark', store_format: 'Hypermarket' },
  { store_id: 'STR-005', store_name: 'Bayside Express Hub', region: 'East', city: 'Baltimore', store_format: 'Express' },

  // West Region (5 stores)
  { store_id: 'STR-006', store_name: 'Pacific Heights Flagship', region: 'West', city: 'San Francisco', store_format: 'Flagship' },
  { store_id: 'STR-007', store_name: 'Sunset Strip Hypermarket', region: 'West', city: 'Los Angeles', store_format: 'Hypermarket' },
  { store_id: 'STR-008', store_name: 'Silicon Valley Express', region: 'West', city: 'San Jose', store_format: 'Express' },
  { store_id: 'STR-009', store_name: 'Emerald City Supermarket', region: 'West', city: 'Seattle', store_format: 'Supermarket' },
  { store_id: 'STR-010', store_name: 'Cascade Premium Outlets', region: 'West', city: 'Portland', store_format: 'Outlet' },

  // South Region (5 stores)
  { store_id: 'STR-011', store_name: 'Peachtree Flagship Plaza', region: 'South', city: 'Atlanta', store_format: 'Flagship' },
  { store_id: 'STR-012', store_name: 'Lone Star Hypermarket', region: 'South', city: 'Dallas', store_format: 'Hypermarket' },
  { store_id: 'STR-013', store_name: 'Silicon Hills Express', region: 'South', city: 'Austin', store_format: 'Express' },
  { store_id: 'STR-014', store_name: 'Biscayne Bay Supermarket', region: 'South', city: 'Miami', store_format: 'Supermarket' },
  { store_id: 'STR-015', store_name: 'Music City Outlet Center', region: 'South', city: 'Nashville', store_format: 'Outlet' },

  // North Region (5 stores)
  { store_id: 'STR-016', store_name: 'Magnificent Mile Flagship', region: 'North', city: 'Chicago', store_format: 'Flagship' },
  { store_id: 'STR-017', store_name: 'Great Lakes Hypermarket', region: 'North', city: 'Detroit', store_format: 'Hypermarket' },
  { store_id: 'STR-018', store_name: 'Twin Cities Supermarket', region: 'North', city: 'Minneapolis', store_format: 'Supermarket' },
  { store_id: 'STR-019', store_name: 'Arch City Express', region: 'North', city: 'St. Louis', store_format: 'Express' },
  { store_id: 'STR-020', store_name: 'Buckeye Plaza Outlets', region: 'North', city: 'Columbus', store_format: 'Outlet' },
];

export const productCategories = [
  'Consumer Electronics',
  'Apparel & Footwear',
  'Fresh Groceries',
  'Home & Living',
  'Beauty & Personal Care',
  'Sports & Outdoors',
];

/**
 * Generates the benchmark weekly sales dataset with exactly 1,920 rows:
 * 16 Weeks x 20 Stores x 6 Product Categories = 1,920 transactional rows.
 */
export function generateBenchmarkSalesData(): RawSalesRecord[] {
  const weeks = [
    '2024-09-02',
    '2024-09-09',
    '2024-09-16',
    '2024-09-23',
    '2024-09-30',
    '2024-10-07',
    '2024-10-14',
    '2024-10-21',
    '2024-10-28',
    '2024-11-04',
    '2024-11-11',
    '2024-11-18',
    '2024-11-25', // Black Friday peak week
    '2024-12-02', // Cyber week
    '2024-12-09',
    '2024-12-16', // Holiday shopping peak
  ];

  const records: RawSalesRecord[] = [];

  weeks.forEach((week, weekIndex) => {
    // Peak multiplier for holiday weeks
    const isHolidayPeak = weekIndex >= 12 && weekIndex <= 15;
    const seasonMultiplier = isHolidayPeak ? 1.35 : 1.0;

    sampleStoreMaster.forEach((store, storeIndex) => {
      // Store format baseline multipliers
      const formatMultiplier =
        store.store_format === 'Flagship'
          ? 1.5
          : store.store_format === 'Hypermarket'
          ? 1.35
          : store.store_format === 'Supermarket'
          ? 1.05
          : store.store_format === 'Outlet'
          ? 0.9
          : 0.72; // Express

      // Regional adjustment
      const regionMultiplier =
        store.region === 'East'
          ? 1.12
          : store.region === 'West'
          ? 1.15
          : store.region === 'South'
          ? 1.02
          : 0.92; // North

      productCategories.forEach((category, catIndex) => {
        // Deterministic pseudo-random seed per store+week+category
        const hash = (storeIndex * 37 + weekIndex * 23 + catIndex * 41) % 100;
        const variation = 0.88 + (hash / 100) * 0.28; // 0.88 to 1.16

        const baseFootfall = Math.round(1600 * formatMultiplier * regionMultiplier * (isHolidayPeak ? 1.45 : 1.0) * variation);
        const conversionRate = 0.23 + ((hash % 14) / 100); // 23% - 37%
        const transactions = Math.round(baseFootfall * conversionRate);
        const unitsSold = Math.round(transactions * (1.6 + (hash % 15) / 10));

        let avgPrice = 45;
        let returnRateBase = 0.05;
        let stockoutChance = 2;

        if (category === 'Consumer Electronics') {
          avgPrice = 220;
          returnRateBase = 0.11;
          stockoutChance = 7;
        } else if (category === 'Apparel & Footwear') {
          avgPrice = 62;
          returnRateBase = 0.15;
          stockoutChance = 5;
        } else if (category === 'Fresh Groceries') {
          avgPrice = 26;
          returnRateBase = 0.02;
          stockoutChance = 3;
        } else if (category === 'Home & Living') {
          avgPrice = 82;
          returnRateBase = 0.07;
          stockoutChance = 4;
        } else if (category === 'Beauty & Personal Care') {
          avgPrice = 38;
          returnRateBase = 0.04;
          stockoutChance = 2;
        } else if (category === 'Sports & Outdoors') {
          avgPrice = 88;
          returnRateBase = 0.08;
          stockoutChance = 5;
        }

        const rawGross = Math.round(transactions * avgPrice * seasonMultiplier * (variation * 0.9 + 0.1));
        const discountPct = 0.05 + ((hash % 10) / 100) + (isHolidayPeak ? 0.07 : 0);
        const discountAmount = Math.round(rawGross * discountPct);

        // Expected net sales
        const computedNet = rawGross - discountAmount;
        const targetMultiplier = store.region === 'North' ? 1.25 : 0.98 + ((hash % 20) / 100);
        const salesTarget = Math.round(computedNet * targetMultiplier);

        const returnsAmount = Math.round(rawGross * (returnRateBase + ((hash % 5) - 2) * 0.01));
        const inventoryOnHand = Math.round(unitsSold * (2.1 + ((hash % 8) / 4)));
        const stockouts = Math.max(0, Math.round(stockoutChance * (isHolidayPeak ? 1.6 : 1.0) * (hash > 70 ? 1.4 : 0.5) - 1));
        const rating = Number((3.9 + ((hash % 11) / 10)).toFixed(1));
        const marketingSpend = Math.round((rawGross * 0.035) + (isHolidayPeak ? 650 : 200));

        // Ingested data cleaning scenarios:
        // 1. Missing net_sales in ~10% of rows (tested formula: gross_sales - discount_amount)
        const hasMissingNetSales = (hash % 10 === 0);
        // 2. Formatted string gross sales in ~7% of rows
        const hasFormattedGross = (hash % 14 === 0);
        // 3. Alternative date format (MM/DD/YYYY) in ~8% of rows
        const hasAltDateFormat = (hash % 12 === 0);

        let finalGross: number | string = rawGross;
        if (hasFormattedGross) {
          finalGross = `$ ${rawGross.toLocaleString('en-US')}.00`;
        }

        let finalDate: string = week;
        if (hasAltDateFormat) {
          const [yyyy, mm, dd] = week.split('-');
          finalDate = `${mm}/${dd}/${yyyy}`;
        }

        const netSalesValue: number | string | null = hasMissingNetSales ? null : computedNet;

        records.push({
          week_start_date: finalDate,
          region: store.region,
          store_id: store.store_id,
          store_name: store.store_name,
          city: store.city,
          store_format: store.store_format,
          product_category: category,
          footfall: baseFootfall,
          transactions: transactions,
          units_sold: unitsSold,
          gross_sales: finalGross,
          discount_amount: discountAmount,
          net_sales: netSalesValue,
          sales_target: salesTarget,
          inventory_on_hand: inventoryOnHand,
          stockouts: stockouts,
          returns_amount: returnsAmount,
          customer_rating: rating,
          marketing_spend: marketingSpend,
        });
      });
    });
  });

  // Inject user-specified benchmark anomalies for automated data cleaning validation:
  if (records.length > 16) {
    records[16].net_sales = NaN;
  }
  if (records.length > 390) {
    records[390].gross_sales = 'not_available';
    if (!records[390].net_sales || isNaN(Number(records[390].net_sales))) {
      records[390].net_sales = 24500;
      records[390].discount_amount = 1800;
    }
  }
  if (records.length > 45) {
    records[45].week_start_date = 'invalid-date';
  }

  return records;
}
