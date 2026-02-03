'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MapPin, MousePointer } from 'lucide-react';
import { useDashboard } from '@/context/DashboardContext';
import { getChartData, CHART_COLORS } from '@/lib/utils';

export default function ZoneChart() {
  const { getFilteredByDrillDown, navigateDrillDown } = useDashboard();

  const data = useMemo(() => {
    const permits = getFilteredByDrillDown();
    return getChartData(permits, 'zone', CHART_COLORS.zones);
  }, [getFilteredByDrillDown]);

  const handleClick = (data: any) => {
    if (data && data.name) {
      navigateDrillDown('zone', data.name);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-3 border border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <p className="font-medium text-gray-900 dark:text-white text-sm">{item.name}</p>
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

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 p-6 h-full">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-cyan-500" />
        <h3 className="font-semibold text-gray-900 dark:text-white">Zone Distribution</h3>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={70}
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
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 mt-2">
        {data.map((item, index) => (
          <div 
            key={index}
            className="flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 p-1.5 rounded-lg transition-colors"
            onClick={() => handleClick(item)}
          >
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-gray-600 dark:text-gray-300">{item.name}</span>
            <span className="text-gray-400 ml-auto font-medium">{item.value}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-1 mt-3 text-xs text-gray-500 dark:text-gray-400">
        <MousePointer className="w-3 h-3" />
        <span>Click to drill down</span>
      </div>
    </div>
  );
}
