'use client';

import { useMemo, useState } from 'react';
import { 
  ArrowRight, ClipboardCheck, Users, MapPin, AlertTriangle, Layers,
  Grid3X3, PieChartIcon, Eye, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  TrendingUp, Award, Clock, BarChart3, BarChart2, LineChart as LineChartIcon,
  AreaChart as AreaChartIcon, Target, CheckCircle2, Gauge, Table2, Columns3,
  LayoutGrid, List,
} from 'lucide-react';
import { useInspection } from '@/context/InspectionContext';
import { Inspection } from '@/types';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, LineChart, Line, AreaChart, Area, RadialBarChart, RadialBar,
} from 'recharts';
import { formatDate } from '@/lib/utils';

type ChartType = 'pie' | 'bar' | 'horizontalBar' | 'line' | 'area' | 'radial';
type GroupViewStyle = 'tree' | 'treemap' | 'cards' | 'list' | 'data';

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

// Multi-Level Group View - Tree, Treemap, Cards, List, Data views
function MultiLevelGroupView() {
  const { drillDown, navigateDrillDown, getFilteredByDrillDown, openInspectionModal } = useInspection();
  const [viewStyle, setViewStyle] = useState<GroupViewStyle>('cards');
  const [chartType, setChartType] = useState<ChartType>('pie');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'count' | 'name' | 'sla'>('count');
  const [page, setPage] = useState(0);
  const pageSize = 10;
  
  const currentType = drillDown.type;
  const inspections = getFilteredByDrillDown();

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

  const toggleGroup = (name: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(name)) newSet.delete(name); else newSet.add(name);
      return newSet;
    });
  };

  const typeLabels: Record<string, string> = { inspectionType: 'Inspection Type', status: 'Status', inspector: 'Inspector', zone: 'Zone', priority: 'Priority', category: 'Category' };

  const viewStyleOptions: { id: GroupViewStyle; label: string; icon: React.ReactNode }[] = [
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
            <p className="text-emerald-800 dark:text-emerald-200"><span className="font-semibold">{inspections.length}</span> inspections in <span className="font-semibold">{groupData.length}</span> groups</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-emerald-600 dark:text-emerald-400">Avg SLA:</span>
              <span className="font-semibold text-emerald-800 dark:text-emerald-200">{Math.round(groupData.reduce((sum, g) => sum + g.slaCompliance, 0) / groupData.length || 0)}%</span>
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">By {typeLabels[currentType || 'inspectionType']}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Click any group to drill deeper</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-slate-700 rounded-lg">
                {viewStyleOptions.map(opt => (
                  <button key={opt.id} onClick={() => setViewStyle(opt.id)} title={opt.label} className={`p-2 rounded-md transition-all ${viewStyle === opt.id ? 'bg-white dark:bg-slate-600 text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>{opt.icon}</button>
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
          {/* Tree View */}
          {viewStyle === 'tree' && (
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
