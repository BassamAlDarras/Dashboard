'use client';

import { ChevronRight, Home, RotateCcw } from 'lucide-react';
import { useInspection } from '@/context/InspectionContext';

export default function InspectionBreadcrumb() {
  const { drillDown, goBackDrillDown, resetDrillDown } = useInspection();

  if (drillDown.level === 0) return null;

  const typeLabels: Record<string, string> = {
    inspectionType: 'Type',
    status: 'Status',
    inspector: 'Inspector',
    zone: 'Zone',
    priority: 'Priority',
    category: 'Category',
  };

  const formatValue = (value: string) => {
    if (value.startsWith('_group_')) {
      return 'All ' + typeLabels[value.replace('_group_', '')] + 's';
    }
    return value;
  };

  return (
    <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl px-4 py-3 shadow-sm border border-gray-100 dark:border-slate-700">
      <nav className="flex items-center gap-1 flex-wrap">
        <button
          onClick={resetDrillDown}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>Inspections</span>
        </button>
        
        {drillDown.breadcrumb.map((crumb, index) => (
          <div key={index} className="flex items-center gap-1">
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <button
              onClick={() => {
                const steps = drillDown.breadcrumb.length - index;
                for (let i = 0; i < steps; i++) {
                  goBackDrillDown();
                }
              }}
              className={`px-2.5 py-1.5 text-sm rounded-lg transition-colors ${
                index === drillDown.breadcrumb.length - 1
                  ? 'font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-slate-700'
                  : 'font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              {crumb.type && <span className="text-gray-400 dark:text-gray-500 mr-1">{typeLabels[crumb.type]}:</span>}
              {crumb.value ? formatValue(crumb.value) : 'Overview'}
            </button>
          </div>
        ))}
      </nav>
      
      <button
        onClick={resetDrillDown}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
      >
        <RotateCcw className="w-4 h-4" />
        <span className="hidden sm:inline">Reset</span>
      </button>
    </div>
  );
}
