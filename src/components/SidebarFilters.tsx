import React, { useState, useMemo } from 'react';
import { FilterState, RetailSalesRecord } from '../types';
import {
  Filter,
  RotateCcw,
  Calendar,
  MapPin,
  Building2,
  Tag,
  Store,
  ChevronDown,
  ChevronUp,
  Search,
  CheckSquare,
  Square,
} from 'lucide-react';

interface SidebarFiltersProps {
  allRecords: RetailSalesRecord[];
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  filteredCount: number;
}

export const SidebarFilters: React.FC<SidebarFiltersProps> = ({
  allRecords,
  filters,
  onFilterChange,
  filteredCount,
}) => {
  // Search states for dropdown filters
  const [storeSearch, setStoreSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');

  // Collapsible sections
  const [openSections, setOpenSections] = useState({
    date: true,
    region: true,
    city: false,
    format: true,
    category: true,
    store: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Derive unique options from allRecords
  // Metadata lookups to support rich display and cascading relationships
  const metadataLookups = useMemo(() => {
    const cityRegionMap = new Map<string, string>();
    const storeDetailsMap = new Map<
      string,
      { region: string; city: string; store_format: string }
    >();

    allRecords.forEach((r) => {
      if (r.city && r.region && !cityRegionMap.has(r.city)) {
        cityRegionMap.set(r.city, r.region);
      }
      if (r.store_name && !storeDetailsMap.has(r.store_name)) {
        storeDetailsMap.set(r.store_name, {
          region: r.region,
          city: r.city,
          store_format: r.store_format,
        });
      }
    });

    return { cityRegionMap, storeDetailsMap };
  }, [allRecords]);

  // Chained Cascading Filter Options Computation
  const availableOptions = useMemo(() => {
    const allRegions = new Set<string>();
    const dates: string[] = [];

    allRecords.forEach((r) => {
      if (r.region) allRegions.add(r.region);
      if (r.week_start_date) dates.push(r.week_start_date);
    });

    // 1. Cascaded Cities: records matching selected Region(s)
    const cascadedCities = new Set<string>();
    allRecords.forEach((r) => {
      const matchRegion = filters.regions.length === 0 || filters.regions.includes(r.region);
      if (matchRegion && r.city) {
        cascadedCities.add(r.city);
      }
    });

    // 2. Cascaded Store Formats: records matching selected Region(s) AND selected City/Cities
    const cascadedFormats = new Set<string>();
    allRecords.forEach((r) => {
      const matchRegion = filters.regions.length === 0 || filters.regions.includes(r.region);
      const matchCity = filters.cities.length === 0 || filters.cities.includes(r.city);
      if (matchRegion && matchCity && r.store_format) {
        cascadedFormats.add(r.store_format);
      }
    });

    // 3. Cascaded Store Names: records matching Region(s), City/Cities, AND Store Format(s)
    const cascadedStores = new Set<string>();
    allRecords.forEach((r) => {
      const matchRegion = filters.regions.length === 0 || filters.regions.includes(r.region);
      const matchCity = filters.cities.length === 0 || filters.cities.includes(r.city);
      const matchFormat = filters.storeFormats.length === 0 || filters.storeFormats.includes(r.store_format);
      if (matchRegion && matchCity && matchFormat && r.store_name) {
        cascadedStores.add(r.store_name);
      }
    });

    // 4. Cascaded Categories: records matching Region(s), City/Cities, Format(s), and Store(s)
    const cascadedCategories = new Set<string>();
    allRecords.forEach((r) => {
      const matchRegion = filters.regions.length === 0 || filters.regions.includes(r.region);
      const matchCity = filters.cities.length === 0 || filters.cities.includes(r.city);
      const matchFormat = filters.storeFormats.length === 0 || filters.storeFormats.includes(r.store_format);
      const matchStore = filters.storeNames.length === 0 || filters.storeNames.includes(r.store_name);
      if (matchRegion && matchCity && matchFormat && matchStore && r.product_category) {
        cascadedCategories.add(r.product_category);
      }
    });

    dates.sort();
    const minDate = dates[0] || '2024-01-01';
    const maxDate = dates[dates.length - 1] || '2024-12-31';

    return {
      regions: Array.from(allRegions).sort(),
      cities: Array.from(cascadedCities).sort(),
      storeFormats: Array.from(cascadedFormats).sort(),
      storeNames: Array.from(cascadedStores).sort(),
      categories: Array.from(cascadedCategories).sort(),
      minDate,
      maxDate,
      distinctDates: Array.from(new Set(dates)).sort(),
    };
  }, [allRecords, filters.regions, filters.cities, filters.storeFormats, filters.storeNames]);

  const [dateMode, setDateMode] = useState<'range' | 'multiselect'>('range');

  // Intelligent chained toggle for Region with automatic child filter pruning
  const handleToggleRegion = (region: string) => {
    const nextRegions = filters.regions.includes(region)
      ? filters.regions.filter((r) => r !== region)
      : [...filters.regions, region];

    // Determine valid cities under nextRegions
    const validCities = new Set<string>();
    const validFormats = new Set<string>();
    const validStores = new Set<string>();

    allRecords.forEach((r) => {
      if (nextRegions.length === 0 || nextRegions.includes(r.region)) {
        if (r.city) validCities.add(r.city);
      }
    });

    const prunedCities = filters.cities.filter((c) => validCities.has(c));

    allRecords.forEach((r) => {
      const matchRegion = nextRegions.length === 0 || nextRegions.includes(r.region);
      const matchCity = prunedCities.length === 0 || prunedCities.includes(r.city);
      if (matchRegion && matchCity) {
        if (r.store_format) validFormats.add(r.store_format);
        if (r.store_name) validStores.add(r.store_name);
      }
    });

    const prunedFormats = filters.storeFormats.filter((f) => validFormats.has(f));
    const prunedStores = filters.storeNames.filter((s) => validStores.has(s));

    onFilterChange({
      ...filters,
      regions: nextRegions,
      cities: prunedCities,
      storeFormats: prunedFormats,
      storeNames: prunedStores,
    });
  };

  // Intelligent chained toggle for City with automatic child filter pruning
  const handleToggleCity = (city: string) => {
    const nextCities = filters.cities.includes(city)
      ? filters.cities.filter((c) => c !== city)
      : [...filters.cities, city];

    const validFormats = new Set<string>();
    const validStores = new Set<string>();

    allRecords.forEach((r) => {
      const matchRegion = filters.regions.length === 0 || filters.regions.includes(r.region);
      const matchCity = nextCities.length === 0 || nextCities.includes(r.city);
      if (matchRegion && matchCity) {
        if (r.store_format) validFormats.add(r.store_format);
        if (r.store_name) validStores.add(r.store_name);
      }
    });

    const prunedFormats = filters.storeFormats.filter((f) => validFormats.has(f));
    const prunedStores = filters.storeNames.filter((s) => validStores.has(s));

    onFilterChange({
      ...filters,
      cities: nextCities,
      storeFormats: prunedFormats,
      storeNames: prunedStores,
    });
  };

  // Intelligent chained toggle for Store Format with automatic store pruning
  const handleToggleFormat = (format: string) => {
    const nextFormats = filters.storeFormats.includes(format)
      ? filters.storeFormats.filter((f) => f !== format)
      : [...filters.storeFormats, format];

    const validStores = new Set<string>();
    allRecords.forEach((r) => {
      const matchRegion = filters.regions.length === 0 || filters.regions.includes(r.region);
      const matchCity = filters.cities.length === 0 || filters.cities.includes(r.city);
      const matchFormat = nextFormats.length === 0 || nextFormats.includes(r.store_format);
      if (matchRegion && matchCity && matchFormat && r.store_name) {
        validStores.add(r.store_name);
      }
    });

    const prunedStores = filters.storeNames.filter((s) => validStores.has(s));

    onFilterChange({
      ...filters,
      storeFormats: nextFormats,
      storeNames: prunedStores,
    });
  };

  // Generic toggle for other multi-selects
  const toggleSelection = (key: keyof Omit<FilterState, 'startDate' | 'endDate'>, value: string) => {
    if (key === 'regions') {
      handleToggleRegion(value);
      return;
    }
    if (key === 'cities') {
      handleToggleCity(value);
      return;
    }
    if (key === 'storeFormats') {
      handleToggleFormat(value);
      return;
    }
    const current = filters[key];
    const exists = current.includes(value);
    const updated = exists ? current.filter((item) => item !== value) : [...current, value];
    onFilterChange({ ...filters, [key]: updated });
  };

  const selectAll = (key: keyof Omit<FilterState, 'startDate' | 'endDate'>, values: string[]) => {
    onFilterChange({ ...filters, [key]: values });
  };

  const clearSelection = (key: keyof Omit<FilterState, 'startDate' | 'endDate'>) => {
    onFilterChange({ ...filters, [key]: [] });
  };

  const resetAllFilters = () => {
    onFilterChange({
      weekStartDates: [],
      regions: [],
      cities: [],
      storeFormats: [],
      storeNames: [],
      productCategories: [],
      startDate: availableOptions.minDate,
      endDate: availableOptions.maxDate,
    });
    setStoreSearch('');
    setCitySearch('');
  };

  // Quick date presets
  const applyDatePreset = (preset: 'all' | 'last4' | 'last8') => {
    const dates = availableOptions.distinctDates;
    if (dates.length === 0) return;

    if (preset === 'all') {
      onFilterChange({
        ...filters,
        startDate: dates[0],
        endDate: dates[dates.length - 1],
      });
    } else if (preset === 'last4') {
      const startIdx = Math.max(0, dates.length - 4);
      onFilterChange({
        ...filters,
        startDate: dates[startIdx],
        endDate: dates[dates.length - 1],
      });
    } else if (preset === 'last8') {
      const startIdx = Math.max(0, dates.length - 8);
      onFilterChange({
        ...filters,
        startDate: dates[startIdx],
        endDate: dates[dates.length - 1],
      });
    }
  };

  const filteredCities = availableOptions.cities.filter((c) =>
    c.toLowerCase().includes(citySearch.toLowerCase())
  );

  const filteredStores = availableOptions.storeNames.filter((s) =>
    s.toLowerCase().includes(storeSearch.toLowerCase())
  );

  const isAnyFilterActive =
    (filters.weekStartDates && filters.weekStartDates.length > 0) ||
    filters.regions.length > 0 ||
    filters.cities.length > 0 ||
    filters.storeFormats.length > 0 ||
    filters.storeNames.length > 0 ||
    filters.productCategories.length > 0 ||
    filters.startDate !== availableOptions.minDate ||
    filters.endDate !== availableOptions.maxDate;

  return (
    <aside
      id="dashboard-sidebar-filters"
      className="w-full lg:w-72 lg:sticky lg:top-20 self-start bg-white border border-slate-200/90 rounded-xl p-4 flex flex-col shadow-2xs"
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-indigo-600" />
          <h2 className="font-semibold text-slate-900 text-sm">Dashboard Filters</h2>
        </div>
        {isAnyFilterActive && (
          <button
            onClick={resetAllFilters}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 transition-colors"
            title="Reset all filters to default"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

      {/* Filter Statistics Badge */}
      <div className="mt-3 p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs flex items-center justify-between text-slate-600">
        <span>Matching Records:</span>
        <span className="font-bold text-slate-900">
          {filteredCount} / {allRecords.length}
        </span>
      </div>

      <div className="mt-4 space-y-4 overflow-y-auto max-h-[calc(100vh-250px)] pr-1">
        {/* 1. Date Range Filter */}
        <div className="border-b border-slate-100 pb-3">
          <button
            onClick={() => toggleSection('date')}
            className="w-full flex items-center justify-between text-xs font-semibold text-slate-800 py-1"
          >
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Date Range (week_start_date)
            </span>
            {openSections.date ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {openSections.date && (
            <div className="mt-2 space-y-2.5">
              {/* Toggle Mode: Range vs Multi-Select */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px] font-medium">
                <button
                  type="button"
                  onClick={() => setDateMode('range')}
                  className={`flex-1 py-1 rounded text-center transition-colors ${
                    dateMode === 'range' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Date Range
                </button>
                <button
                  type="button"
                  onClick={() => setDateMode('multiselect')}
                  className={`flex-1 py-1 rounded text-center transition-colors ${
                    dateMode === 'multiselect' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Multi-Select Weeks {filters.weekStartDates?.length > 0 && `(${filters.weekStartDates.length})`}
                </button>
              </div>

              {dateMode === 'range' ? (
                <>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      type="button"
                      onClick={() => applyDatePreset('all')}
                      className="px-2 py-1 text-[11px] rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDatePreset('last4')}
                      className="px-2 py-1 text-[11px] rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                    >
                      Last 4 Wks
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDatePreset('last8')}
                      className="px-2 py-1 text-[11px] rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                    >
                      Last 8 Wks
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-0.5">Start Date</label>
                      <input
                        type="date"
                        value={filters.startDate}
                        min={availableOptions.minDate}
                        max={filters.endDate || availableOptions.maxDate}
                        onChange={(e) => onFilterChange({ ...filters, startDate: e.target.value })}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-0.5">End Date</label>
                      <input
                        type="date"
                        value={filters.endDate}
                        min={filters.startDate || availableOptions.minDate}
                        max={availableOptions.maxDate}
                        onChange={(e) => onFilterChange({ ...filters, endDate: e.target.value })}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pb-1 border-b border-slate-100">
                    <span>Select Specific Weeks</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onFilterChange({ ...filters, weekStartDates: [...availableOptions.distinctDates] })}
                        className="text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        All
                      </button>
                      <span>|</span>
                      <button
                        type="button"
                        onClick={() => onFilterChange({ ...filters, weekStartDates: [] })}
                        className="text-slate-500 hover:text-slate-800 font-medium"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                    {availableOptions.distinctDates.map((d) => {
                      const isSelected = filters.weekStartDates?.includes(d);
                      return (
                        <label
                          key={d}
                          className="flex items-center gap-2 text-xs text-slate-700 hover:bg-slate-50 p-1 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(isSelected)}
                            onChange={() => {
                              const current = filters.weekStartDates || [];
                              const updated = current.includes(d)
                                ? current.filter((item) => item !== d)
                                : [...current, d];
                              onFilterChange({ ...filters, weekStartDates: updated });
                            }}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="font-mono text-[11px]">{d}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. Region Filter */}
        <div className="border-b border-slate-100 pb-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-800 py-1">
            <button
              onClick={() => toggleSection('region')}
              className="flex items-center gap-1.5 text-left flex-1"
            >
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>Region</span>
              {filters.regions.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-700">
                  {filters.regions.length}
                </span>
              )}
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={() => selectAll('regions', availableOptions.regions)}
                className="text-[10px] text-slate-400 hover:text-slate-600 px-1"
              >
                All
              </button>
              <span className="text-slate-300 text-[10px]">|</span>
              <button
                onClick={() => clearSelection('regions')}
                className="text-[10px] text-slate-400 hover:text-slate-600 px-1"
              >
                Clear
              </button>
              <button onClick={() => toggleSection('region')}>
                {openSections.region ? <ChevronUp className="w-3.5 h-3.5 text-slate-400 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />}
              </button>
            </div>
          </div>

          {openSections.region && (
            <div className="mt-2 space-y-1 max-h-36 overflow-y-auto">
              {availableOptions.regions.map((region) => {
                const isChecked = filters.regions.length === 0 || filters.regions.includes(region);
                const isExplicitlySelected = filters.regions.includes(region);

                return (
                  <label
                    key={region}
                    className="flex items-center justify-between px-2 py-1 rounded hover:bg-slate-50 cursor-pointer text-xs group"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isExplicitlySelected}
                        onChange={() => toggleSelection('regions', region)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 border-slate-300"
                      />
                      <span className={isExplicitlySelected ? 'font-semibold text-indigo-900' : 'text-slate-700'}>
                        {region}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Product Category Filter */}
        <div className="border-b border-slate-100 pb-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-800 py-1">
            <button
              onClick={() => toggleSection('category')}
              className="flex items-center gap-1.5 text-left flex-1"
            >
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              <span>Product Category</span>
              {filters.productCategories.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-700">
                  {filters.productCategories.length}
                </span>
              )}
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={() => selectAll('productCategories', availableOptions.categories)}
                className="text-[10px] text-slate-400 hover:text-slate-600 px-1"
              >
                All
              </button>
              <span className="text-slate-300 text-[10px]">|</span>
              <button
                onClick={() => clearSelection('productCategories')}
                className="text-[10px] text-slate-400 hover:text-slate-600 px-1"
              >
                Clear
              </button>
              <button onClick={() => toggleSection('category')}>
                {openSections.category ? <ChevronUp className="w-3.5 h-3.5 text-slate-400 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />}
              </button>
            </div>
          </div>

          {openSections.category && (
            <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
              {availableOptions.categories.map((cat) => {
                const isSelected = filters.productCategories.includes(cat);
                return (
                  <label
                    key={cat}
                    className="flex items-center justify-between px-2 py-1 rounded hover:bg-slate-50 cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection('productCategories', cat)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 border-slate-300"
                      />
                      <span className={isSelected ? 'font-semibold text-indigo-900' : 'text-slate-700'}>
                        {cat}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Store Format Filter */}
        <div className="border-b border-slate-100 pb-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-800 py-1">
            <button
              onClick={() => toggleSection('format')}
              className="flex items-center gap-1.5 text-left flex-1"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Store Format</span>
              {filters.storeFormats.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-700">
                  {filters.storeFormats.length}
                </span>
              )}
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={() => selectAll('storeFormats', availableOptions.storeFormats)}
                className="text-[10px] text-slate-400 hover:text-slate-600 px-1"
              >
                All
              </button>
              <span className="text-slate-300 text-[10px]">|</span>
              <button
                onClick={() => clearSelection('storeFormats')}
                className="text-[10px] text-slate-400 hover:text-slate-600 px-1"
              >
                Clear
              </button>
              <button onClick={() => toggleSection('format')}>
                {openSections.format ? <ChevronUp className="w-3.5 h-3.5 text-slate-400 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />}
              </button>
            </div>
          </div>

          {openSections.format && (
            <div className="mt-2 space-y-1">
              {availableOptions.storeFormats.length === 0 ? (
                <div className="text-[11px] text-slate-400 italic py-1 px-2">
                  No formats match active region/city filters
                </div>
              ) : (
                availableOptions.storeFormats.map((format) => {
                  const isSelected = filters.storeFormats.includes(format);
                  return (
                    <label
                      key={format}
                      className="flex items-center justify-between px-2 py-1 rounded hover:bg-slate-50 cursor-pointer text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelection('storeFormats', format)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 border-slate-300"
                        />
                        <span className={isSelected ? 'font-semibold text-indigo-900' : 'text-slate-700'}>
                          {format}
                        </span>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* 5. City Filter (Cascaded from Region) */}
        <div className="border-b border-slate-100 pb-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-800 py-1">
            <button
              onClick={() => toggleSection('city')}
              className="flex items-center gap-1.5 text-left flex-1"
            >
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>City</span>
              {filters.regions.length > 0 && (
                <span className="text-[10px] text-indigo-600 font-normal ml-0.5">
                  (linked)
                </span>
              )}
              {filters.cities.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-700">
                  {filters.cities.length}
                </span>
              )}
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={() => selectAll('cities', availableOptions.cities)}
                className="text-[10px] text-slate-400 hover:text-slate-600 px-1"
              >
                All
              </button>
              <span className="text-slate-300 text-[10px]">|</span>
              <button
                onClick={() => clearSelection('cities')}
                className="text-[10px] text-slate-400 hover:text-slate-600 px-1"
              >
                Clear
              </button>
              <button onClick={() => toggleSection('city')}>
                {openSections.city ? <ChevronUp className="w-3.5 h-3.5 text-slate-400 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />}
              </button>
            </div>
          </div>

          {openSections.city && (
            <div className="mt-2 space-y-1.5">
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2 top-2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search city..."
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  className="w-full pl-7 pr-2 py-1 border border-slate-200 rounded text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1">
                {filteredCities.length === 0 ? (
                  <div className="text-[11px] text-slate-400 italic py-1 px-2">
                    {availableOptions.cities.length === 0
                      ? 'No cities match selected region'
                      : 'No matching cities found'}
                  </div>
                ) : (
                  filteredCities.map((city) => {
                    const isSelected = filters.cities.includes(city);
                    const regionName = metadataLookups.cityRegionMap.get(city);
                    return (
                      <label
                        key={city}
                        className="flex items-center justify-between px-2 py-1 rounded hover:bg-slate-50 cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelection('cities', city)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 border-slate-300"
                          />
                          <span className={isSelected ? 'font-semibold text-indigo-900' : 'text-slate-700'}>
                            {city}
                          </span>
                        </div>
                        {regionName && (
                          <span className="text-[10px] text-slate-400">
                            {regionName}
                          </span>
                        )}
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* 6. Store Name Filter (Cascaded from Region, City, Format) */}
        <div className="pb-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-800 py-1">
            <button
              onClick={() => toggleSection('store')}
              className="flex items-center gap-1.5 text-left flex-1"
            >
              <Store className="w-3.5 h-3.5 text-slate-500" />
              <span>Store Name</span>
              {(filters.regions.length > 0 || filters.cities.length > 0 || filters.storeFormats.length > 0) && (
                <span className="text-[10px] text-indigo-600 font-normal ml-0.5">
                  (linked)
                </span>
              )}
              {filters.storeNames.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-700">
                  {filters.storeNames.length}
                </span>
              )}
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={() => selectAll('storeNames', availableOptions.storeNames)}
                className="text-[10px] text-slate-400 hover:text-slate-600 px-1"
              >
                All
              </button>
              <span className="text-slate-300 text-[10px]">|</span>
              <button
                onClick={() => clearSelection('storeNames')}
                className="text-[10px] text-slate-400 hover:text-slate-600 px-1"
              >
                Clear
              </button>
              <button onClick={() => toggleSection('store')}>
                {openSections.store ? <ChevronUp className="w-3.5 h-3.5 text-slate-400 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />}
              </button>
            </div>
          </div>

          {openSections.store && (
            <div className="mt-2 space-y-1.5">
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2 top-2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search store name..."
                  value={storeSearch}
                  onChange={(e) => setStoreSearch(e.target.value)}
                  className="w-full pl-7 pr-2 py-1 border border-slate-200 rounded text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {filteredStores.length === 0 ? (
                  <div className="text-[11px] text-slate-400 italic py-1 px-2">
                    {availableOptions.storeNames.length === 0
                      ? 'No stores match active filters'
                      : 'No matching stores found'}
                  </div>
                ) : (
                  filteredStores.map((st) => {
                    const isSelected = filters.storeNames.includes(st);
                    const details = metadataLookups.storeDetailsMap.get(st);
                    return (
                      <label
                        key={st}
                        className="flex items-center justify-between px-2 py-1 rounded hover:bg-slate-50 cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelection('storeNames', st)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 border-slate-300 shrink-0"
                          />
                          <span className={`truncate ${isSelected ? 'font-semibold text-indigo-900' : 'text-slate-700'}`}>
                            {st}
                          </span>
                        </div>
                        {details && (
                          <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                            {details.city} • {details.store_format}
                          </span>
                        )}
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
