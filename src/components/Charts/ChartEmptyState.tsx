import React from 'react';
import { BarChart3 } from 'lucide-react';

interface ChartEmptyStateProps {
  message?: string;
  subtext?: string;
}

export const ChartEmptyState: React.FC<ChartEmptyStateProps> = ({
  message = 'No Data Available',
  subtext = 'Adjust your filter combination or reset date selections to display analytics.',
}) => {
  return (
    <div className="h-full min-h-[220px] flex flex-col items-center justify-center p-6 text-center rounded-lg bg-slate-50/60 border border-dashed border-slate-200">
      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-2.5">
        <BarChart3 className="w-5 h-5" />
      </div>
      <p className="text-sm font-semibold text-slate-700">{message}</p>
      <p className="text-xs text-slate-400 mt-1 max-w-xs">{subtext}</p>
    </div>
  );
};
