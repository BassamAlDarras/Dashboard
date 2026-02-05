'use client';

import { useMemo, useState } from 'react';
import {
  TrendingUp, TrendingDown, Target, Award, Clock, AlertTriangle,
  CheckCircle2, XCircle, Users, MapPin, Activity, Zap, Shield, Timer,
  ArrowUpRight, ArrowDownRight, PieChart as PieChartIcon, Layers,
  ClipboardCheck, Star, Hourglass, AlertOctagon, Ban, Scale,
  UserCheck, Calendar, Building2, Eye, FileCheck,
  GitCompare, ArrowLeftRight, Briefcase
} from 'lucide-react';
import { useInspection } from '@/context/InspectionContext';
import { Inspection } from '@/types';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, AreaChart, Area, RadialBarChart, RadialBar, Legend
} from 'recharts';

// Types
type CompareMode = 'none' | 'zone' | 'month' | 'category';
type Period = 'week' | 'month' | 'quarter' | 'year';

const INSPECTION_COLORS = {
  status: { Completed: '#22C55E', Pending: '#F59E0B', 'In Progress': '#3B82F6', Scheduled: '#8B5CF6', Failed: '#EF4444', Cancelled: '#6B7280' },
  priority: { High: '#EF4444', Medium: '#F59E0B', Low: '#22C55E' },
  category: ['#3B82F6', '#8B5CF6', '#06B6D4', '#F59E0B', '#EF4444', '#22C55E', '#EC4899', '#6366F1'],
};

