'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, MousePointer } from 'lucide-react';
import { useDashboard } from '@/context/DashboardContext';
import { getChartData, CHART_COLORS, cn } from '@/lib/utils';

export default function PriorityChart() {
  const { getFilteredByDrillDown, navigateDrillDown } = useDashboard();

  const data = useMemo(() => {
    const permits = getFilteredByDrillDown();
    return getChartData(permits, 'priority', CHART_COLORS.priority);
  }, [getFilteredByDrillDown]);

  const handleClick = (data: any) => {
    if (data && data.name) {
      navigateDrillDown('priority', data.name);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-3 border border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <p className="font-medium text-gray-900 dark:text-white text-sm">{item.name} Priority</p>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Permits: <span className="font-semibold">{item.value}</span>
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-xs">
            {item.percentage}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 p-6 h-full">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-amber-500" />
        <h3 className="font-semibold text-gray-900 dark:text-white">Priority Levels</h3>
      </div>

      <div className="h-40 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={60}
              paddingAngle={4}
              dataKey="value"
              onClick={handleClick}
              style={{ cursor: 'pointer' }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{total}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
        </div>
      </div>

      {/* Priority bars */}
      <div className="space-y-3 mt-4">
        {data.map((item, index) => (
          <div 
            key={index}
            className="cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 p-2 rounded-lg transition-colors -mx-2"
            onClick={() => handleClick(item)}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {item.value} <span className="text-gray-400 font-normal">({item.percentage}%)</span>
              </span>
            </div>
            <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${item.percentage}%`,
                  backgroundColor: item.color 
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-1 mt-3 text-xs text-gray-500 dark:text-gray-400">
        <MousePointer className="w-3 h-3" />
        <span>Click to filter</span>
      </div>
    </div>
  );
}
