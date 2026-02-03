'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, MousePointer } from 'lucide-react';
import { useDashboard } from '@/context/DashboardContext';
import { countBy, CHART_COLORS } from '@/lib/utils';

export default function OwnerChart() {
  const { getFilteredByDrillDown, navigateDrillDown } = useDashboard();

  const data = useMemo(() => {
    const permits = getFilteredByDrillDown();
    const counts = countBy(permits, 'owner');
    
    return Object.entries(counts)
      .map(([name, value]) => ({
        name: name.split(' ').slice(0, 2).join(' '),
        fullName: name,
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [getFilteredByDrillDown]);

  const handleClick = (data: any) => {
    if (data && data.fullName) {
      navigateDrillDown('owner', data.fullName);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-3 border border-gray-100 dark:border-slate-700">
          <p className="font-medium text-gray-900 dark:text-white text-sm">{item.fullName}</p>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Permits: <span className="font-semibold">{item.value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 p-6 h-full">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-teal-500" />
        <h3 className="font-semibold text-gray-900 dark:text-white">Top Owners</h3>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis 
              type="category" 
              dataKey="name" 
              tick={{ fontSize: 10 }} 
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="value" 
              radius={[0, 4, 4, 0]}
              onClick={handleClick}
              style={{ cursor: 'pointer' }}
            >
              {data.map((_, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={CHART_COLORS.primary[index % CHART_COLORS.primary.length]} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
        <MousePointer className="w-3 h-3" />
        <span>Click to filter by owner</span>
      </div>
    </div>
  );
}
