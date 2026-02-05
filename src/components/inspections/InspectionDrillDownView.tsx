'use client';

import { useMemo, useState, useCallback } from 'react';
import { 
  ArrowRight, ClipboardCheck, Users, MapPin, AlertTriangle, Layers,
  Grid3X3, PieChartIcon, Eye, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  TrendingUp, Award, Clock, BarChart3, BarChart2, LineChart as LineChartIcon,
  AreaChart as AreaChartIcon, Target, CheckCircle2, Gauge, Table2, Columns3,
  LayoutGrid, List, Activity, Maximize2,
} from 'lucide-react';
import { useInspection } from '@/context/InspectionContext';
import { Inspection, InspectionDrillDownState } from '@/types';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, LineChart, Line, AreaChart, Area, RadialBarChart, RadialBar,
} from 'recharts';
import { formatDate } from '@/lib/utils';

type ChartType = 'pie' | 'bar' | 'horizontalBar' | 'line' | 'area' | 'radial';
type GroupViewStyle = 'tree' | 'treemap' | 'cards' | 'list' | 'data' | 'sunburst' | 'flow' | 'bubbles' | 'matrix';

const INSPECTION_COLORS = {
  status: { Completed: '#22C55E', Pending: '#F59E0B', 'In Progress': '#3B82F6', Scheduled: '#8B5CF6', Failed: '#EF4444', Cancelled: '#6B7280' },
  priority: { High: '#EF4444', Medium: '#F59E0B', Low: '#22C55E' },
  sla: { 'Within SLA': '#22C55E', 'SLA Breached': '#EF4444', 'N/A': '#9CA3AF' },
  category: ['#3B82F6', '#8B5CF6', '#06B6D4', '#F59E0B', '#EF4444', '#22C55E', '#EC4899', '#6366F1', '#14B8A6', '#F97316'],
};

const CHART_TYPE_OPTIONS: { id: ChartType; label: string; icon: React.ReactNode }[] = [
  { id: 'pie', label: 'Pie', icon: <PieChartIcon className="w-4 h-4" /> },
  { id: 'bar', label: 'Bar', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'horizontalBar', label: 'H-Bar', icon: <BarChart2 className="w-4 h-4 rotate-90" /> },
  { id: 'line', label: 'Line', icon: <LineChartIcon className="w-4 h-4" /> },
  { id: 'area', label: 'Area', icon: <AreaChartIcon className="w-4 h-4" /> },
  { id: 'radial', label: 'Radial', icon: <Gauge className="w-4 h-4" /> },
];

interface DrillDownOption { id: string; label: string; description: string; icon: React.ReactNode; type: 'inspectionType' | 'status' | 'inspector' | 'zone' | 'priority' | 'category'; }

const drillDownOptions: DrillDownOption[] = [
  { id: 'inspectionType', label: 'By Type', description: 'Analyze by inspection type', icon: <ClipboardCheck className="w-5 h-5" />, type: 'inspectionType' },
  { id: 'status', label: 'By Status', description: 'View status distribution', icon: <TrendingUp className="w-5 h-5" />, type: 'status' },
  { id: 'inspector', label: 'By Inspector', description: 'Workload distribution', icon: <Users className="w-5 h-5" />, type: 'inspector' },
  { id: 'zone', label: 'By Zone', description: 'Geographic analysis', icon: <MapPin className="w-5 h-5" />, type: 'zone' },
  { id: 'priority', label: 'By Priority', description: 'Priority breakdown', icon: <AlertTriangle className="w-5 h-5" />, type: 'priority' },
  { id: 'category', label: 'By Category', description: 'Category analysis', icon: <Layers className="w-5 h-5" />, type: 'category' },
];

function getStatusColor(status: string): string { return INSPECTION_COLORS.status[status as keyof typeof INSPECTION_COLORS.status] || '#6B7280'; }
function getPriorityColor(priority: string): string { return INSPECTION_COLORS.priority[priority as keyof typeof INSPECTION_COLORS.priority] || '#6B7280'; }
function getSLAColor(slaStatus: string): string { return INSPECTION_COLORS.sla[slaStatus as keyof typeof INSPECTION_COLORS.sla] || '#9CA3AF'; }
function getComplianceColor(score: number | null): string { if (score === null) return '#9CA3AF'; if (score >= 90) return '#22C55E'; if (score >= 70) return '#F59E0B'; return '#EF4444'; }

function calculateSLAMetrics(inspections: Inspection[]) {
  const total = inspections.length;
  const withinSLA = inspections.filter(i => i.slaStatus === 'Within SLA').length;
  const breached = inspections.filter(i => i.slaStatus === 'SLA Breached').length;
  return { total, withinSLA, breached, compliance: total > 0 ? Math.round((withinSLA / total) * 100) : 0, breachRate: total > 0 ? Math.round((breached / total) * 100) : 0 };
}

function calculatePerformanceMetrics(inspections: Inspection[]) {
  const completed = inspections.filter(i => i.status === 'Completed');
  const withScores = completed.filter(i => i.complianceScore !== null);
  const withDuration = completed.filter(i => i.duration !== null);
  const avgScore = withScores.length > 0 ? Math.round(withScores.reduce((acc, i) => acc + (i.complianceScore || 0), 0) / withScores.length) : 0;
  const avgDuration = withDuration.length > 0 ? Math.round(withDuration.reduce((acc, i) => acc + (i.duration || 0), 0) / withDuration.length) : 0;
  return { completionRate: inspections.length > 0 ? Math.round((completed.length / inspections.length) * 100) : 0, avgScore, avgDuration, failedCount: inspections.filter(i => i.status === 'Failed').length, highPriorityPending: inspections.filter(i => i.priority === 'High' && ['Pending', 'Scheduled'].includes(i.status)).length };
}

function DynamicChart({ data, chartType, height = 200, onItemClick }: { data: any[]; chartType: ChartType; height?: number; onItemClick?: (item: any) => void }) {
  if (!data || data.length === 0) return <div className="flex items-center justify-center h-full text-gray-400">No data</div>;
  switch (chartType) {
    case 'pie': return (<ResponsiveContainer width="100%" height={height}><PieChart><Pie data={data} cx="50%" cy="50%" innerRadius={height > 150 ? 40 : 25} outerRadius={height > 150 ? 70 : 45} paddingAngle={2} dataKey="count" onClick={onItemClick} className={onItemClick ? "cursor-pointer" : ""}>{data.map((entry, index) => (<Cell key={index} fill={entry.color} stroke="white" strokeWidth={2} />))}</Pie><Tooltip formatter={(value: number) => [value, 'Count']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} /></PieChart></ResponsiveContainer>);
    case 'bar': return (<ResponsiveContainer width="100%" height={height}><BarChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="shortName" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} /><Bar dataKey="count" radius={[4, 4, 0, 0]} onClick={onItemClick} className={onItemClick ? "cursor-pointer" : ""}>{data.map((entry, index) => (<Cell key={index} fill={entry.color} />))}</Bar></BarChart></ResponsiveContainer>);
    case 'horizontalBar': return (<ResponsiveContainer width="100%" height={height}><BarChart data={data} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis type="number" tick={{ fontSize: 11 }} /><YAxis type="category" dataKey="shortName" width={80} tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} /><Bar dataKey="count" radius={[0, 4, 4, 0]} onClick={onItemClick} className={onItemClick ? "cursor-pointer" : ""}>{data.map((entry, index) => (<Cell key={index} fill={entry.color} />))}</Bar></BarChart></ResponsiveContainer>);
    case 'line': return (<ResponsiveContainer width="100%" height={height}><LineChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="shortName" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} /><Line type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 4 }} /></LineChart></ResponsiveContainer>);
    case 'area': return (<ResponsiveContainer width="100%" height={height}><AreaChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="shortName" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} /><Area type="monotone" dataKey="count" stroke="#10B981" fill="#10B981" fillOpacity={0.3} /></AreaChart></ResponsiveContainer>);
    case 'radial': return (<ResponsiveContainer width="100%" height={height}><RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="90%" data={data} startAngle={180} endAngle={0}><RadialBar dataKey="count" cornerRadius={4} label={{ fill: '#666', fontSize: 10 }}>{data.map((entry, index) => (<Cell key={index} fill={entry.color} />))}</RadialBar><Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} /></RadialBarChart></ResponsiveContainer>);
    default: return null;
  }
}

