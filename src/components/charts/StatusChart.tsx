'use client';

import { useMemo, useState } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Sector
} from 'recharts';
import { Activity, MousePointer } from 'lucide-react';
import { useDashboard } from '@/context/DashboardContext';
import { getChartData, CHART_COLORS, cn } from '@/lib/utils';

const renderActiveShape = (props: any) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value
  } = props;

  return (
    <g>
      <text x={cx} y={cy - 5} textAnchor="middle" fill={fill} className="text-sm font-semibold">
        {payload.name}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#999" className="text-xs">
        {value} ({(percent * 100).toFixed(0)}%)
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

export default function StatusChart() {
  const { getFilteredByDrillDown, navigateDrillDown } = useDashboard();
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');

  const data = useMemo(() => {
    const permits = getFilteredByDrillDown();
    return getChartData(permits, 'currentStatus', CHART_COLORS.status);
  }, [getFilteredByDrillDown]);

  const handleClick = (data: any) => {
    if (data && data.name) {
      navigateDrillDown('status', data.name);
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
            Count: <span className="font-semibold">{item.value}</span>
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-xs">
            {item.percentage}% of filtered
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Status Distribution</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setChartType('pie')}
            className={cn(
              "p-1.5 rounded-lg transition-all text-xs",
              chartType === 'pie' 
                ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600" 
                : "text-gray-400 hover:text-gray-600"
            )}
          >
            Pie
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={cn(
              "p-1.5 rounded-lg transition-all text-xs",
              chartType === 'bar' 
                ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600" 
                : "text-gray-400 hover:text-gray-600"
            )}
          >
            Bar
          </button>
        </div>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'pie' ? (
            <PieChart>
              <Pie
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(undefined)}
                onClick={handleClick}
                style={{ cursor: 'pointer' }}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          ) : (
            <BarChart data={data} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10 }} 
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 11 }} width={30} />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="value" 
                radius={[4, 4, 0, 0]}
                onClick={handleClick}
                style={{ cursor: 'pointer' }}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
        <MousePointer className="w-3 h-3" />
        <span>Click to drill down</span>
      </div>

      {/* Mini legend */}
      <div className="mt-3 flex flex-wrap gap-2 justify-center">
        {data.slice(0, 5).map((item, index) => (
          <div 
            key={index}
            className="flex items-center gap-1.5 text-xs cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => handleClick(item)}
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