// Comparison color scheme for up to 3 comparisons
const COMPARE_COLORS = [
  { bg: 'bg-teal-50 dark:bg-teal-900/20', border: 'border-teal-200 dark:border-teal-800', text: 'text-teal-600 dark:text-teal-400', fill: '#14B8A6' },
  { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-600 dark:text-emerald-400', fill: '#10B981' },
  { bg: 'bg-cyan-50 dark:bg-cyan-900/20', border: 'border-cyan-200 dark:border-cyan-800', text: 'text-cyan-600 dark:text-cyan-400', fill: '#06B6D4' },
];

function getStatusColor(status: string): string { 
  return INSPECTION_COLORS.status[status as keyof typeof INSPECTION_COLORS.status] || '#6B7280'; 
}

function getPriorityColor(priority: string): string { 
  return INSPECTION_COLORS.priority[priority as keyof typeof INSPECTION_COLORS.priority] || '#6B7280'; 
}

function getMonthName(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

// Helper function to filter inspections by period
function filterByPeriod(inspections: Inspection[], period: Period): Inspection[] {
  if (inspections.length === 0) return inspections;
  
  // Find the most recent date in the data to use as reference
  const dates = inspections.map(i => new Date(i.scheduledDate).getTime());
  const mostRecentDate = new Date(Math.max(...dates));
  
  const cutoffDate = new Date(mostRecentDate);
  switch (period) {
    case 'week': cutoffDate.setDate(mostRecentDate.getDate() - 7); break;
    case 'month': cutoffDate.setMonth(mostRecentDate.getMonth() - 1); break;
    case 'quarter': cutoffDate.setMonth(mostRecentDate.getMonth() - 3); break;
    case 'year': cutoffDate.setFullYear(mostRecentDate.getFullYear() - 1); break;
  }
  
  const filtered = inspections.filter(i => new Date(i.scheduledDate) >= cutoffDate);
  // If no data in period, return all data
  return filtered.length > 0 ? filtered : inspections;
}

// Calculate metrics for a set of inspections
function calculateMetrics(inspections: Inspection[]) {
  const total = inspections.length;
  const completed = inspections.filter(i => i.status === 'Completed').length;
  const failed = inspections.filter(i => i.status === 'Failed').length;
  const breached = inspections.filter(i => i.slaStatus === 'SLA Breached').length;
  const withinSLA = inspections.filter(i => i.slaStatus === 'Within SLA').length;
  const slaCompliance = total > 0 ? Math.round((withinSLA / total) * 100) : 100;
  const passRate = (completed + failed) > 0 ? Math.round((completed / (completed + failed)) * 100) : 100;
  
  const scoredInspections = inspections.filter(i => i.complianceScore !== null);
  const avgScore = scoredInspections.length > 0
    ? Math.round(scoredInspections.reduce((acc, i) => acc + (i.complianceScore || 0), 0) / scoredInspections.length) : 0;
  
  const highPriority = inspections.filter(i => i.priority === 'High').length;
  const reinspections = inspections.filter(i => i.reinspectionRequired).length;
  
  return { total, completed, failed, breached, withinSLA, slaCompliance, passRate, avgScore, highPriority, reinspections };
}

// Compare Selector Component
function CompareSelector({ compareMode, setCompareMode, compareValues, setCompareValues, options }: {
  compareMode: CompareMode;
  setCompareMode: (mode: CompareMode) => void;
  compareValues: string[];
  setCompareValues: (values: string[]) => void;
  options: { zones: string[]; months: string[]; categories: string[] };
}) {
  const currentOptions = compareMode === 'zone' ? options.zones : compareMode === 'month' ? options.months : compareMode === 'category' ? options.categories : [];
  
  const addComparison = () => {
    if (compareValues.length < 3 && currentOptions.length > compareValues.length) {
      const nextOption = currentOptions.find(opt => !compareValues.includes(opt));
      if (nextOption) setCompareValues([...compareValues, nextOption]);
    }
  };
  
  const removeComparison = (index: number) => {
    if (compareValues.length > 2) {
      setCompareValues(compareValues.filter((_, i) => i !== index));
    }
  };
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-teal-600" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Compare By:</span>
        </div>
        
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-700 rounded-xl p-1">
          {[
            { id: 'none' as const, label: 'Off', icon: <XCircle className="w-4 h-4" /> },
            { id: 'zone' as const, label: 'Zone', icon: <MapPin className="w-4 h-4" /> },
            { id: 'month' as const, label: 'Month', icon: <Calendar className="w-4 h-4" /> },
            { id: 'category' as const, label: 'Category', icon: <Briefcase className="w-4 h-4" /> },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setCompareMode(opt.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                compareMode === opt.id
                  ? 'bg-teal-600 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              {opt.icon}
              <span className="hidden sm:inline">{opt.label}</span>
            </button>
          ))}
        </div>

        {compareMode !== 'none' && currentOptions.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {compareValues.map((val, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <select
                  value={val}
                  onChange={e => {
                    const newValues = [...compareValues];
                    newValues[idx] = e.target.value;
                    setCompareValues(newValues);
                  }}
                  className={`px-3 py-2 ${COMPARE_COLORS[idx].bg} border ${COMPARE_COLORS[idx].border} rounded-lg text-sm font-medium ${COMPARE_COLORS[idx].text}`}
                >
                  {currentOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {compareValues.length > 2 && (
                  <button onClick={() => removeComparison(idx)} className="p-1 text-gray-400 hover:text-red-500">
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
                {idx < compareValues.length - 1 && <span className="text-gray-400 mx-1">vs</span>}
              </div>
            ))}
            {compareValues.length < 3 && currentOptions.length > compareValues.length && (
              <button 
                onClick={addComparison}
                className="px-3 py-2 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-500 hover:border-teal-400 hover:text-teal-600 transition-colors"
              >
                + Add
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Comparison KPI Card
function CompareKPICard({ title, value1, value2, label1, label2, icon }: {
  title: string; value1: string | number; value2: string | number; label1: string; label2: string; icon: React.ReactNode;
}) {
  const v1 = typeof value1 === 'string' ? parseFloat(value1) : value1;
  const v2 = typeof value2 === 'string' ? parseFloat(value2) : value2;
  const diff = v1 - v2;
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 hover:shadow-lg transition-all">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700">{icon}</div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 truncate">{label1}</p>
          <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">{value1}</p>
        </div>
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 truncate">{label2}</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{value2}</p>
        </div>
      </div>
      {diff !== 0 && (
        <div className={`mt-3 text-center text-xs font-medium ${diff > 0 ? 'text-teal-600' : 'text-emerald-600'}`}>
          {label1} is {Math.abs(diff).toFixed(1)} {diff > 0 ? 'higher' : 'lower'}
        </div>
      )}
    </div>
  );
}

// Comparison Bar Chart - Supports up to 3 comparisons
function CompareBarChart({ data, labels, title }: {
  data: Record<string, string | number>[];
  labels: string[];
  title: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.15)' }} />
          <Legend />
          {labels.map((label, idx) => (
            <Bar key={idx} dataKey={`value${idx + 1}`} name={label} fill={COMPARE_COLORS[idx].fill} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// SLA Status Badge Component
function SLAStatusBadge({ status, count }: { status: 'critical' | 'warning' | 'good'; count: number }) {
  const config = {
    critical: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Breached' },
    warning: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: 'At Risk' },
    good: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'On Track' }
  };
  const { bg, text, label } = config[status];
  
  return (
    <div className={`${bg} rounded-xl p-4 text-center`}>
      <p className={`text-3xl font-bold ${text}`}>{count}</p>
      <p className={`text-sm ${text} font-medium`}>{label}</p>
    </div>
  );
}

// Executive KPI Card Component
interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: number; isPositive: boolean };
  icon: React.ReactNode;
  color: string;
  target?: { value: number; label: string };
}

function ExecutiveKPICard({ title, value, subtitle, trend, icon, color, target }: KPICardProps) {
  return (
    <div className="relative bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 overflow-hidden group hover:shadow-lg transition-all duration-300">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500`} />
      
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${color} shadow-lg`}>
            {icon}
          </div>
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              trend.isPositive 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {trend.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        
        <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">{title}</h3>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
        
        {target && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  typeof value === 'string' && value.includes('%') 
                    ? parseFloat(value) >= target.value ? 'bg-green-500' : 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, (typeof value === 'string' ? parseFloat(value) : value) / target.value * 100)}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">{target.label}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// SLA Breakdown Card
function SLABreakdownCard({ title, icon, children, className = '' }: { title: string; icon: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700">{icon}</div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// Large SLA Gauge - Custom SVG for clearer visualization
function LargeSLAGauge({ value, target = 95 }: { value: number; target?: number }) {
  const meetsTarget = value >= target;
  const color = value >= target ? '#22C55E' : value >= target - 10 ? '#F59E0B' : '#EF4444';
  
  // SVG semicircle gauge
  const radius = 80;
  const strokeWidth = 16;
  const circumference = Math.PI * radius;
  const progress = (value / 100) * circumference;
  
  return (
    <div className="relative flex flex-col items-center">
      <svg width="200" height="120" viewBox="0 0 200 120">
        {/* Background arc */}
        <path
          d={`M ${100 - radius} 100 A ${radius} ${radius} 0 0 1 ${100 + radius} 100`}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <path
          d={`M ${100 - radius} 100 A ${radius} ${radius} 0 0 1 ${100 + radius} 100`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          style={{ transition: 'stroke-dasharray 0.5s ease' }}
        />
        {/* Center text */}
        <text x="100" y="85" textAnchor="middle" className="text-4xl font-bold" fill={color}>
          {value}%
        </text>
        <text x="100" y="105" textAnchor="middle" className="text-xs" fill="#6B7280">
          SLA Compliance
        </text>
      </svg>
      <div className={`mt-2 px-3 py-1 rounded-full text-xs font-medium ${meetsTarget ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {meetsTarget ? '✓ Meeting Target' : `✗ ${target - value}% below target`}
      </div>
    </div>
  );
}

// Quality Score Gauge
function QualityScoreGauge({ value }: { value: number }) {
  const gaugeData = [{ name: 'Score', value, fill: value >= 90 ? '#22C55E' : value >= 70 ? '#F59E0B' : '#EF4444' }];
  
  return (
    <div className="relative" style={{ width: 160, height: 100 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart cx="50%" cy="100%" innerRadius="60%" outerRadius="100%" data={gaugeData} startAngle={180} endAngle={0}>
          <RadialBar dataKey="value" cornerRadius={10} background={{ fill: '#e5e7eb' }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
        <span className={`text-2xl font-bold ${value >= 90 ? 'text-green-600' : value >= 70 ? 'text-amber-600' : 'text-red-600'}`}>{value}%</span>
        <p className="text-xs text-gray-500">Avg Score</p>
      </div>
    </div>
  );
}

// Zone Performance Card
function ZonePerformanceCard({ zone, inspections, slaRate, breached, avgScore }: { zone: string; inspections: number; slaRate: number; breached: number; avgScore: number }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
        slaRate >= 90 ? 'bg-green-100 dark:bg-green-900/30' : slaRate >= 70 ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-red-100 dark:bg-red-900/30'
      }`}>
        <MapPin className={`w-6 h-6 ${slaRate >= 90 ? 'text-green-600' : slaRate >= 70 ? 'text-amber-600' : 'text-red-600'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-900 dark:text-white truncate">{zone}</h4>
        <p className="text-sm text-gray-500">{inspections} inspections • {avgScore}% score</p>
      </div>
      <div className="text-right">
        <p className={`text-lg font-bold ${slaRate >= 90 ? 'text-green-600' : slaRate >= 70 ? 'text-amber-600' : 'text-red-600'}`}>{slaRate}%</p>
        <p className="text-xs text-red-500">{breached} breached</p>
      </div>
    </div>
  );
}

// Inspector Performance Card
function InspectorCard({ name, completed, avgScore, slaRate, ranking }: { name: string; completed: number; avgScore: number; slaRate: number; ranking: number }) {
  const rankColors = ['bg-yellow-400', 'bg-gray-300', 'bg-amber-600'];
  
  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${rankColors[ranking - 1] || 'bg-gray-400'}`}>
        {ranking}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-gray-900 dark:text-white">{name}</h4>
        <p className="text-sm text-gray-500">{completed} inspections</p>
      </div>
      <div className="text-right">
        <div className="flex items-center gap-2">
          <Star className={`w-4 h-4 ${avgScore >= 90 ? 'text-yellow-500' : avgScore >= 70 ? 'text-gray-400' : 'text-gray-300'}`} fill={avgScore >= 90 ? '#EAB308' : 'none'} />
          <span className={`font-bold ${avgScore >= 90 ? 'text-green-600' : avgScore >= 70 ? 'text-amber-600' : 'text-red-600'}`}>{avgScore}%</span>
        </div>
        <p className="text-xs text-gray-500">{slaRate}% SLA</p>
      </div>
    </div>
  );
}

// Main Inspection Executive View
export default function InspectionExecutiveView() {
  const { inspections, getFilteredByDrillDown } = useInspection();
  const allFilteredInspections = getFilteredByDrillDown();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('month');
  const [compareMode, setCompareMode] = useState<CompareMode>('none');
  const [compareValues, setCompareValues] = useState<string[]>([]);

  // Get unique values for comparison
  const comparisonOptions = useMemo(() => {
    const zones = Array.from(new Set(allFilteredInspections.map(i => i.zone))).sort();
    const categories = Array.from(new Set(allFilteredInspections.map(i => i.category))).sort();
    const months: string[] = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push(getMonthName(date));
    }
    return { zones, months, categories };
  }, [allFilteredInspections]);

  // Initialize compare values with defaults when mode changes
  useMemo(() => {
    if (compareMode === 'zone' && comparisonOptions.zones.length >= 2 && compareValues.length === 0) {
      setCompareValues([comparisonOptions.zones[0], comparisonOptions.zones[1]]);
    } else if (compareMode === 'month' && comparisonOptions.months.length >= 2 && compareValues.length === 0) {
      setCompareValues([comparisonOptions.months[0], comparisonOptions.months[1]]);
    } else if (compareMode === 'category' && comparisonOptions.categories.length >= 2 && compareValues.length === 0) {
      setCompareValues([comparisonOptions.categories[0], comparisonOptions.categories[1]]);
    } else if (compareMode === 'none') {
      setCompareValues([]);
    }
  }, [compareMode, comparisonOptions, compareValues.length]);

  // Filter inspections by selected period
  const filteredInspections = useMemo(() => {
    return filterByPeriod(allFilteredInspections, selectedPeriod);
  }, [allFilteredInspections, selectedPeriod]);

  // Get comparison data sets - now supports up to 3 comparisons
  const comparisonSets = useMemo(() => {
    if (compareMode === 'none' || compareValues.length < 2) return [];
    
    return compareValues.map(value => {
      let permits: Inspection[] = [];
      if (compareMode === 'zone') {
        permits = filteredInspections.filter(i => i.zone === value);
      } else if (compareMode === 'category') {
        permits = filteredInspections.filter(i => i.category === value);
      } else if (compareMode === 'month') {
        permits = allFilteredInspections.filter(i => getMonthName(new Date(i.scheduledDate)) === value);
      }
      return { label: value, permits, metrics: calculateMetrics(permits) };
    });
  }, [filteredInspections, allFilteredInspections, compareMode, compareValues]);

  // Comparison chart data - supports up to 3 comparisons
  const comparisonChartData = useMemo(() => {
    if (compareMode === 'none' || comparisonSets.length < 2) return { statusData: [], priorityData: [], slaData: [] };
    
    const statusData = ['Completed', 'Pending', 'Failed'].map(status => {
      const item: Record<string, string | number> = { name: status };
      comparisonSets.forEach((set, idx) => {
        item[`value${idx + 1}`] = set.permits.filter(i => i.status === status).length;
      });
      return item;
    });
    
    const priorityData = ['High', 'Medium', 'Low'].map(priority => {
      const item: Record<string, string | number> = { name: priority };
      comparisonSets.forEach((set, idx) => {
        item[`value${idx + 1}`] = set.permits.filter(i => i.priority === priority).length;
      });
      return item;
    });
    
    const slaData = ['Within SLA', 'Breached'].map(status => {
      const item: Record<string, string | number> = { name: status };
      comparisonSets.forEach((set, idx) => {
        item[`value${idx + 1}`] = set.permits.filter(i => i.slaStatus === (status === 'Within SLA' ? 'Within SLA' : 'SLA Breached')).length;
      });
      return item;
    });
    
    return { statusData, priorityData, slaData };
  }, [compareMode, comparisonSets]);

  // Calculate comprehensive metrics
  const metrics = useMemo(() => {
    const total = filteredInspections.length;
    const completed = filteredInspections.filter(i => i.status === 'Completed').length;
    const pending = filteredInspections.filter(i => i.status === 'Pending').length;
    const inProgress = filteredInspections.filter(i => i.status === 'In Progress').length;
    const failed = filteredInspections.filter(i => i.status === 'Failed').length;
    const scheduled = filteredInspections.filter(i => i.status === 'Scheduled').length;
    
    // SLA Analysis
    const breached = filteredInspections.filter(i => i.slaStatus === 'SLA Breached').length;
    const withinSLA = filteredInspections.filter(i => i.slaStatus === 'Within SLA').length;
    const naStatus = filteredInspections.filter(i => i.slaStatus === 'N/A').length;
    // Calculate at-risk based on pending/scheduled items
    const atRiskSLA = filteredInspections.filter(i => (i.status === 'Pending' || i.status === 'Scheduled') && i.slaStatus === 'Within SLA').length;
    const slaCompliance = total > 0 ? Math.round((withinSLA / total) * 100) : 100;
    
    // Priority breakdown
    const highPriority = filteredInspections.filter(i => i.priority === 'High').length;
    const mediumPriority = filteredInspections.filter(i => i.priority === 'Medium').length;
    const lowPriority = filteredInspections.filter(i => i.priority === 'Low').length;
    
    // High priority SLA
    const highPriorityBreached = filteredInspections.filter(i => i.priority === 'High' && i.slaStatus === 'SLA Breached').length;
    const highPrioritySLA = highPriority > 0 ? Math.round(((highPriority - highPriorityBreached) / highPriority) * 100) : 100;

    // Reinspection metrics
    const reinspections = filteredInspections.filter(i => i.reinspectionRequired).length;
    const reinspectionRate = total > 0 ? Math.round((reinspections / total) * 100) : 0;
    
    // Quality metrics (compliance score)
    const scoredInspections = filteredInspections.filter(i => i.complianceScore !== null);
    const avgComplianceScore = scoredInspections.length > 0
      ? Math.round(scoredInspections.reduce((acc, i) => acc + (i.complianceScore || 0), 0) / scoredInspections.length)
      : 0;
    
    const excellentScores = filteredInspections.filter(i => (i.complianceScore || 0) >= 90).length;
    const goodScores = filteredInspections.filter(i => (i.complianceScore || 0) >= 70 && (i.complianceScore || 0) < 90).length;
    const poorScores = filteredInspections.filter(i => i.complianceScore !== null && (i.complianceScore || 0) < 70).length;
    
    // Duration metrics
    const durationInspections = filteredInspections.filter(i => i.duration !== null);
    const avgDuration = durationInspections.length > 0
      ? Math.round(durationInspections.reduce((acc, i) => acc + (i.duration || 0), 0) / durationInspections.length)
      : 0;
    const maxDuration = durationInspections.length > 0 ? Math.max(...durationInspections.map(i => i.duration || 0)) : 0;
    const minDuration = durationInspections.length > 0 ? Math.min(...durationInspections.map(i => i.duration || 0)) : 0;

    // Pass rate (Completed vs Failed)
    const passableInspections = completed + failed;
    const passRate = passableInspections > 0 ? Math.round((completed / passableInspections) * 100) : 100;

    // By Zone with detailed metrics
    const zoneStats = filteredInspections.reduce((acc, i) => {
      if (!acc[i.zone]) acc[i.zone] = { total: 0, breached: 0, totalScore: 0, scoredCount: 0 };
      acc[i.zone].total++;
      if (i.slaStatus === 'SLA Breached') acc[i.zone].breached++;
      if (i.complianceScore !== null) {
        acc[i.zone].totalScore += i.complianceScore;
        acc[i.zone].scoredCount++;
      }
      return acc;
    }, {} as Record<string, { total: number; breached: number; totalScore: number; scoredCount: number }>);

    // By Inspector
    const inspectorStats = filteredInspections.reduce((acc, i) => {
      if (!acc[i.inspector]) acc[i.inspector] = { total: 0, completed: 0, breached: 0, totalScore: 0, scoredCount: 0 };
      acc[i.inspector].total++;
      if (i.status === 'Completed') acc[i.inspector].completed++;
      if (i.slaStatus === 'SLA Breached') acc[i.inspector].breached++;
      if (i.complianceScore !== null) {
        acc[i.inspector].totalScore += i.complianceScore;
        acc[i.inspector].scoredCount++;
      }
      return acc;
    }, {} as Record<string, { total: number; completed: number; breached: number; totalScore: number; scoredCount: number }>);

    // By Status
    const statusStats = filteredInspections.reduce((acc, i) => {
      acc[i.status] = (acc[i.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // By Category
    const categoryStats = filteredInspections.reduce((acc, i) => {
      if (!acc[i.category]) acc[i.category] = { count: 0, breached: 0 };
      acc[i.category].count++;
      if (i.slaStatus === 'SLA Breached') acc[i.category].breached++;
      return acc;
    }, {} as Record<string, { count: number; breached: number }>);

    // By Type
    const typeStats = filteredInspections.reduce((acc, i) => {
      acc[i.inspectionType] = (acc[i.inspectionType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      completed,
      pending,
      inProgress,
      failed,
      scheduled,
      breached,
      withinSLA,
      atRiskSLA,
      slaCompliance,
      highPriority,
      mediumPriority,
      lowPriority,
      highPriorityBreached,
      highPrioritySLA,
      reinspections,
      reinspectionRate,
      avgComplianceScore,
      excellentScores,
      goodScores,
      poorScores,
      avgDuration,
      maxDuration,
      minDuration,
      passRate,
      zoneStats,
      inspectorStats,
      statusStats,
      categoryStats,
      typeStats
    };
  }, [filteredInspections]);

  // Period comparison
  const previousPeriodMetrics = useMemo(() => {
    const now = new Date();
    let prevStart = new Date();
    let prevEnd = new Date();
    
    switch (selectedPeriod) {
      case 'week':
        prevStart.setDate(now.getDate() - 14);
        prevEnd.setDate(now.getDate() - 7);
        break;
      case 'month':
        prevStart.setMonth(now.getMonth() - 2);
        prevEnd.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        prevStart.setMonth(now.getMonth() - 6);
        prevEnd.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        prevStart.setFullYear(now.getFullYear() - 2);
        prevEnd.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    const prevInspections = allFilteredInspections.filter(i => {
      const date = new Date(i.scheduledDate);
      return date >= prevStart && date < prevEnd;
    });
    
    const prevBreached = prevInspections.filter(i => i.slaStatus === 'SLA Breached').length;
    const prevSLA = prevInspections.length > 0 ? Math.round(((prevInspections.length - prevBreached) / prevInspections.length) * 100) : 100;
    const prevCompleted = prevInspections.filter(i => i.status === 'Completed').length;
    const prevFailed = prevInspections.filter(i => i.status === 'Failed').length;
    const prevPassRate = (prevCompleted + prevFailed) > 0 ? Math.round((prevCompleted / (prevCompleted + prevFailed)) * 100) : 100;
    
    return { total: prevInspections.length, sla: prevSLA, passRate: prevPassRate };
  }, [allFilteredInspections, selectedPeriod]);

  // Calculate trends
  const slaTrend = metrics.slaCompliance - previousPeriodMetrics.sla;
  const volumeTrend = previousPeriodMetrics.total > 0 
    ? Math.round(((metrics.total - previousPeriodMetrics.total) / previousPeriodMetrics.total) * 100)
    : 0;
  const passRateTrend = metrics.passRate - previousPeriodMetrics.passRate;

  // Zone performance data
  const zonePerformance = Object.entries(metrics.zoneStats).map(([zone, stats]) => ({
    zone,
    inspections: stats.total,
    slaRate: stats.total > 0 ? Math.round(((stats.total - stats.breached) / stats.total) * 100) : 100,
    breached: stats.breached,
    avgScore: stats.scoredCount > 0 ? Math.round(stats.totalScore / stats.scoredCount) : 0
  })).sort((a, b) => b.inspections - a.inspections);

  // Inspector performance
  const inspectorPerformance = Object.entries(metrics.inspectorStats)
    .map(([name, stats]) => ({
      name,
      completed: stats.completed,
      avgScore: stats.scoredCount > 0 ? Math.round(stats.totalScore / stats.scoredCount) : 0,
      slaRate: stats.total > 0 ? Math.round(((stats.total - stats.breached) / stats.total) * 100) : 100
    }))
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 5);

  // Status distribution
  const statusData = Object.entries(metrics.statusStats).map(([name, count]) => ({
    name,
    value: count,
    color: getStatusColor(name)
  }));

  // Category SLA data
  const categoryData = Object.entries(metrics.categoryStats)
    .map(([name, stats]) => ({
      name,
      count: stats.count,
      slaRate: stats.count > 0 ? Math.round(((stats.count - stats.breached) / stats.count) * 100) : 100
    }))
    .sort((a, b) => b.count - a.count);

  // Priority data
  const priorityData = [
    { name: 'High', value: metrics.highPriority, color: '#EF4444' },
    { name: 'Medium', value: metrics.mediumPriority, color: '#F59E0B' },
    { name: 'Low', value: metrics.lowPriority, color: '#22C55E' }
  ];

  const periodLabel = { week: 'This Week', month: 'This Month', quarter: 'This Quarter', year: 'This Year' }[selectedPeriod];

  // COMPARISON MODE VIEW
  if (compareMode !== 'none' && comparisonSets.length >= 2) {
    return (
      <div className="space-y-6">
        {/* Comparison Header */}
        <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-green-600 rounded-2xl p-6 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">Inspections Comparison Dashboard</h1>
              <p className="text-teal-200">Comparing: {compareValues.join(' vs ')}</p>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur rounded-xl p-1">
              {(['week', 'month', 'quarter', 'year'] as const).map(period => (
                <button key={period} onClick={() => setSelectedPeriod(period)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedPeriod === period ? 'bg-white text-teal-700 shadow-lg' : 'text-white hover:bg-white/20'}`}>
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Compare Selector */}
        <CompareSelector compareMode={compareMode} setCompareMode={setCompareMode} compareValues={compareValues} setCompareValues={setCompareValues} options={comparisonOptions} />

        {/* Comparison KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Inspections */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700"><ClipboardCheck className="w-5 h-5 text-gray-600" /></div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Total Inspections</h3>
            </div>
            <div className={`grid grid-cols-${comparisonSets.length} gap-2`}>
              {comparisonSets.map((set, idx) => (
                <div key={idx} className={`p-3 rounded-xl ${COMPARE_COLORS[idx].bg} border ${COMPARE_COLORS[idx].border}`}>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 truncate">{set.label}</p>
                  <p className={`text-xl font-bold ${COMPARE_COLORS[idx].text}`}>{set.metrics.total}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* SLA Compliance */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700"><Shield className="w-5 h-5 text-gray-600" /></div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">SLA Compliance</h3>
            </div>
            <div className={`grid grid-cols-${comparisonSets.length} gap-2`}>
              {comparisonSets.map((set, idx) => (
                <div key={idx} className={`p-3 rounded-xl ${COMPARE_COLORS[idx].bg} border ${COMPARE_COLORS[idx].border}`}>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 truncate">{set.label}</p>
                  <p className={`text-xl font-bold ${COMPARE_COLORS[idx].text}`}>{set.metrics.slaCompliance}%</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Pass Rate */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700"><CheckCircle2 className="w-5 h-5 text-gray-600" /></div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Pass Rate</h3>
            </div>
            <div className={`grid grid-cols-${comparisonSets.length} gap-2`}>
              {comparisonSets.map((set, idx) => (
                <div key={idx} className={`p-3 rounded-xl ${COMPARE_COLORS[idx].bg} border ${COMPARE_COLORS[idx].border}`}>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 truncate">{set.label}</p>
                  <p className={`text-xl font-bold ${COMPARE_COLORS[idx].text}`}>{set.metrics.passRate}%</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Avg Score */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700"><Star className="w-5 h-5 text-gray-600" /></div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Avg Score</h3>
            </div>
            <div className={`grid grid-cols-${comparisonSets.length} gap-2`}>
              {comparisonSets.map((set, idx) => (
                <div key={idx} className={`p-3 rounded-xl ${COMPARE_COLORS[idx].bg} border ${COMPARE_COLORS[idx].border}`}>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 truncate">{set.label}</p>
                  <p className={`text-xl font-bold ${COMPARE_COLORS[idx].text}`}>{set.metrics.avgScore}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Comparison Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <CompareBarChart data={comparisonChartData.statusData} labels={compareValues} title="Status Distribution" />
          <CompareBarChart data={comparisonChartData.priorityData} labels={compareValues} title="Priority Distribution" />
          <CompareBarChart data={comparisonChartData.slaData} labels={compareValues} title="SLA Performance" />
        </div>

        {/* Detailed Metrics - Dynamic grid based on number of comparisons */}
        <div className={`grid grid-cols-1 md:grid-cols-${comparisonSets.length} gap-6`}>
          {comparisonSets.map((set, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5">
              <h3 className={`text-lg font-semibold ${COMPARE_COLORS[idx].text} mb-4 flex items-center gap-2`}>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COMPARE_COLORS[idx].fill }} /> {set.label} Details
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-400">Completed</span>
                  <span className="font-bold text-green-600">{set.metrics.completed}</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-400">Failed</span>
                  <span className="font-bold text-red-600">{set.metrics.failed}</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-400">Breached</span>
                  <span className="font-bold text-red-600">{set.metrics.breached}</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-400">High Priority</span>
                  <span className="font-bold">{set.metrics.highPriority}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // STANDARD VIEW (no comparison)
  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 rounded-2xl p-6 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">Inspections Executive Dashboard</h1>
            <p className="text-emerald-200">Quality assurance metrics • {periodLabel}</p>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur rounded-xl p-1">
            {(['week', 'month', 'quarter', 'year'] as const).map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedPeriod === period
                    ? 'bg-white text-emerald-700 shadow-lg'
                    : 'text-white hover:bg-white/20'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="w-8 h-8 text-emerald-200" />
              <div>
                <p className="text-3xl font-bold">{metrics.total}</p>
                <p className="text-sm text-emerald-200">Total</p>
              </div>
            </div>
            {volumeTrend !== 0 && (
              <div className={`mt-2 text-xs flex items-center gap-1 ${volumeTrend > 0 ? 'text-green-300' : 'text-red-300'}`}>
                {volumeTrend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(volumeTrend)}% vs previous
              </div>
            )}
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-green-300" />
              <div>
                <p className="text-3xl font-bold">{metrics.completed}</p>
                <p className="text-sm text-emerald-200">Completed</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-amber-300" />
              <div>
                <p className="text-3xl font-bold">{metrics.pending + metrics.scheduled}</p>
                <p className="text-sm text-emerald-200">Pending</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <div className="flex items-center gap-3">
              <XCircle className="w-8 h-8 text-red-300" />
              <div>
                <p className="text-3xl font-bold">{metrics.failed}</p>
                <p className="text-sm text-emerald-200">Failed</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-orange-300" />
              <div>
                <p className="text-3xl font-bold">{metrics.reinspections}</p>
                <p className="text-sm text-emerald-200">Re-inspect</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compare Selector */}
      <CompareSelector compareMode={compareMode} setCompareMode={setCompareMode} compareValues={compareValues} setCompareValues={setCompareValues} options={comparisonOptions} />

      {/* SLA & Quality Performance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main SLA Gauge */}
        <SLABreakdownCard 
          title="Overall SLA Compliance" 
          icon={<Target className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
          className="lg:row-span-2"
        >
          <div className="flex flex-col items-center">
            <LargeSLAGauge value={metrics.slaCompliance} target={95} />
            <div className="w-full mt-6 grid grid-cols-3 gap-3">
              <SLAStatusBadge status="critical" count={metrics.breached} />
              <SLAStatusBadge status="warning" count={metrics.atRiskSLA} />
              <SLAStatusBadge status="good" count={metrics.withinSLA} />
            </div>
          </div>
        </SLABreakdownCard>

        {/* KPI Cards */}
        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
          <ExecutiveKPICard
            title="SLA Compliance"
            value={`${metrics.slaCompliance}%`}
            subtitle={`${metrics.withinSLA} of ${metrics.total} within SLA`}
            trend={{ value: Math.abs(slaTrend), isPositive: slaTrend >= 0 }}
            icon={<Shield className="w-5 h-5 text-white" />}
            color="from-green-500 to-emerald-600"
            target={{ value: 95, label: '95% target' }}
          />
          <ExecutiveKPICard
            title="High Priority SLA"
            value={`${metrics.highPrioritySLA}%`}
            subtitle={`${metrics.highPriority - metrics.highPriorityBreached} of ${metrics.highPriority} on track`}
            icon={<Zap className="w-5 h-5 text-white" />}
            color="from-orange-500 to-red-600"
            target={{ value: 98, label: '98% target' }}
          />
          <ExecutiveKPICard
            title="Pass Rate"
            value={`${metrics.passRate}%`}
            subtitle={`${metrics.completed} passed, ${metrics.failed} failed`}
            trend={{ value: Math.abs(passRateTrend), isPositive: passRateTrend >= 0 }}
            icon={<FileCheck className="w-5 h-5 text-white" />}
            color="from-blue-500 to-cyan-600"
            target={{ value: 90, label: '90% target' }}
          />
          <ExecutiveKPICard
            title="Quality Score"
            value={`${metrics.avgComplianceScore}%`}
            subtitle="Avg compliance score"
            icon={<Star className="w-5 h-5 text-white" />}
            color="from-purple-500 to-violet-600"
            target={{ value: 85, label: '85% target' }}
          />
          <ExecutiveKPICard
            title="Avg Duration"
            value={`${metrics.avgDuration}m`}
            subtitle={`Range: ${metrics.minDuration}-${metrics.maxDuration} min`}
            icon={<Timer className="w-5 h-5 text-white" />}
            color="from-teal-500 to-cyan-600"
          />
          <ExecutiveKPICard
            title="Reinspection Rate"
            value={`${metrics.reinspectionRate}%`}
            subtitle={`${metrics.reinspections} require re-inspection`}
            icon={<Eye className="w-5 h-5 text-white" />}
            color="from-amber-500 to-orange-600"
            target={{ value: 10, label: '<10% target' }}
          />
        </div>
      </div>

      {/* Quality & Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Quality Score Breakdown */}
        <SLABreakdownCard 
          title="Quality Scores" 
          icon={<Star className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
        >
          <div className="flex justify-center mb-4">
            <QualityScoreGauge value={metrics.avgComplianceScore} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-sm text-green-700 dark:text-green-400">Excellent (≥90%)</span>
              <span className="font-bold text-green-600">{metrics.excellentScores}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <span className="text-sm text-amber-700 dark:text-amber-400">Good (70-89%)</span>
              <span className="font-bold text-amber-600">{metrics.goodScores}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <span className="text-sm text-red-700 dark:text-red-400">{"Needs Work (<70%)"}</span>
              <span className="font-bold text-red-600">{metrics.poorScores}</span>
            </div>
          </div>
        </SLABreakdownCard>

        {/* Priority Distribution */}
        <SLABreakdownCard 
          title="Priority Distribution" 
          icon={<Scale className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm flex-1">High</span>
              <span className="font-semibold">{metrics.highPriority}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-sm flex-1">Medium</span>
              <span className="font-semibold">{metrics.mediumPriority}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm flex-1">Low</span>
              <span className="font-semibold">{metrics.lowPriority}</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={priorityData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" hide />
              <Bar dataKey="value" radius={4}>
                {priorityData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </SLABreakdownCard>

        {/* Status Distribution */}
        <SLABreakdownCard 
          title="By Status" 
          icon={<PieChartIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
        >
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={2} dataKey="value">
                {statusData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} stroke="white" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.15)' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {statusData.slice(0, 4).map((item, idx) => (
              <div key={idx} className="flex items-center gap-1 text-xs">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
              </div>
            ))}
          </div>
        </SLABreakdownCard>

        {/* Category SLA */}
        <SLABreakdownCard 
          title="Category SLA" 
          icon={<Layers className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
        >
          <div className="space-y-2">
            {categoryData.slice(0, 4).map((category, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-xs text-gray-600 dark:text-gray-400 truncate flex-1">{category.name}</span>
                <div className={`px-2 py-0.5 rounded text-xs font-medium ${
                  category.slaRate >= 90 ? 'bg-green-100 text-green-700' : category.slaRate >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                }`}>
                  {category.slaRate}%
                </div>
              </div>
            ))}
          </div>
        </SLABreakdownCard>
      </div>

      {/* Zone Performance & Inspector Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SLABreakdownCard 
          title="Zone Performance" 
          icon={<MapPin className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
        >
          <div className="space-y-3">
            {zonePerformance.map((zone, idx) => (
              <ZonePerformanceCard key={idx} {...zone} />
            ))}
          </div>
        </SLABreakdownCard>

        <SLABreakdownCard 
          title="Top Inspectors" 
          icon={<UserCheck className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
        >
          <div className="space-y-3">
            {inspectorPerformance.map((inspector, idx) => (
              <InspectorCard
                key={idx}
                name={inspector.name}
                completed={inspector.completed}
                avgScore={inspector.avgScore}
                slaRate={inspector.slaRate}
                ranking={idx + 1}
              />
            ))}
          </div>
        </SLABreakdownCard>
      </div>
    </div>
  );
}