function SLAGauge({ value, size = 'normal' }: { value: number; size?: 'small' | 'normal' | 'large' }) {
  const dimensions = size === 'small' ? { w: 80, h: 80, inner: 25, outer: 35 } : size === 'large' ? { w: 160, h: 160, inner: 50, outer: 70 } : { w: 120, h: 120, inner: 35, outer: 50 };
  const gaugeData = [{ name: 'SLA', value, fill: value >= 90 ? '#22C55E' : value >= 70 ? '#F59E0B' : '#EF4444' }];
  return (
    <div className="relative" style={{ width: dimensions.w, height: dimensions.h }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart cx="50%" cy="50%" innerRadius={dimensions.inner} outerRadius={dimensions.outer} data={gaugeData} startAngle={180} endAngle={0}>
          <RadialBar dataKey="value" cornerRadius={8} background={{ fill: '#e5e7eb' }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`font-bold ${size === 'small' ? 'text-lg' : size === 'large' ? 'text-3xl' : 'text-xl'} ${value >= 90 ? 'text-green-600' : value >= 70 ? 'text-amber-600' : 'text-red-600'}`}>{value}%</span>
      </div>
    </div>
  );
}

// Overview Level - SLA & Performance Dashboard
function OverviewLevel() {
  const { filteredInspections, navigateDrillDown, openInspectionModal } = useInspection();
  const [selectedChart, setSelectedChart] = useState<string>('status');
  const [chartType, setChartType] = useState<ChartType>('pie');

  const slaMetrics = useMemo(() => calculateSLAMetrics(filteredInspections), [filteredInspections]);
  const performanceMetrics = useMemo(() => calculatePerformanceMetrics(filteredInspections), [filteredInspections]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredInspections.forEach(i => { counts[i.status] = (counts[i.status] || 0) + 1; });
    return Object.entries(counts).map(([name, count]) => ({ name, shortName: name, count, color: getStatusColor(name) })).sort((a, b) => b.count - a.count);
  }, [filteredInspections]);

  const slaData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredInspections.forEach(i => { counts[i.slaStatus] = (counts[i.slaStatus] || 0) + 1; });
    return Object.entries(counts).map(([name, count]) => ({ name, shortName: name.replace('SLA ', ''), count, color: getSLAColor(name) })).sort((a, b) => b.count - a.count);
  }, [filteredInspections]);

  const priorityData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredInspections.forEach(i => { counts[i.priority] = (counts[i.priority] || 0) + 1; });
    return Object.entries(counts).map(([name, count]) => ({ name, shortName: name, count, color: getPriorityColor(name) })).sort((a, b) => { const order = { High: 0, Medium: 1, Low: 2 }; return (order[a.name as keyof typeof order] || 3) - (order[b.name as keyof typeof order] || 3); });
  }, [filteredInspections]);

  const chartOptions = [
    { id: 'status', label: 'Status', data: statusData },
    { id: 'sla', label: 'SLA', data: slaData },
    { id: 'priority', label: 'Priority', data: priorityData },
  ];
  const currentChartData = chartOptions.find(o => o.id === selectedChart)?.data || [];

  return (
    <div className="space-y-6">
      {/* SLA & Performance Overview */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">SLA & Performance Overview</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{filteredInspections.length} inspections • Real-time metrics</p>
            </div>
          </div>
          <div className="grid grid-cols-12 gap-6">
            {/* SLA Gauge */}
            <div className="col-span-12 md:col-span-3 flex flex-col items-center justify-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">SLA Compliance</p>
              <SLAGauge value={slaMetrics.compliance} size="large" />
              <div className="mt-4 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-500" /><span className="text-gray-600 dark:text-gray-400">Within: {slaMetrics.withinSLA}</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500" /><span className="text-gray-600 dark:text-gray-400">Breached: {slaMetrics.breached}</span></div>
              </div>
            </div>
            {/* Key Metrics */}
            <div className="col-span-12 md:col-span-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-1"><CheckCircle2 className="w-4 h-4 text-green-600" /><span className="text-xs text-green-700 dark:text-green-400">Completion Rate</span></div>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">{performanceMetrics.completionRate}%</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 mb-1"><Target className="w-4 h-4 text-purple-600" /><span className="text-xs text-purple-700 dark:text-purple-400">Avg Score</span></div>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{performanceMetrics.avgScore}%</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-blue-600" /><span className="text-xs text-blue-700 dark:text-blue-400">Avg Duration</span></div>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{performanceMetrics.avgDuration} min</p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-red-600" /><span className="text-xs text-red-700 dark:text-red-400">High Priority Pending</span></div>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">{performanceMetrics.highPriorityPending}</p>
                </div>
              </div>
            </div>
            {/* Status Distribution */}
            <div className="col-span-12 md:col-span-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Status Overview</p>
              <div className="h-[140px]"><DynamicChart data={statusData} chartType="horizontalBar" height={140} /></div>
            </div>
          </div>
        </div>
        {/* Quick Stats Bar */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-slate-900/50 border-t border-gray-200 dark:border-slate-700">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {statusData.map(item => (
              <button key={item.name} onClick={() => navigateDrillDown('status', item.name)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-gray-600 dark:text-gray-400">{item.name}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white ml-auto">{item.count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Chart Section */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">Distribution Analysis</h4>
                <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-slate-700 rounded-lg">
                  {chartOptions.map(opt => (<button key={opt.id} onClick={() => setSelectedChart(opt.id)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${selectedChart === opt.id ? 'bg-white dark:bg-slate-600 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>{opt.label}</button>))}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {CHART_TYPE_OPTIONS.slice(0, 4).map(ct => (<button key={ct.id} onClick={() => setChartType(ct.id)} className={`p-2 rounded-lg transition-all ${chartType === ct.id ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700'}`}>{ct.icon}</button>))}
              </div>
            </div>
            <div className="h-[300px]"><DynamicChart data={currentChartData} chartType={chartType} height={300} onItemClick={(item) => { const typeMap: Record<string, string> = { status: 'status', sla: 'status', priority: 'priority' }; const drillType = typeMap[selectedChart] as any; if (drillType) navigateDrillDown(drillType, item.name); }} /></div>
            <div className="mt-4 flex flex-wrap gap-3">
              {currentChartData.map((item, idx) => (<button key={idx} onClick={() => { const typeMap: Record<string, string> = { status: 'status', sla: 'status', priority: 'priority' }; const drillType = typeMap[selectedChart] as any; if (drillType) navigateDrillDown(drillType, item.name); }} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} /><span className="text-xs text-gray-700 dark:text-gray-300">{item.shortName}</span><span className="text-xs font-semibold text-gray-900 dark:text-white">{item.count}</span></button>))}
            </div>
          </div>
        </div>
        {/* Drill-Down Options */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 h-full">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Analyze By</h4>
            <div className="space-y-2">
              {drillDownOptions.map((option) => (
                <button key={option.id} onClick={() => navigateDrillDown(option.type, `_group_${option.type}`)} className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all group text-left">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">{option.icon}</div>
                  <div className="flex-1 min-w-0"><p className="font-medium text-gray-900 dark:text-white text-sm">{option.label}</p><p className="text-xs text-gray-500 dark:text-gray-400">{option.description}</p></div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to get field value from inspection
const getInspectionFieldValue = (inspection: Inspection, fieldType: string): string => {
  switch (fieldType) {
    case 'inspectionType': return inspection.inspectionType;
    case 'status': return inspection.status;
    case 'inspector': return inspection.inspector;
    case 'zone': return inspection.zone;
    case 'priority': return inspection.priority;
    case 'category': return inspection.category;
    default: return '';
  }
};

// Type for nested group data
interface NestedGroupData {
  name: string;
  shortName: string;
  count: number;
  items: Inspection[];
  percentage: number;
  color: string;
  slaCompliance: number;
  avgScore: number;
  completionRate: number;
  children?: NestedGroupData[];
  level: number;
  path: string[];
}

// Recursive Tree Node Component for Multi-Level Grouping
interface NestedTreeNodeProps {
  group: NestedGroupData;
  expandedGroups: Set<string>;
  toggleGroup: (name: string) => void;
  typeLabels: Record<string, string>;
  groupByLevels: NonNullable<InspectionDrillDownState['groupByLevels']>;
  navigateDrillDown: (type: InspectionDrillDownState['type'], value: string) => void;
  openInspectionModal: (inspection: Inspection) => void;
}

function NestedTreeNode({ group, expandedGroups, toggleGroup, typeLabels, groupByLevels, navigateDrillDown, openInspectionModal }: NestedTreeNodeProps) {
  const pathKey = group.path.join('/');
  const isExpanded = expandedGroups.has(pathKey);
  const hasChildren = group.children && group.children.length > 0;
  const currentLevelType = groupByLevels[group.level];
  const isLastLevel = group.level === groupByLevels.length - 1;
  
  // Indentation based on level
  const paddingLeft = group.level * 24;
  
  // Different background shades for different levels
  const levelBgColors = [
    'bg-white dark:bg-slate-800',
    'bg-gray-50 dark:bg-slate-800/80',
    'bg-gray-100/50 dark:bg-slate-800/60',
    'bg-gray-100 dark:bg-slate-800/40',
  ];
  const bgColor = levelBgColors[Math.min(group.level, levelBgColors.length - 1)];

  return (
    <div className={`border border-gray-100 dark:border-slate-700 rounded-xl overflow-hidden ${bgColor}`}>
      <button 
        onClick={() => toggleGroup(pathKey)} 
        className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
        style={{ paddingLeft: `${paddingLeft + 16}px` }}
      >
        {/* Level indicator */}
        <span className="w-5 h-5 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex-shrink-0">
          {group.level + 1}
        </span>
        
        {/* Expand/collapse icon */}
        {(hasChildren || !isLastLevel) ? (
          isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronUp className="w-5 h-5 text-gray-400 rotate-180" />
        ) : (
          <div className="w-5" />
        )}
        
        <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: group.color }} />
        
        <div className="flex-1 text-left">
          <span className="font-medium text-gray-900 dark:text-white">{group.name}</span>
          <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">({typeLabels[currentLevelType]})</span>
        </div>
        
        <span className="text-sm text-gray-500 dark:text-gray-400">{group.count} inspections</span>
        
        <div className="flex items-center gap-2 ml-4">
          <div className="w-20 h-2 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full" 
              style={{ 
                width: `${group.slaCompliance}%`, 
                backgroundColor: getSLAColor(group.slaCompliance >= 80 ? 'Within SLA' : 'SLA Breached') 
              }} 
            />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 w-10">{group.slaCompliance}%</span>
        </div>
        
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            navigateDrillDown(currentLevelType, group.name); 
          }} 
          className="p-2 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-gray-400 hover:text-emerald-600"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </button>
      
      {/* Expanded content */}
      {isExpanded && (
        <div className="pb-2" style={{ paddingLeft: `${paddingLeft + 16}px` }}>
          {/* Render child groups if available */}
          {hasChildren && (
            <div className="space-y-2 pt-2">
              {group.children!.map((child) => (
                <NestedTreeNode
                  key={child.path.join('/')}
                  group={child}
                  expandedGroups={expandedGroups}
                  toggleGroup={toggleGroup}
                  typeLabels={typeLabels}
                  groupByLevels={groupByLevels}
                  navigateDrillDown={navigateDrillDown}
                  openInspectionModal={openInspectionModal}
                />
              ))}
            </div>
          )}
          
          {/* Show items at last level */}
          {isLastLevel && (
            <div className="pr-4 pt-2">
              <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-700">
                      <th className="text-left p-3 font-medium text-gray-500 dark:text-gray-400">ID</th>
                      <th className="text-left p-3 font-medium text-gray-500 dark:text-gray-400">Type</th>
                      <th className="text-left p-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                      <th className="text-left p-3 font-medium text-gray-500 dark:text-gray-400">SLA</th>
                      <th className="text-left p-3 font-medium text-gray-500 dark:text-gray-400">Inspector</th>
                      <th className="text-right p-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.slice(0, 5).map(item => (
                      <tr key={item.id} className="border-b border-gray-100 dark:border-slate-800 last:border-0">
                        <td className="p-3 font-mono text-gray-900 dark:text-white">{item.id}</td>
                        <td className="p-3 text-gray-600 dark:text-gray-400">{item.inspectionType}</td>
                        <td className="p-3">
                          <span 
                            className="px-2 py-1 rounded-full text-xs font-medium" 
                            style={{ backgroundColor: `${getStatusColor(item.status)}20`, color: getStatusColor(item.status) }}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.slaStatus === 'Within SLA' 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                              : item.slaStatus === 'SLA Breached' 
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                                : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400'
                          }`}>
                            {item.slaStatus}
                          </span>
                        </td>
                        <td className="p-3 text-gray-600 dark:text-gray-400">{item.inspector}</td>
                        <td className="p-3 text-right">
                          <button 
                            onClick={() => openInspectionModal(item)} 
                            className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 text-xs font-medium"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {group.items.length > 5 && (
                  <p className="text-center text-xs text-gray-500 dark:text-gray-400 py-2">
                    +{group.items.length - 5} more
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// STUNNING VISUALIZATIONS FOR INSPECTIONS
// ============================================

// Sunburst Chart for Inspections
interface InspectionSunburstViewProps {
  data: NestedGroupData[];
  groupByLevels: string[];
  typeLabels: Record<string, string>;
  onSegmentClick?: (group: NestedGroupData) => void;
}

function InspectionSunburstView({ data, groupByLevels, typeLabels, onSegmentClick }: InspectionSunburstViewProps) {
  const [hoveredSegment, setHoveredSegment] = useState<NestedGroupData | null>(null);
  
  const flattenData = useCallback((nodes: NestedGroupData[], parentStartAngle = 0, parentEndAngle = 360, level = 0): Array<{
    group: NestedGroupData;
    startAngle: number;
    endAngle: number;
    level: number;
    innerRadius: number;
    outerRadius: number;
  }> => {
    const segments: Array<{
      group: NestedGroupData;
      startAngle: number;
      endAngle: number;
      level: number;
      innerRadius: number;
      outerRadius: number;
    }> = [];
    
    const totalCount = nodes.reduce((sum, n) => sum + n.count, 0);
    let currentAngle = parentStartAngle;
    const angleRange = parentEndAngle - parentStartAngle;
    const baseRadius = 60;
    const ringWidth = 50;
    
    nodes.forEach(node => {
      const proportion = totalCount > 0 ? node.count / totalCount : 0;
      const nodeAngle = proportion * angleRange;
      const endAngle = currentAngle + nodeAngle;
      
      segments.push({
        group: node,
        startAngle: currentAngle,
        endAngle: endAngle,
        level,
        innerRadius: baseRadius + level * ringWidth,
        outerRadius: baseRadius + (level + 1) * ringWidth - 4
      });
      
      if (node.children && node.children.length > 0) {
        segments.push(...flattenData(node.children, currentAngle, endAngle, level + 1));
      }
      currentAngle = endAngle;
    });
    return segments;
  }, []);
  
  const segments = useMemo(() => flattenData(data), [data, flattenData]);
  
  const describeArc = (cx: number, cy: number, innerR: number, outerR: number, startAngle: number, endAngle: number) => {
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;
    const x1 = cx + innerR * Math.cos(startRad);
    const y1 = cy + innerR * Math.sin(startRad);
    const x2 = cx + outerR * Math.cos(startRad);
    const y2 = cy + outerR * Math.sin(startRad);
    const x3 = cx + outerR * Math.cos(endRad);
    const y3 = cy + outerR * Math.sin(endRad);
    const x4 = cx + innerR * Math.cos(endRad);
    const y4 = cy + innerR * Math.sin(endRad);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} L ${x2} ${y2} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x3} ${y3} L ${x4} ${y4} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x1} ${y1} Z`;
  };
  
  const cx = 200, cy = 200;
  const levelGradients = ['from-emerald-500 to-teal-600', 'from-blue-500 to-cyan-600', 'from-purple-500 to-pink-600', 'from-orange-500 to-amber-600'];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
          <Target className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sunburst Hierarchy</h3>
          <p className="text-xs text-gray-500">{groupByLevels.map(l => typeLabels[l]).join(' → ')}</p>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 flex justify-center">
          <svg width="400" height="400" viewBox="0 0 400 400">
            {groupByLevels.map((_, idx) => (
              <circle key={idx} cx={cx} cy={cy} r={60 + (idx + 1) * 50} fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-100 dark:text-slate-700" />
            ))}
            {segments.map((seg, idx) => {
              const isHovered = hoveredSegment?.path.join('/') === seg.group.path.join('/');
              return (
                <g key={idx}>
                  <path
                    d={describeArc(cx, cy, seg.innerRadius, seg.outerRadius, seg.startAngle, seg.endAngle)}
                    fill={seg.group.color}
                    stroke="white"
                    strokeWidth="2"
                    className={`cursor-pointer transition-all duration-300 ${isHovered ? 'opacity-100 drop-shadow-lg' : 'opacity-75 hover:opacity-100'}`}
                    style={{ transform: isHovered ? `scale(1.02)` : 'scale(1)', transformOrigin: `${cx}px ${cy}px`, filter: isHovered ? 'brightness(1.1)' : 'none' }}
                    onMouseEnter={() => setHoveredSegment(seg.group)}
                    onMouseLeave={() => setHoveredSegment(null)}
                    onClick={() => onSegmentClick?.(seg.group)}
                  />
                  {seg.endAngle - seg.startAngle > 20 && seg.level === 0 && (
                    <text
                      x={cx + (seg.innerRadius + (seg.outerRadius - seg.innerRadius) / 2) * Math.cos(((seg.startAngle + seg.endAngle) / 2 - 90) * Math.PI / 180)}
                      y={cy + (seg.innerRadius + (seg.outerRadius - seg.innerRadius) / 2) * Math.sin(((seg.startAngle + seg.endAngle) / 2 - 90) * Math.PI / 180)}
                      textAnchor="middle" dominantBaseline="middle" className="text-xs font-medium fill-white pointer-events-none"
                      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                    >{seg.group.shortName?.substring(0, 8)}</text>
                  )}
                </g>
              );
            })}
            <circle cx={cx} cy={cy} r="55" className="fill-gray-50 dark:fill-slate-900" />
            <text x={cx} y={cy - 10} textAnchor="middle" className="text-2xl font-bold fill-gray-900 dark:fill-white">{data.reduce((sum, d) => sum + d.count, 0)}</text>
            <text x={cx} y={cy + 12} textAnchor="middle" className="text-xs fill-gray-500">Inspections</text>
          </svg>
        </div>
        
        <div className="w-full lg:w-72 space-y-4">
          {groupByLevels.map((level, idx) => (
            <div key={level} className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${levelGradients[idx % levelGradients.length]}`} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ring {idx + 1}: {typeLabels[level]}</span>
            </div>
          ))}
          
          {hoveredSegment && (
            <div className="mt-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-800 rounded-xl border border-gray-200 dark:border-slate-600">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: hoveredSegment.color }} />
                <span className="font-semibold text-gray-900 dark:text-white">{hoveredSegment.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Count</span><p className="font-bold text-gray-900 dark:text-white">{hoveredSegment.count}</p></div>
                <div><span className="text-gray-500">Share</span><p className="font-bold text-gray-900 dark:text-white">{hoveredSegment.percentage}%</p></div>
                <div><span className="text-gray-500">SLA Rate</span><p className={`font-bold ${hoveredSegment.slaCompliance >= 80 ? 'text-green-500' : hoveredSegment.slaCompliance >= 50 ? 'text-amber-500' : 'text-red-500'}`}>{hoveredSegment.slaCompliance}%</p></div>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Top Groups</h4>
            {data.slice(0, 5).map((group, idx) => (
              <div key={group.path.join('/')} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-colors" onMouseEnter={() => setHoveredSegment(group)} onMouseLeave={() => setHoveredSegment(null)}>
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: group.color }}>{idx + 1}</span>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-900 dark:text-white truncate">{group.name}</p><p className="text-xs text-gray-500">{group.count} inspections</p></div>
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{group.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Flow View for Inspections
interface InspectionFlowViewProps {
  data: NestedGroupData[];
  groupByLevels: string[];
  typeLabels: Record<string, string>;
  onItemClick?: (group: NestedGroupData) => void;
}

function InspectionFlowView({ data, groupByLevels, typeLabels, onItemClick }: InspectionFlowViewProps) {
  const [expandedFlows, setExpandedFlows] = useState<Set<string>>(new Set());
  
  const levelData = useMemo(() => {
    const levels: NestedGroupData[][] = [];
    const collectByLevel = (nodes: NestedGroupData[], level: number) => {
      if (!levels[level]) levels[level] = [];
      nodes.forEach(node => {
        levels[level].push(node);
        if (node.children && node.children.length > 0) collectByLevel(node.children, level + 1);
      });
    };
    collectByLevel(data, 0);
    return levels;
  }, [data]);
  
  const totalInspections = data.reduce((sum, d) => sum + d.count, 0);
  const flowColors = ['from-emerald-500 via-emerald-400 to-teal-400', 'from-blue-500 via-blue-400 to-cyan-400', 'from-purple-500 via-purple-400 to-pink-400', 'from-orange-500 via-orange-400 to-amber-400'];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 overflow-x-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl"><Activity className="w-5 h-5 text-white" /></div>
        <div><h3 className="text-lg font-semibold text-gray-900 dark:text-white">Data Flow</h3><p className="text-xs text-gray-500">Visualizing {totalInspections} inspections across {groupByLevels.length} levels</p></div>
      </div>
      
      <div className="relative min-w-[600px]">
        <div className="flex items-stretch mb-6" style={{ gap: '2rem' }}>
          {groupByLevels.map((level, idx) => (
            <div key={level} className="flex-1 min-w-[200px]">
              <div className={`text-center p-3 rounded-xl bg-gradient-to-r ${flowColors[idx % flowColors.length]} text-white shadow-lg`}>
                <div className="text-xs opacity-80 uppercase tracking-wider">Level {idx + 1}</div>
                <div className="font-bold">{typeLabels[level]}</div>
                {levelData[idx] && <div className="text-xs opacity-80 mt-1">{levelData[idx].length} groups</div>}
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex items-start relative" style={{ gap: '2rem', zIndex: 1 }}>
          {groupByLevels.map((level, levelIdx) => (
            <div key={level} className="flex-1 min-w-[200px] space-y-3">
              {levelData[levelIdx]?.sort((a, b) => b.count - a.count).slice(0, 8).map((group, groupIdx) => {
                const isExpanded = expandedFlows.has(group.path.join('/'));
                const hasChildren = group.children && group.children.length > 0;
                return (
                  <div key={group.path.join('/')} className="relative group animate-in slide-in-from-left duration-500" style={{ animationDelay: `${(levelIdx * 100) + (groupIdx * 50)}ms` }}>
                    <div 
                      className={`relative p-4 rounded-xl bg-white dark:bg-slate-700 border-2 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${isExpanded ? 'border-emerald-500 shadow-lg shadow-emerald-500/20' : 'border-gray-200 dark:border-slate-600'}`}
                      onClick={() => {
                        if (hasChildren) setExpandedFlows(prev => { const next = new Set(prev); next.has(group.path.join('/')) ? next.delete(group.path.join('/')) : next.add(group.path.join('/')); return next; });
                        onItemClick?.(group);
                      }}
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ backgroundColor: group.color }} />
                      <div className="flex items-start justify-between gap-3 pl-2">
                        <div className="flex-1 min-w-0"><p className="font-semibold text-gray-900 dark:text-white truncate">{group.shortName}</p><p className="text-xs text-gray-500 mt-1">{group.count} inspections</p></div>
                        <div className="relative w-12 h-12 flex-shrink-0">
                          <svg className="w-full h-full transform -rotate-90"><circle cx="24" cy="24" r="20" className="fill-none stroke-gray-200 dark:stroke-slate-600" strokeWidth="4" /><circle cx="24" cy="24" r="20" className="fill-none" stroke={group.color} strokeWidth="4" strokeDasharray={`${(group.percentage / 100) * 125.6} 125.6`} strokeLinecap="round" /></svg>
                          <div className="absolute inset-0 flex items-center justify-center"><span className="text-xs font-bold text-gray-900 dark:text-white">{group.percentage}%</span></div>
                        </div>
                      </div>
                      <div className="mt-3 pl-2">
                        <div className="flex items-center justify-between text-xs mb-1"><span className="text-gray-500">SLA Compliance</span><span className={`font-medium ${group.slaCompliance >= 80 ? 'text-green-500' : group.slaCompliance >= 50 ? 'text-amber-500' : 'text-red-500'}`}>{group.slaCompliance}%</span></div>
                        <div className="h-1.5 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${group.slaCompliance}%`, backgroundColor: group.slaCompliance >= 80 ? '#22C55E' : group.slaCompliance >= 50 ? '#F59E0B' : '#EF4444' }} /></div>
                      </div>
                      {hasChildren && levelIdx < groupByLevels.length - 1 && (
                        <div className="absolute -right-4 top-1/2 -translate-y-1/2 z-10"><div className={`w-8 h-8 rounded-full bg-gradient-to-r ${flowColors[levelIdx % flowColors.length]} flex items-center justify-center shadow-lg transition-transform ${isExpanded ? 'scale-110' : 'group-hover:scale-110'}`}><ArrowRight className="w-4 h-4 text-white" /></div></div>
                      )}
                    </div>
                  </div>
                );
              })}
              {levelData[levelIdx]?.length > 8 && <div className="text-center text-xs text-gray-500 py-2">+{levelData[levelIdx].length - 8} more</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Bubbles View for Inspections
interface InspectionBubblesViewProps {
  data: NestedGroupData[];
  groupByLevels: string[];
  typeLabels: Record<string, string>;
  onBubbleClick?: (group: NestedGroupData) => void;
}

function InspectionBubblesView({ data, groupByLevels, typeLabels, onBubbleClick }: InspectionBubblesViewProps) {
  const [hoveredBubble, setHoveredBubble] = useState<NestedGroupData | null>(null);
  const [zoomedGroup, setZoomedGroup] = useState<NestedGroupData | null>(null);
  const containerSize = 500;
  
  const calculateLayout = useCallback((nodes: NestedGroupData[], containerRadius: number, centerX: number, centerY: number) => {
    const totalCount = nodes.reduce((sum, n) => sum + n.count, 0);
    const sortedNodes = [...nodes].sort((a, b) => b.count - a.count);
    let angle = 0;
    const angleStep = (2 * Math.PI) / Math.max(nodes.length, 1);
    const spiralGrowth = containerRadius / (nodes.length + 1);
    
    return sortedNodes.map((node, idx) => {
      const proportion = totalCount > 0 ? node.count / totalCount : 1 / nodes.length;
      const radius = Math.max(20, Math.sqrt(proportion) * containerRadius * 0.6);
      const spiralRadius = (idx + 1) * spiralGrowth * 0.8;
      return { group: node, x: centerX + spiralRadius * Math.cos(angle + idx * angleStep), y: centerY + spiralRadius * Math.sin(angle + idx * angleStep), r: radius };
    });
  }, []);
  
  const displayData = zoomedGroup?.children || data;
  const bubbles = useMemo(() => calculateLayout(displayData, containerSize / 2 - 20, containerSize / 2, containerSize / 2), [displayData, calculateLayout]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl"><Layers className="w-5 h-5 text-white" /></div>
          <div><h3 className="text-lg font-semibold text-gray-900 dark:text-white">Bubble Hierarchy {zoomedGroup && `• ${zoomedGroup.name}`}</h3><p className="text-xs text-gray-500">{zoomedGroup ? `Level ${zoomedGroup.level + 2}` : `Level 1: ${typeLabels[groupByLevels[0]]}`}</p></div>
        </div>
        {zoomedGroup && <button onClick={() => setZoomedGroup(null)} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"><ChevronLeft className="w-4 h-4" />Back</button>}
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 flex justify-center">
          <div className="relative rounded-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-800" style={{ width: containerSize, height: containerSize }}>
            <div className="absolute inset-8 rounded-full border-2 border-dashed border-gray-200 dark:border-slate-600 opacity-50" />
            <div className="absolute inset-16 rounded-full border-2 border-dashed border-gray-200 dark:border-slate-600 opacity-30" />
            {bubbles.map((bubble, idx) => {
              const isHovered = hoveredBubble?.path.join('/') === bubble.group.path.join('/');
              const hasChildren = bubble.group.children && bubble.group.children.length > 0;
              return (
                <div
                  key={bubble.group.path.join('/')}
                  className={`absolute rounded-full cursor-pointer transition-all duration-300 flex items-center justify-center overflow-hidden animate-in zoom-in ${isHovered ? 'z-20 scale-110' : 'z-10'}`}
                  style={{ left: bubble.x - bubble.r, top: bubble.y - bubble.r, width: bubble.r * 2, height: bubble.r * 2, animationDelay: `${idx * 50}ms`, boxShadow: isHovered ? `0 0 0 3px white, 0 0 0 5px ${bubble.group.color}, 0 20px 50px -10px ${bubble.group.color}60` : `0 4px 20px -5px ${bubble.group.color}40` }}
                  onMouseEnter={() => setHoveredBubble(bubble.group)}
                  onMouseLeave={() => setHoveredBubble(null)}
                  onClick={() => { if (hasChildren) setZoomedGroup(bubble.group); onBubbleClick?.(bubble.group); }}
                >
                  <div className="absolute inset-0 rounded-full" style={{ background: `linear-gradient(135deg, ${bubble.group.color} 0%, ${bubble.group.color}dd 100%)` }} />
                  <svg className="absolute inset-0 w-full h-full -rotate-90"><circle cx={bubble.r} cy={bubble.r} r={bubble.r - 3} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" /><circle cx={bubble.r} cy={bubble.r} r={bubble.r - 3} fill="none" stroke={bubble.group.slaCompliance >= 80 ? '#22C55E' : bubble.group.slaCompliance >= 50 ? '#F59E0B' : '#EF4444'} strokeWidth="4" strokeDasharray={`${(bubble.group.slaCompliance / 100) * (2 * Math.PI * (bubble.r - 3))} ${2 * Math.PI * (bubble.r - 3)}`} strokeLinecap="round" /></svg>
                  <div className="relative z-10 text-center text-white p-2">
                    {bubble.r > 35 && <p className="font-bold text-xs truncate max-w-full" style={{ maxWidth: bubble.r * 1.4 }}>{bubble.group.shortName}</p>}
                    <p className="font-bold text-sm">{bubble.group.count}</p>
                    {bubble.r > 45 && <p className="text-xs opacity-80">{bubble.group.percentage}%</p>}
                  </div>
                  {hasChildren && <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}><Maximize2 className="w-3 h-3 text-white" /></div>}
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="w-full lg:w-64 space-y-4">
          {hoveredBubble && (
            <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-800 rounded-xl border border-gray-200 dark:border-slate-600">
              <div className="flex items-center gap-2 mb-3"><div className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: hoveredBubble.color }} /><span className="font-bold text-gray-900 dark:text-white">{hoveredBubble.name}</span></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-2 text-center"><p className="text-lg font-bold text-gray-900 dark:text-white">{hoveredBubble.count}</p><p className="text-xs text-gray-500">Inspections</p></div>
                <div className="bg-white dark:bg-slate-800 rounded-lg p-2 text-center"><p className={`text-lg font-bold ${hoveredBubble.slaCompliance >= 80 ? 'text-green-500' : hoveredBubble.slaCompliance >= 50 ? 'text-amber-500' : 'text-red-500'}`}>{hoveredBubble.slaCompliance}%</p><p className="text-xs text-gray-500">SLA</p></div>
              </div>
              {hoveredBubble.children && hoveredBubble.children.length > 0 && <p className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 text-center">Click to explore {hoveredBubble.children.length} sub-groups →</p>}
            </div>
          )}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Groups</h4>
            {displayData.slice(0, 6).map(group => (
              <div key={group.path.join('/')} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-colors" onMouseEnter={() => setHoveredBubble(group)} onMouseLeave={() => setHoveredBubble(null)}>
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: group.color }} />
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">{group.shortName}</span>
                <span className="text-xs font-medium text-gray-500">{group.count}</span>
              </div>
            ))}
            {displayData.length > 6 && <p className="text-xs text-gray-400 text-center">+{displayData.length - 6} more</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// Matrix View for Inspections
interface InspectionMatrixViewProps {
  data: NestedGroupData[];
  groupByLevels: string[];
  typeLabels: Record<string, string>;
  inspections: Inspection[];
  onCellClick?: (rowGroup: NestedGroupData, colValue: string) => void;
}

function InspectionMatrixView({ data, groupByLevels, typeLabels, inspections, onCellClick }: InspectionMatrixViewProps) {
  const [hoveredCell, setHoveredCell] = useState<{row: string, col: string, count: number} | null>(null);
  const rowDimension = groupByLevels[0];
  const colDimension = groupByLevels[1] || 'status';
  
  const colValues = useMemo(() => {
    const values = new Set<string>();
    inspections.forEach(i => { const val = getInspectionFieldValue(i, colDimension as any); if (val) values.add(val); });
    return Array.from(values).sort();
  }, [inspections, colDimension]);
  
  const matrixData = useMemo(() => {
    return data.map(rowGroup => {
      const cells: Record<string, { count: number; slaRate: number }> = {};
      colValues.forEach(colVal => {
        const matchingItems = rowGroup.items.filter(i => getInspectionFieldValue(i, colDimension as any) === colVal);
        const count = matchingItems.length;
        const withinSLA = matchingItems.filter(i => i.slaStatus === 'Within SLA').length;
        cells[colVal] = { count, slaRate: count > 0 ? Math.round((withinSLA / count) * 100) : 100 };
      });
      return { row: rowGroup, cells };
    });
  }, [data, colValues, colDimension]);
  
  const maxCount = useMemo(() => Math.max(...matrixData.flatMap(row => Object.values(row.cells).map(c => c.count))), [matrixData]);
  const getHeatColor = (count: number, slaRate: number) => {
    const intensity = maxCount > 0 ? count / maxCount : 0;
    if (slaRate >= 80) return `rgba(34, 197, 94, ${0.2 + intensity * 0.6})`;
    if (slaRate >= 50) return `rgba(251, 191, 36, ${0.2 + intensity * 0.6})`;
    return `rgba(239, 68, 68, ${0.2 + intensity * 0.6})`;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl"><Grid3X3 className="w-5 h-5 text-white" /></div>
          <div><h3 className="text-lg font-semibold text-gray-900 dark:text-white">Matrix Heatmap</h3><p className="text-xs text-gray-500">{typeLabels[rowDimension]} × {typeLabels[colDimension]}</p></div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(34, 197, 94, 0.6)' }} /><span className="text-gray-500">Good SLA</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(251, 191, 36, 0.6)' }} /><span className="text-gray-500">Warning</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.6)' }} /><span className="text-gray-500">Critical</span></div>
        </div>
      </div>
      
      {hoveredCell && (
        <div className="mb-4 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center gap-4">
            <div><span className="text-xs text-gray-500">{typeLabels[rowDimension]}:</span><span className="ml-1 font-semibold text-gray-900 dark:text-white">{hoveredCell.row}</span></div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <div><span className="text-xs text-gray-500">{typeLabels[colDimension]}:</span><span className="ml-1 font-semibold text-gray-900 dark:text-white">{hoveredCell.col}</span></div>
            <div className="ml-auto flex items-center gap-2"><span className="text-2xl font-bold text-gray-900 dark:text-white">{hoveredCell.count}</span><span className="text-gray-500">inspections</span></div>
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b-2 border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 sticky left-0 z-10">{typeLabels[rowDimension]}</th>
              {colValues.map(col => (<th key={col} className="p-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 border-b-2 border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 min-w-[100px]"><div className="truncate max-w-[100px]">{col}</div></th>))}
              <th className="p-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider border-b-2 border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50">Total</th>
            </tr>
          </thead>
          <tbody>
            {matrixData.map(row => (
              <tr key={row.row.path.join('/')} className="group">
                <td className="p-3 border-b border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 sticky left-0 z-10">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: row.row.color }} /><span className="font-medium text-gray-900 dark:text-white truncate max-w-[150px]">{row.row.shortName}</span></div>
                </td>
                {colValues.map(col => {
                  const cell = row.cells[col];
                  const isHovered = hoveredCell?.row === row.row.name && hoveredCell?.col === col;
                  return (
                    <td key={col} className={`p-2 border-b border-gray-100 dark:border-slate-700 text-center cursor-pointer transition-all duration-200 ${isHovered ? 'ring-2 ring-emerald-500 ring-inset' : ''}`} style={{ backgroundColor: cell.count > 0 ? getHeatColor(cell.count, cell.slaRate) : 'transparent' }} onMouseEnter={() => setHoveredCell({ row: row.row.name, col, count: cell.count })} onMouseLeave={() => setHoveredCell(null)} onClick={() => onCellClick?.(row.row, col)}>
                      {cell.count > 0 && <div className="animate-in zoom-in duration-200"><span className="text-lg font-bold text-gray-900 dark:text-white">{cell.count}</span><div className="text-xs text-gray-500 mt-0.5">{cell.slaRate}% SLA</div></div>}
                      {cell.count === 0 && <span className="text-gray-300 dark:text-slate-600">—</span>}
                    </td>
                  );
                })}
                <td className="p-3 border-b border-gray-100 dark:border-slate-700 text-center bg-gray-50 dark:bg-slate-900/50"><span className="font-bold text-gray-900 dark:text-white">{row.row.count}</span></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 dark:bg-slate-900/50">
              <td className="p-3 font-semibold text-gray-700 dark:text-gray-300 sticky left-0 bg-gray-50 dark:bg-slate-900/50">Total</td>
              {colValues.map(col => (<td key={col} className="p-3 text-center font-bold text-gray-900 dark:text-white">{matrixData.reduce((sum, row) => sum + row.cells[col].count, 0)}</td>))}
              <td className="p-3 text-center font-bold text-gray-900 dark:text-white bg-emerald-50 dark:bg-emerald-900/20">{inspections.length}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// Multi-Level Group View - Tree, Treemap, Cards, List, Data views
function MultiLevelGroupView() {
  const { drillDown, navigateDrillDown, getFilteredByDrillDown, openInspectionModal } = useInspection();
  const [viewStyle, setViewStyle] = useState<GroupViewStyle>('sunburst');
  const [chartType, setChartType] = useState<ChartType>('pie');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'count' | 'name' | 'sla'>('count');
  const [page, setPage] = useState(0);
  const pageSize = 10;
  
  const currentType = drillDown.type;
  const groupByLevels = drillDown.groupByLevels || [];
  const isMultiLevel = groupByLevels.length > 1;
  const inspections = getFilteredByDrillDown();

  // Build nested group data for multi-level grouping
  const buildNestedGroups = useCallback((
    data: Inspection[],
    levels: typeof groupByLevels,
    currentLevel: number = 0,
    path: string[] = [],
    totalCount: number = data.length
  ): NestedGroupData[] => {
    if (currentLevel >= levels.length || data.length === 0) return [];
    
    const levelType = levels[currentLevel];
    const groups: Record<string, Inspection[]> = {};
    
    data.forEach(i => {
      const val = getInspectionFieldValue(i, levelType);
      if (!groups[val]) groups[val] = [];
      groups[val].push(i);
    });

    return Object.entries(groups).map(([name, items], index) => {
      const slaMetrics = calculateSLAMetrics(items);
      const performanceMetrics = calculatePerformanceMetrics(items);
      const newPath = [...path, name];
      
      return {
        name,
        shortName: name.length > 15 ? name.substring(0, 15) + '...' : name,
        count: items.length,
        items,
        percentage: Math.round((items.length / totalCount) * 100),
        color: levelType === 'status' ? getStatusColor(name) : levelType === 'priority' ? getPriorityColor(name) : INSPECTION_COLORS.category[index % INSPECTION_COLORS.category.length],
        slaCompliance: slaMetrics.compliance,
        avgScore: performanceMetrics.avgScore,
        completionRate: performanceMetrics.completionRate,
        children: currentLevel < levels.length - 1 
          ? buildNestedGroups(items, levels, currentLevel + 1, newPath, totalCount)
          : undefined,
        level: currentLevel,
        path: newPath,
      };
    }).sort((a, b) => {
      if (sortBy === 'count') return b.count - a.count;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return b.slaCompliance - a.slaCompliance;
    });
  }, [sortBy]);

  // Standard single-level grouping
  const groupData = useMemo(() => {
    const getFieldValue = (inspection: Inspection) => {
      switch (currentType) {
        case 'inspectionType': return inspection.inspectionType;
        case 'status': return inspection.status;
        case 'inspector': return inspection.inspector;
        case 'zone': return inspection.zone;
        case 'priority': return inspection.priority;
        case 'category': return inspection.category;
        default: return '';
      }
    };

    const groups: Record<string, Inspection[]> = {};
    inspections.forEach(i => {
      const val = getFieldValue(i);
      if (!groups[val]) groups[val] = [];
      groups[val].push(i);
    });

    return Object.entries(groups).map(([name, items], index) => {
      const slaMetrics = calculateSLAMetrics(items);
      const performanceMetrics = calculatePerformanceMetrics(items);
      return {
        name,
        shortName: name.length > 15 ? name.substring(0, 15) + '...' : name,
        count: items.length,
        items,
        percentage: Math.round((items.length / inspections.length) * 100),
        color: currentType === 'status' ? getStatusColor(name) : currentType === 'priority' ? getPriorityColor(name) : INSPECTION_COLORS.category[index % INSPECTION_COLORS.category.length],
        slaCompliance: slaMetrics.compliance,
        avgScore: performanceMetrics.avgScore,
        completionRate: performanceMetrics.completionRate,
      };
    }).sort((a, b) => {
      if (sortBy === 'count') return b.count - a.count;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return b.slaCompliance - a.slaCompliance;
    });
  }, [inspections, currentType, sortBy]);

  // Multi-level grouped data
  const nestedGroupData = useMemo(() => {
    if (!isMultiLevel) return [];
    return buildNestedGroups(inspections, groupByLevels);
  }, [inspections, groupByLevels, isMultiLevel, buildNestedGroups]);

  const toggleGroup = (name: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(name)) newSet.delete(name); else newSet.add(name);
      return newSet;
    });
  };

  const typeLabels: Record<string, string> = { inspectionType: 'Inspection Type', status: 'Status', inspector: 'Inspector', zone: 'Zone', priority: 'Priority', category: 'Category' };

  const viewStyleOptions: { id: GroupViewStyle; label: string; icon: React.ReactNode; gradient?: string }[] = [
    { id: 'sunburst', label: 'Sunburst', icon: <Target className="w-4 h-4" />, gradient: 'from-violet-500 to-purple-600' },
    { id: 'flow', label: 'Flow', icon: <TrendingUp className="w-4 h-4" />, gradient: 'from-cyan-500 to-blue-600' },
    { id: 'bubbles', label: 'Bubbles', icon: <Layers className="w-4 h-4" />, gradient: 'from-pink-500 to-rose-600' },
    { id: 'matrix', label: 'Matrix', icon: <LayoutGrid className="w-4 h-4" />, gradient: 'from-amber-500 to-orange-600' },
    { id: 'tree', label: 'Tree', icon: <Columns3 className="w-4 h-4" /> },
    { id: 'treemap', label: 'Treemap', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'cards', label: 'Cards', icon: <Grid3X3 className="w-4 h-4" /> },
    { id: 'list', label: 'List', icon: <List className="w-4 h-4" /> },
    { id: 'data', label: 'Data', icon: <Table2 className="w-4 h-4" /> },
  ];

  // Treemap layout calculation
  const treemapData = useMemo(() => {
    const total = groupData.reduce((sum, g) => sum + g.count, 0);
    let x = 0;
    return groupData.map(g => {
      const width = Math.max((g.count / total) * 100, 5);
      const result = { ...g, x, width };
      x += width;
      return result;
    });
  }, [groupData]);

  return (
    <div className="space-y-6">
      {/* Summary Bar */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <p className="text-emerald-800 dark:text-emerald-200">
              <span className="font-semibold">{inspections.length}</span> inspections in{' '}
              <span className="font-semibold">
                {isMultiLevel ? nestedGroupData.length : groupData.length}
              </span> groups
              {isMultiLevel && (
                <span className="ml-2 text-emerald-600 dark:text-emerald-400">
                  ({groupByLevels.length} levels)
                </span>
              )}
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-emerald-600 dark:text-emerald-400">Avg SLA:</span>
              <span className="font-semibold text-emerald-800 dark:text-emerald-200">
                {Math.round(
                  (isMultiLevel ? nestedGroupData : groupData).reduce((sum, g) => sum + g.slaCompliance, 0) / 
                  (isMultiLevel ? nestedGroupData : groupData).length || 0
                )}%
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Sort:</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="text-xs border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300">
              <option value="count">Count</option>
              <option value="name">Name</option>
              <option value="sla">SLA %</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {isMultiLevel 
                  ? `Multi-Level: ${groupByLevels.map(l => typeLabels[l]).join(' → ')}`
                  : `By ${typeLabels[currentType || 'inspectionType']}`
                }
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isMultiLevel ? 'Expand groups to see nested hierarchy' : 'Click any group to drill deeper'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-slate-700 rounded-xl overflow-x-auto">
                {viewStyleOptions.map(opt => (
                  <button 
                    key={opt.id} 
                    onClick={() => setViewStyle(opt.id)} 
                    title={opt.label} 
                    className={`p-2 rounded-lg transition-all whitespace-nowrap ${
                      viewStyle === opt.id 
                        ? opt.gradient 
                          ? `bg-gradient-to-r ${opt.gradient} text-white shadow-lg` 
                          : 'bg-white dark:bg-slate-600 text-emerald-600 shadow-sm' 
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {opt.icon}
                  </button>
                ))}
              </div>
              {(viewStyle === 'cards' || viewStyle === 'list') && (
                <div className="flex items-center gap-1 ml-2">
                  {CHART_TYPE_OPTIONS.slice(0, 3).map(ct => (
                    <button key={ct.id} onClick={() => setChartType(ct.id)} className={`p-2 rounded-lg transition-all ${chartType === ct.id ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700'}`}>{ct.icon}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Sunburst View */}
          {viewStyle === 'sunburst' && (
            <InspectionSunburstView
              data={isMultiLevel ? nestedGroupData : groupData.map(g => ({
                ...g,
                children: [],
                level: 0,
                path: [g.name]
              }))}
              groupByLevels={isMultiLevel ? groupByLevels : [currentType || 'inspectionType']}
              typeLabels={typeLabels}
              onSegmentClick={(group) => toggleGroup(group.path.join('/'))}
            />
          )}

          {/* Flow View */}
          {viewStyle === 'flow' && (
            <InspectionFlowView
              data={isMultiLevel ? nestedGroupData : groupData.map(g => ({
                ...g,
                children: [],
                level: 0,
                path: [g.name]
              }))}
              groupByLevels={isMultiLevel ? groupByLevels : [currentType || 'inspectionType']}
              typeLabels={typeLabels}
              onItemClick={(group) => toggleGroup(group.path.join('/'))}
            />
          )}

          {/* Bubbles View */}
          {viewStyle === 'bubbles' && (
            <InspectionBubblesView
              data={isMultiLevel ? nestedGroupData : groupData.map(g => ({
                ...g,
                children: [],
                level: 0,
                path: [g.name]
              }))}
              groupByLevels={isMultiLevel ? groupByLevels : [currentType || 'inspectionType']}
              typeLabels={typeLabels}
              onBubbleClick={(group) => toggleGroup(group.path.join('/'))}
            />
          )}

          {/* Matrix View */}
          {viewStyle === 'matrix' && (
            <InspectionMatrixView
              data={isMultiLevel ? nestedGroupData : groupData.map(g => ({
                ...g,
                children: [],
                level: 0,
                path: [g.name]
              }))}
              groupByLevels={isMultiLevel ? groupByLevels : [currentType || 'inspectionType', 'status']}
              typeLabels={typeLabels}
              inspections={inspections}
              onCellClick={(rowGroup, colValue) => console.log('Matrix cell clicked:', rowGroup.name, colValue)}
            />
          )}

          {/* Tree View - Multi-Level */}
          {viewStyle === 'tree' && isMultiLevel && (
            <div className="space-y-2">
              {nestedGroupData.map((group) => (
                <NestedTreeNode 
                  key={group.path.join('/')} 
                  group={group} 
                  expandedGroups={expandedGroups} 
                  toggleGroup={toggleGroup} 
                  typeLabels={typeLabels}
                  groupByLevels={groupByLevels}
                  navigateDrillDown={navigateDrillDown}
                  openInspectionModal={openInspectionModal}
                />
              ))}
            </div>
          )}

          {/* Tree View - Single Level */}
          {viewStyle === 'tree' && !isMultiLevel && (
            <div className="space-y-2">
              {groupData.map((group) => (
                <div key={group.name} className="border border-gray-100 dark:border-slate-700 rounded-xl overflow-hidden">
                  <button onClick={() => toggleGroup(group.name)} className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    {expandedGroups.has(group.name) ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronUp className="w-5 h-5 text-gray-400 rotate-180" />}
                    <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: group.color }} />
                    <span className="font-medium text-gray-900 dark:text-white flex-1 text-left">{group.name}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{group.count} inspections</span>
                    <div className="flex items-center gap-2 ml-4">
                      <div className="w-20 h-2 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${group.slaCompliance}%`, backgroundColor: getSLAColor(group.slaCompliance >= 80 ? 'Within SLA' : 'SLA Breached') }} /></div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 w-10">{group.slaCompliance}%</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); navigateDrillDown(currentType!, group.name); }} className="p-2 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-gray-400 hover:text-emerald-600"><ArrowRight className="w-4 h-4" /></button>
                  </button>
                  {expandedGroups.has(group.name) && (
                    <div className="px-4 pb-4">
                      <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead><tr className="border-b border-gray-200 dark:border-slate-700"><th className="text-left p-3 font-medium text-gray-500 dark:text-gray-400">ID</th><th className="text-left p-3 font-medium text-gray-500 dark:text-gray-400">Type</th><th className="text-left p-3 font-medium text-gray-500 dark:text-gray-400">Status</th><th className="text-left p-3 font-medium text-gray-500 dark:text-gray-400">SLA</th><th className="text-left p-3 font-medium text-gray-500 dark:text-gray-400">Inspector</th><th className="text-right p-3 font-medium text-gray-500 dark:text-gray-400">Actions</th></tr></thead>
                          <tbody>{group.items.slice(0, 5).map(item => (<tr key={item.id} className="border-b border-gray-100 dark:border-slate-800 last:border-0"><td className="p-3 font-mono text-gray-900 dark:text-white">{item.id}</td><td className="p-3 text-gray-600 dark:text-gray-400">{item.inspectionType}</td><td className="p-3"><span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: `${getStatusColor(item.status)}20`, color: getStatusColor(item.status) }}>{item.status}</span></td><td className="p-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${item.slaStatus === 'Within SLA' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : item.slaStatus === 'SLA Breached' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400'}`}>{item.slaStatus}</span></td><td className="p-3 text-gray-600 dark:text-gray-400">{item.inspector}</td><td className="p-3 text-right"><button onClick={() => openInspectionModal(item)} className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 text-xs font-medium">View</button></td></tr>))}</tbody>
                        </table>
                        {group.items.length > 5 && <p className="text-center text-xs text-gray-500 dark:text-gray-400 py-2">+{group.items.length - 5} more</p>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Treemap View */}
          {viewStyle === 'treemap' && (
            <div className="space-y-4">
              <div className="flex h-32 gap-1 rounded-xl overflow-hidden">
                {treemapData.map((group) => (
                  <button key={group.name} onClick={() => navigateDrillDown(currentType!, group.name)} style={{ width: `${group.width}%`, backgroundColor: group.color }} className="relative group transition-all hover:opacity-90 hover:scale-[1.02] hover:z-10">
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-white">
                      <span className="font-semibold text-sm drop-shadow-md text-center leading-tight">{group.shortName}</span>
                      <span className="text-xs opacity-90">{group.count}</span>
                      <span className="text-xs opacity-75">{group.percentage}%</span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {groupData.map(group => (
                  <button key={group.name} onClick={() => navigateDrillDown(currentType!, group.name)} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all text-left">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: group.color }} />
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-900 dark:text-white truncate">{group.name}</p><p className="text-xs text-gray-500 dark:text-gray-400">{group.count} • SLA {group.slaCompliance}%</p></div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cards View */}
          {viewStyle === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {groupData.map((group) => (
                <div key={group.name} className="bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden hover:border-emerald-300 dark:hover:border-emerald-600 transition-colors">
                  <div className="p-4 border-b border-gray-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: group.color }} /><span className="font-medium text-gray-900 dark:text-white">{group.name}</span></div>
                      <button onClick={() => navigateDrillDown(currentType!, group.name)} className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-gray-400 hover:text-emerald-600"><ArrowRight className="w-4 h-4" /></button>
                    </div>
                    <div className="flex items-center gap-4 text-sm"><span className="text-gray-600 dark:text-gray-400">{group.count} inspections</span><span className="text-gray-400">•</span><span className={group.slaCompliance >= 80 ? 'text-green-600' : group.slaCompliance >= 50 ? 'text-yellow-600' : 'text-red-600'}>SLA {group.slaCompliance}%</span></div>
                  </div>
                  <div className="h-32 p-2"><DynamicChart data={[{ name: 'SLA', count: group.slaCompliance, color: getSLAColor(group.slaCompliance >= 80 ? 'Within SLA' : 'SLA Breached') }, { name: 'Gap', count: 100 - group.slaCompliance, color: '#e5e7eb' }]} chartType={chartType} height={112} /></div>
                </div>
              ))}
            </div>
          )}

          {/* List View */}
          {viewStyle === 'list' && (
            <div className="space-y-3">
              {groupData.map((group) => (
                <button key={group.name} onClick={() => navigateDrillDown(currentType!, group.name)} className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all">
                  <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: group.color }} />
                  <div className="flex-1 text-left"><p className="font-medium text-gray-900 dark:text-white">{group.name}</p><p className="text-sm text-gray-500 dark:text-gray-400">{group.count} inspections • {group.percentage}%</p></div>
                  <div className="flex items-center gap-6">
                    <div className="text-right"><p className="text-sm font-semibold text-gray-900 dark:text-white">{group.slaCompliance}%</p><p className="text-xs text-gray-500">SLA</p></div>
                    <div className="text-right"><p className="text-sm font-semibold text-gray-900 dark:text-white">{group.avgScore}%</p><p className="text-xs text-gray-500">Avg Score</p></div>
                    <div className="w-32 h-8"><DynamicChart data={[{ name: group.name, count: group.count, color: group.color }]} chartType="horizontalBar" height={32} /></div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </button>
              ))}
            </div>
          )}

          {/* Data View */}
          {viewStyle === 'data' && (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-gray-200 dark:border-slate-700"><th className="text-left p-4 font-semibold text-gray-900 dark:text-white">{typeLabels[currentType || 'inspectionType']}</th><th className="text-right p-4 font-semibold text-gray-900 dark:text-white">Count</th><th className="text-right p-4 font-semibold text-gray-900 dark:text-white">%</th><th className="text-right p-4 font-semibold text-gray-900 dark:text-white">SLA %</th><th className="text-right p-4 font-semibold text-gray-900 dark:text-white">Avg Score</th><th className="text-right p-4 font-semibold text-gray-900 dark:text-white">Completion</th><th className="p-4"></th></tr></thead>
                  <tbody>
                    {groupData.slice(page * pageSize, (page + 1) * pageSize).map((group, idx) => (
                      <tr key={group.name} className={`border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 ${idx % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-slate-900/30'}`}>
                        <td className="p-4"><div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: group.color }} /><span className="font-medium text-gray-900 dark:text-white">{group.name}</span></div></td>
                        <td className="p-4 text-right text-gray-600 dark:text-gray-400">{group.count}</td>
                        <td className="p-4 text-right text-gray-600 dark:text-gray-400">{group.percentage}%</td>
                        <td className="p-4 text-right"><span className={group.slaCompliance >= 80 ? 'text-green-600' : group.slaCompliance >= 50 ? 'text-yellow-600' : 'text-red-600'}>{group.slaCompliance}%</span></td>
                        <td className="p-4 text-right text-gray-600 dark:text-gray-400">{group.avgScore}%</td>
                        <td className="p-4 text-right text-gray-600 dark:text-gray-400">{group.completionRate}%</td>
                        <td className="p-4 text-right"><button onClick={() => navigateDrillDown(currentType!, group.name)} className="p-2 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-gray-400 hover:text-emerald-600"><ArrowRight className="w-4 h-4" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {groupData.length > pageSize && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-slate-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, groupData.length)} of {groupData.length}</p>
                  <div className="flex items-center gap-2">
                    <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-slate-600 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-700">Previous</button>
                    <button disabled={(page + 1) * pageSize >= groupData.length} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-slate-600 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-700">Next</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InspectionDrillDownView() {
  const { drillDown } = useInspection();
  
  if (drillDown.level === 0) return <OverviewLevel />;
  return <MultiLevelGroupView />;
}
