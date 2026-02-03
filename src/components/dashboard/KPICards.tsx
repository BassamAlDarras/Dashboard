'use client';

import { useMemo } from 'react';
import { FileText, CheckCircle, Clock, XCircle, FolderOpen, AlertTriangle } from 'lucide-react';
import { useDashboard } from '@/context/DashboardContext';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  trend?: { value: number; isUp: boolean };
  onClick?: () => void;
}

function KPICard({ title, value, icon, color, trend, onClick }: KPICardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer group",
        "border border-gray-100 dark:border-slate-700"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</p>
          {trend && (
            <div className={cn(
              "flex items-center mt-2 text-sm font-medium",
              trend.isUp ? "text-green-600" : "text-red-600"
            )}>
              <span>{trend.isUp ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
              <span className="text-gray-400 ml-1">vs last month</span>
            </div>
          )}
        </div>
        <div className={cn(
          "flex items-center justify-center w-14 h-14 rounded-xl",
          color
        )}>
          {icon}
        </div>
      </div>
      <div className={cn(
        "absolute bottom-0 left-0 h-1 transition-all duration-300",
        color.replace('bg-', 'bg-').replace('/10', ''),
        "w-0 group-hover:w-full"
      )} style={{ backgroundColor: color.includes('blue') ? '#3B82F6' : color.includes('green') ? '#22C55E' : color.includes('amber') ? '#F59E0B' : '#EF4444' }} />
    </div>
  );
}

export default function KPICards() {
  const { getFilteredByDrillDown, navigateDrillDown } = useDashboard();

  const permits = getFilteredByDrillDown();

  const kpiData = useMemo(() => {
    const approved = permits.filter(p => p.currentStatus === 'Approved').length;
    const rejected = permits.filter(p => p.currentStatus === 'Rejected').length;
    const inProgress = permits.filter(p => 
      ['Technical Review', 'Pending', 'Inspection', 'Consultant', 'Need modification'].includes(p.currentStatus)
    ).length;
    const opened = permits.filter(p => p.status === 'Opened').length;

    return { approved, rejected, inProgress, opened, total: permits.length };
  }, [permits]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <KPICard
        title="Total Permits"
        value={kpiData.total}
        icon={<FolderOpen className="w-7 h-7 text-blue-600" />}
        color="bg-blue-500/10"
        trend={{ value: 12, isUp: true }}
      />
      <KPICard
        title="Approved"
        value={kpiData.approved}
        icon={<CheckCircle className="w-7 h-7 text-green-600" />}
        color="bg-green-500/10"
        trend={{ value: 8, isUp: true }}
        onClick={() => navigateDrillDown('status', 'Approved')}
      />
      <KPICard
        title="In Progress"
        value={kpiData.inProgress}
        icon={<Clock className="w-7 h-7 text-amber-600" />}
        color="bg-amber-500/10"
        trend={{ value: 5, isUp: false }}
      />
      <KPICard
        title="Rejected"
        value={kpiData.rejected}
        icon={<XCircle className="w-7 h-7 text-red-600" />}
        color="bg-red-500/10"
        trend={{ value: 3, isUp: false }}
        onClick={() => navigateDrillDown('status', 'Rejected')}
      />
    </div>
  );
}
