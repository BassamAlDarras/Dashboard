'use client';

import { Filter, RotateCcw, ChevronDown, ChevronUp, FolderTree, FileText, TrendingUp, User, MapPin, AlertTriangle, Plus, Trash2, ArrowUp, ArrowDown, X, GripVertical, ArrowRight } from 'lucide-react';
import { useDashboard } from '@/context/DashboardContext';
import permitsData from '@/data/permits';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { DrillDownState } from '@/types';

type GroupByLevel = NonNullable<DrillDownState['groupByLevels']>[number];

export default function Filters({ isVertical = false }: { isVertical?: boolean }) {
  const { filters, updateFilter, resetFilters, permits, navigateDrillDown, drillDown, setGroupByLevels, clearGroupByLevels } = useDashboard();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    groupBy: true,
    serviceType: true,
    status: true,
    owner: true,
    zone: true,
    priority: true,
  });
  
  // Multi-level grouping state
  const [selectedGroupLevels, setSelectedGroupLevels] = useState<GroupByLevel[]>([]);
  
  // Sync local state with context
  useEffect(() => {
    if (drillDown.groupByLevels && drillDown.groupByLevels.length > 0) {
      setSelectedGroupLevels(drillDown.groupByLevels);
    }
  }, [drillDown.groupByLevels]);

  const groupByOptions = [
    { id: 'serviceType', label: 'Service Type', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'status', label: 'Status', icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { id: 'owner', label: 'Owner', icon: <User className="w-3.5 h-3.5" /> },
    { id: 'zone', label: 'Zone', icon: <MapPin className="w-3.5 h-3.5" /> },
    { id: 'priority', label: 'Priority', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  ] as const;

  // Multi-level grouping functions
  const addGroupLevel = (level: GroupByLevel) => {
    if (!selectedGroupLevels.includes(level)) {
      const newLevels = [...selectedGroupLevels, level];
      setSelectedGroupLevels(newLevels);
      setGroupByLevels(newLevels);
    }
  };

  const removeGroupLevel = (level: GroupByLevel) => {
    const newLevels = selectedGroupLevels.filter(l => l !== level);
    setSelectedGroupLevels(newLevels);
    if (newLevels.length > 0) {
      setGroupByLevels(newLevels);
    } else {
      clearGroupByLevels();
    }
  };

  const moveGroupLevel = (level: GroupByLevel, direction: 'up' | 'down') => {
    const index = selectedGroupLevels.indexOf(level);
    if (index === -1) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= selectedGroupLevels.length) return;
    const newLevels = [...selectedGroupLevels];
    [newLevels[index], newLevels[newIndex]] = [newLevels[newIndex], newLevels[index]];
    setSelectedGroupLevels(newLevels);
    setGroupByLevels(newLevels);
  };

  const clearAllGroupLevels = () => {
    setSelectedGroupLevels([]);
    clearGroupByLevels();
  };

  const availableGroupLevels = groupByOptions.filter(
    opt => !selectedGroupLevels.includes(opt.id as GroupByLevel)
  );

  const uniqueOwners = Array.from(new Set(permits.map(p => p.owner))).sort();

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== 'all').length;

  if (isVertical) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <Filter className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Filters</h3>
                {activeFiltersCount > 0 && (
                  <p className="text-xs text-blue-600 dark:text-blue-400">{activeFiltersCount} active</p>
                )}
              </div>
            </div>
            {activeFiltersCount > 0 && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Filter Sections */}
        <div className="divide-y divide-gray-100 dark:divide-slate-700">
          {/* Visual Group By Pipeline Section */}
          <div className="p-3 bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 dark:from-violet-900/20 dark:via-purple-900/15 dark:to-indigo-900/10">
            <button
              onClick={() => toggleSection('groupBy')}
              className="w-full flex items-center justify-between text-xs font-medium text-gray-700 dark:text-gray-300 mb-3"
            >
              <span className="flex items-center gap-2 text-violet-700 dark:text-violet-400">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-sm">
                  <FolderTree className="w-3 h-3" />
                </div>
                <span className="font-semibold">Data Pipeline</span>
                {selectedGroupLevels.length > 0 && (
                  <span className="px-2 py-0.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-full text-[10px] font-bold shadow-sm">
                    {selectedGroupLevels.length} {selectedGroupLevels.length === 1 ? 'level' : 'levels'}
                  </span>
                )}
              </span>
              {expandedSections.groupBy ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {expandedSections.groupBy && (
              <div className="space-y-3">
                {/* Visual Pipeline Flow */}
                {selectedGroupLevels.length > 0 ? (
                  <div className="relative">
                    {/* Pipeline Container */}
                    <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-3 border border-violet-200/50 dark:border-violet-700/30 shadow-inner">
                      {/* Flow Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active Flow</span>
                        </div>
                        <button
                          onClick={clearAllGroupLevels}
                          className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-red-500 hover:text-white hover:bg-red-500 rounded-md transition-all duration-200"
                        >
                          <X className="w-2.5 h-2.5" />
                          Reset
                        </button>
                      </div>
                      
                      {/* Visual Pipeline Nodes */}
                      <div className="flex flex-col gap-0">
                        {selectedGroupLevels.map((levelId, index) => {
                          const option = groupByOptions.find(o => o.id === levelId);
                          if (!option) return null;
                          
                          const colors = [
                            { bg: 'from-blue-500 to-cyan-500', light: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-700', text: 'text-blue-600 dark:text-blue-400' },
                            { bg: 'from-purple-500 to-pink-500', light: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-700', text: 'text-purple-600 dark:text-purple-400' },
                            { bg: 'from-amber-500 to-orange-500', light: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-700', text: 'text-amber-600 dark:text-amber-400' },
                            { bg: 'from-emerald-500 to-teal-500', light: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-700', text: 'text-emerald-600 dark:text-emerald-400' },
                            { bg: 'from-rose-500 to-red-500', light: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-700', text: 'text-rose-600 dark:text-rose-400' },
                          ];
                          const color = colors[index % colors.length];
                          
                          return (
                            <div key={levelId} className="relative group">
                              {/* Connector Line */}
                              {index > 0 && (
                                <div className="absolute left-5 -top-2 w-0.5 h-4 bg-gradient-to-b from-gray-300 to-gray-200 dark:from-slate-600 dark:to-slate-700" />
                              )}
                              
                              {/* Pipeline Node */}
                              <div className={`relative flex items-center gap-2 p-2 rounded-xl ${color.light} ${color.border} border transition-all duration-200 hover:shadow-md`}>
                                {/* Level Badge */}
                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color.bg} flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                                  {index + 1}
                                </div>
                                
                                {/* Node Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className={color.text}>{option.icon}</span>
                                    <span className={`text-xs font-semibold ${color.text}`}>{option.label}</span>
                                  </div>
                                  <span className="text-[9px] text-gray-400 dark:text-gray-500">
                                    {index === 0 ? 'Primary grouping' : index === 1 ? 'Sub-grouping' : `Level ${index + 1} breakdown`}
                                  </span>
                                </div>
                                
                                {/* Controls */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => moveGroupLevel(levelId, 'up')}
                                    disabled={index === 0}
                                    className="p-1 rounded-md hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 transition-colors"
                                    title="Move up"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5 text-gray-500" />
                                  </button>
                                  <button
                                    onClick={() => moveGroupLevel(levelId, 'down')}
                                    disabled={index === selectedGroupLevels.length - 1}
                                    className="p-1 rounded-md hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 transition-colors"
                                    title="Move down"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5 text-gray-500" />
                                  </button>
                                  <button
                                    onClick={() => removeGroupLevel(levelId)}
                                    className="p-1 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                    title="Remove"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                  </button>
                                </div>
                              </div>
                              
                              {/* Flow Arrow */}
                              {index < selectedGroupLevels.length - 1 && (
                                <div className="flex justify-center py-1">
                                  <div className="flex flex-col items-center">
                                    <div className="w-0.5 h-2 bg-gradient-to-b from-gray-300 to-transparent dark:from-slate-600" />
                                    <ChevronDown className="w-3 h-3 text-gray-400 dark:text-slate-500 -mt-1" />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Result Preview */}
                      <div className="mt-3 pt-3 border-t border-dashed border-gray-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400">
                          <span className="font-medium">Result:</span>
                          <div className="flex items-center gap-1 flex-wrap">
                            {selectedGroupLevels.map((l, i) => (
                              <span key={l} className="flex items-center gap-1">
                                <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 rounded text-[9px] font-medium">
                                  {groupByOptions.find(o => o.id === l)?.label}
                                </span>
                                {i < selectedGroupLevels.length - 1 && (
                                  <ArrowRight className="w-2.5 h-2.5 text-gray-400" />
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Empty State - Dimension Picker */
                  <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-3 border-2 border-dashed border-violet-200 dark:border-violet-800/50">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center mb-3">
                      Build your data pipeline by adding dimensions
                    </p>
                  </div>
                )}
                
                {/* Available Dimensions - Visual Cards */}
                {availableGroupLevels.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Plus className="w-3 h-3" />
                      {selectedGroupLevels.length > 0 ? 'Add another level' : 'Start with a dimension'}
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {availableGroupLevels.map((option, idx) => {
                        const hoverColors = [
                          'hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20',
                          'hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20',
                          'hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20',
                          'hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
                          'hover:border-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20',
                        ];
                        return (
                          <button
                            key={option.id}
                            onClick={() => addGroupLevel(option.id as GroupByLevel)}
                            className={`flex items-center gap-2 p-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-xs transition-all duration-200 ${hoverColors[(selectedGroupLevels.length + idx) % hoverColors.length]} hover:shadow-sm group`}
                          >
                            <span className="text-gray-400 dark:text-gray-500 group-hover:scale-110 transition-transform">
                              {option.icon}
                            </span>
                            <span className="text-gray-600 dark:text-gray-400 font-medium truncate">{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Service Type */}
          <div className="p-3">
            <button
              onClick={() => toggleSection('serviceType')}
              className="w-full flex items-center justify-between text-xs font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              <span className={filters.serviceType !== 'all' ? 'text-blue-600 dark:text-blue-400' : ''}>
                Service Type {filters.serviceType !== 'all' && '•'}
              </span>
              {expandedSections.serviceType ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {expandedSections.serviceType && (
              <div className="space-y-1">
                <button
                  onClick={() => updateFilter('serviceType', 'all')}
                  className={cn(
                    "w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all",
                    filters.serviceType === 'all'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                  )}
                >
                  All Types
                </button>
                {permitsData.lookups.serviceTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => updateFilter('serviceType', type)}
                    className={cn(
                      "w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all",
                      filters.serviceType === type
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="p-3">
            <button
              onClick={() => toggleSection('status')}
              className="w-full flex items-center justify-between text-xs font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              <span className={filters.status !== 'all' ? 'text-blue-600 dark:text-blue-400' : ''}>
                Status {filters.status !== 'all' && '•'}
              </span>
              {expandedSections.status ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {expandedSections.status && (
              <div className="space-y-1">
                <button
                  onClick={() => updateFilter('status', 'all')}
                  className={cn(
                    "w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all",
                    filters.status === 'all'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                  )}
                >
                  All Statuses
                </button>
                {permitsData.lookups.statuses.map(status => (
                  <button
                    key={status}
                    onClick={() => updateFilter('status', status)}
                    className={cn(
                      "w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-2",
                      filters.status === status
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                    )}
                  >
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      status === 'Opened' && 'bg-blue-500',
                      status === 'In Progress' && 'bg-yellow-500',
                      status === 'Under Review' && 'bg-purple-500',
                      status === 'Approved' && 'bg-green-500',
                      status === 'Rejected' && 'bg-red-500',
                      status === 'Closed' && 'bg-gray-500'
                    )} />
                    {status}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Owner */}
          <div className="p-3">
            <button
              onClick={() => toggleSection('owner')}
              className="w-full flex items-center justify-between text-xs font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              <span className={filters.owner !== 'all' ? 'text-blue-600 dark:text-blue-400' : ''}>
                Owner {filters.owner !== 'all' && '•'}
              </span>
              {expandedSections.owner ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {expandedSections.owner && (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                <button
                  onClick={() => updateFilter('owner', 'all')}
                  className={cn(
                    "w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all",
                    filters.owner === 'all'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                  )}
                >
                  All Owners
                </button>
                {uniqueOwners.map(owner => (
                  <button
                    key={owner}
                    onClick={() => updateFilter('owner', owner)}
                    className={cn(
                      "w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all truncate",
                      filters.owner === owner
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                    )}
                    title={owner}
                  >
                    {owner}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Zone */}
          <div className="p-3">
            <button
              onClick={() => toggleSection('zone')}
              className="w-full flex items-center justify-between text-xs font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              <span className={filters.zone !== 'all' ? 'text-blue-600 dark:text-blue-400' : ''}>
                Zone {filters.zone !== 'all' && '•'}
              </span>
              {expandedSections.zone ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {expandedSections.zone && (
              <div className="space-y-1">
                <button
                  onClick={() => updateFilter('zone', 'all')}
                  className={cn(
                    "w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all",
                    filters.zone === 'all'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                  )}
                >
                  All Zones
                </button>
                {permitsData.lookups.zones.map(zone => (
                  <button
                    key={zone}
                    onClick={() => updateFilter('zone', zone)}
                    className={cn(
                      "w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all",
                      filters.zone === zone
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                    )}
                  >
                    {zone}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Priority */}
          <div className="p-3">
            <button
              onClick={() => toggleSection('priority')}
              className="w-full flex items-center justify-between text-xs font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              <span className={filters.priority !== 'all' ? 'text-blue-600 dark:text-blue-400' : ''}>
                Priority {filters.priority !== 'all' && '•'}
              </span>
              {expandedSections.priority ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {expandedSections.priority && (
              <div className="space-y-1">
                <button
                  onClick={() => updateFilter('priority', 'all')}
                  className={cn(
                    "w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all",
                    filters.priority === 'all'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                  )}
                >
                  All Priorities
                </button>
                {permitsData.lookups.priorities.map(priority => (
                  <button
                    key={priority}
                    onClick={() => updateFilter('priority', priority)}
                    className={cn(
                      "w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-2",
                      filters.priority === priority
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                    )}
                  >
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      priority === 'High' && 'bg-red-500',
                      priority === 'Medium' && 'bg-yellow-500',
                      priority === 'Low' && 'bg-green-500'
                    )} />
                    {priority}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-gray-500" />
        <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Service Type */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Service Type</label>
          <select
            value={filters.serviceType}
            onChange={(e) => updateFilter('serviceType', e.target.value)}
            className={cn(
              "w-full px-3 py-2 rounded-lg text-sm",
              "bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600",
              "text-gray-900 dark:text-white",
              "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "transition-all duration-200"
            )}
          >
            <option value="all">All Types</option>
            {permitsData.lookups.serviceTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Status</label>
          <select
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value)}
            className={cn(
              "w-full px-3 py-2 rounded-lg text-sm",
              "bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600",
              "text-gray-900 dark:text-white",
              "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "transition-all duration-200"
            )}
          >
            <option value="all">All Statuses</option>
            {permitsData.lookups.statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {/* Owner */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Owner</label>
          <select
            value={filters.owner}
            onChange={(e) => updateFilter('owner', e.target.value)}
            className={cn(
              "w-full px-3 py-2 rounded-lg text-sm",
              "bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600",
              "text-gray-900 dark:text-white",
              "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "transition-all duration-200"
            )}
          >
            <option value="all">All Owners</option>
            {uniqueOwners.map(owner => (
              <option key={owner} value={owner}>{owner}</option>
            ))}
          </select>
        </div>

        {/* Zone */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Zone</label>
          <select
            value={filters.zone}
            onChange={(e) => updateFilter('zone', e.target.value)}
            className={cn(
              "w-full px-3 py-2 rounded-lg text-sm",
              "bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600",
              "text-gray-900 dark:text-white",
              "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "transition-all duration-200"
            )}
          >
            <option value="all">All Zones</option>
            {permitsData.lookups.zones.map(zone => (
              <option key={zone} value={zone}>{zone}</option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Priority</label>
          <select
            value={filters.priority}
            onChange={(e) => updateFilter('priority', e.target.value)}
            className={cn(
              "w-full px-3 py-2 rounded-lg text-sm",
              "bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600",
              "text-gray-900 dark:text-white",
              "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "transition-all duration-200"
            )}
          >
            <option value="all">All Priorities</option>
            {permitsData.lookups.priorities.map(priority => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>
        </div>

        {/* Reset Button */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-transparent">Reset</label>
          <button
            onClick={resetFilters}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
              "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300",
              "hover:bg-gray-200 dark:hover:bg-slate-600",
              "transition-all duration-200"
            )}
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
