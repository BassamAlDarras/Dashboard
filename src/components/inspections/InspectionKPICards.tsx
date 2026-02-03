'use client';

import { useMemo } from 'react';
import { ClipboardCheck, CheckCircle2, Clock, AlertTriangle, XCircle, Calendar, TrendingUp, Target } from 'lucide-react';
import { useInspection } from '@/context/InspectionContext';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  trend?: { value: number; isUp: boolean };
  onClick?: () => void;
  size?: 'normal' | 'large';
}

function KPICard({ title, value, icon, color, subtitle, trend, onClick, size = 'normal' }: KPICardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-card hover:shadow-card-hover transition-all duration-300",
        "border border-gray-100 dark:border-slate-700",
        onClick && "cursor-pointer",
        size === 'large' ? 'p-6' : 'p-5'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
          <p className={cn(
            "font-bold text-gray-900 dark:text-white",
            size === 'large' ? 'text-3xl' : 'text-2xl'
          )}>{typeof value === 'number' ? value.toLocaleString() : value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              "flex items-center mt-2 text-sm font-medium",
              trend.isUp ? "text-green-600" : "text-red-600"
            )}>
              <span>{trend.isUp ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
              <span className="text-gray-400 ml-1">vs last week</span>
            </div>
          )}
        </div>
        <div className={cn(
          "flex items-center justify-center rounded-xl",
          size === 'large' ? 'w-14 h-14' : 'w-12 h-12',
          color
        )}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function InspectionKPICards() {
  const { getFilteredByDrillDown, navigateDrillDown } = useInspection();

  const inspections = getFilteredByDrillDown();

  const kpiData = useMemo(() => {
    const completed = inspections.filter(i => i.status === 'Completed').length;
    const pending = inspections.filter(i => i.status === 'Pending').length;
    const inProgress = inspections.filter(i => i.status === 'In Progress').length;
    const scheduled = inspections.filter(i => i.status === 'Scheduled').length;
    const failed = inspections.filter(i => i.status === 'Failed').length;
    
    const completedWithScores = inspections.filter(i => i.complianceScore !== null);
    const avgScore = completedWithScores.length > 0 
      ? Math.round(completedWithScores.reduce((acc, i) => acc + (i.complianceScore || 0), 0) / completedWithScores.length)
      : 0;
    
    const withinSLA = inspections.filter(i => i.slaStatus === 'Within SLA').length;
    const slaCompliance = inspections.length > 0 ? Math.round((withinSLA / inspections.length) * 100) : 0;

    return { 
      total: inspections.length, 
      completed, 
      pending, 
      inProgress, 
      scheduled, 
      failed, 
      avgScore,
      slaCompliance 
    };
  }, [inspections]);

  return (
    <div className="space-y-4">
      {/* Primary KPIs - Management View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Inspections"
          value={kpiData.total}
          icon={<ClipboardCheck className="w-6 h-6 text-blue-600" />}
          color="bg-blue-500/10"
          trend={{ value: 15, isUp: true }}
          size="large"
        />
        <KPICard
          title="Completed"
          value={kpiData.completed}
          icon={<CheckCircle2 className="w-6 h-6 text-green-600" />}
          color="bg-green-500/10"
          subtitle={`${Math.round((kpiData.completed / kpiData.total) * 100) || 0}% completion rate`}
          onClick={() => navigateDrillDown('status', 'Completed')}
          size="large"
        />
        <KPICard
          title="Avg Compliance Score"
          value={`${kpiData.avgScore}%`}
          icon={<Target className="w-6 h-6 text-purple-600" />}
          color="bg-purple-500/10"
          subtitle={kpiData.avgScore >= 90 ? 'Excellent' : kpiData.avgScore >= 70 ? 'Good' : 'Needs Improvement'}
          size="large"
        />
        <KPICard
          title="SLA Compliance"
          value={`${kpiData.slaCompliance}%`}
          icon={<TrendingUp className="w-6 h-6 text-indigo-600" />}
          color="bg-indigo-500/10"
          subtitle={kpiData.slaCompliance >= 95 ? 'On Target' : 'Below Target'}
          trend={{ value: 3, isUp: kpiData.slaCompliance >= 90 }}
          size="large"
        />
      </div>

      {/* Secondary KPIs - Operational View */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <KPICard
          title="Pending"
          value={kpiData.pending}
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          color="bg-amber-500/10"
          onClick={() => navigateDrillDown('status', 'Pending')}
        />
        <KPICard
          title="In Progress"
          value={kpiData.inProgress}
          icon={<Clock className="w-5 h-5 text-blue-600" />}
          color="bg-blue-500/10"
          onClick={() => navigateDrillDown('status', 'In Progress')}
        />
        <KPICard
          title="Scheduled"
          value={kpiData.scheduled}
          icon={<Calendar className="w-5 h-5 text-cyan-600" />}
          color="bg-cyan-500/10"
          onClick={() => navigateDrillDown('status', 'Scheduled')}
        />
        <KPICard
          title="Failed"
          value={kpiData.failed}
          icon={<XCircle className="w-5 h-5 text-red-600" />}
          color="bg-red-500/10"
          onClick={() => navigateDrillDown('status', 'Failed')}
        />
        <KPICard
          title="Reinspections"
          value={inspections.filter(i => i.reinspectionRequired).length}
          icon={<AlertTriangle className="w-5 h-5 text-orange-600" />}
          color="bg-orange-500/10"
        />
      </div>
    </div>
  );
}
