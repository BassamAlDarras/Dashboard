'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, X, RotateCcw, ChevronDown, ChevronUp, Layers, ClipboardCheck, Users, MapPin, AlertTriangle, TrendingUp, FolderTree, GripVertical, Plus, Trash2, ArrowUp, ArrowDown, ArrowRight } from 'lucide-react';
import { useInspection } from '@/context/InspectionContext';
import { cn } from '@/lib/utils';
import { InspectionDrillDownState } from '@/types';

type GroupByLevel = NonNullable<InspectionDrillDownState['groupByLevels']>[number];

export default function InspectionFilters({ isVertical = false }: { isVertical?: boolean }) {
  const { filters, updateFilter, resetFilters, lookups, navigateDrillDown, drillDown, setGroupByLevels, clearGroupByLevels } = useInspection();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    groupBy: true,
    inspectionType: true,
    status: true,
    inspector: true,
    zone: true,
    priority: true,
    category: false,
    slaStatus: false,
  });
  const [selectedGroupLevels, setSelectedGroupLevels] = useState<GroupByLevel[]>([]);
  
  // Sync with context
  useEffect(() => {
    if (drillDown.groupByLevels && drillDown.groupByLevels.length > 0) {
      setSelectedGroupLevels(drillDown.groupByLevels);
    }
  }, [drillDown.groupByLevels]);

  const groupByOptions: { id: GroupByLevel; label: string; icon: React.ReactNode }[] = [
    { id: 'inspectionType', label: 'Inspection Type', icon: <ClipboardCheck className="w-3.5 h-3.5" /> },
    { id: 'status', label: 'Status', icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { id: 'inspector', label: 'Inspector', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'zone', label: 'Zone', icon: <MapPin className="w-3.5 h-3.5" /> },
    { id: 'priority', label: 'Priority', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
    { id: 'category', label: 'Category', icon: <Layers className="w-3.5 h-3.5" /> },
  ];

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

  const moveGroupLevelByDirection = (level: GroupByLevel, direction: 'up' | 'down') => {
    const index = selectedGroupLevels.indexOf(level);
    if (index === -1) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= selectedGroupLevels.length) return;
    const newLevels = [...selectedGroupLevels];
    [newLevels[index], newLevels[newIndex]] = [newLevels[newIndex], newLevels[index]];
    setSelectedGroupLevels(newLevels);
    setGroupByLevels(newLevels);
  };

  const moveGroupLevel = (fromIndex: number, toIndex: number) => {
    const newLevels = [...selectedGroupLevels];
    const [removed] = newLevels.splice(fromIndex, 1);
    newLevels.splice(toIndex, 0, removed);
    setSelectedGroupLevels(newLevels);
    setGroupByLevels(newLevels);
  };
  
  const clearAllGroupLevels = () => {
    setSelectedGroupLevels([]);
    clearGroupByLevels();
  };
  
  const availableGroupLevels = groupByOptions.filter(
    opt => !selectedGroupLevels.includes(opt.id)
  );

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const hasActiveFilters = filters.inspectionType || filters.status || filters.inspector || 
    filters.zone || filters.priority || filters.category || filters.slaStatus || filters.searchQuery;

  const activeFiltersCount = [
    filters.inspectionType,
    filters.status,
    filters.inspector,
    filters.zone,
    filters.priority,
    filters.category,
    filters.slaStatus,
    filters.searchQuery
  ].filter(Boolean).length;

  if (isVertical) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-slate-800 dark:to-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                <Filter className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Filters</h3>
                {activeFiltersCount > 0 && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">{activeFiltersCount} active</p>
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

        {/* Search */}
        <div className="p-3 border-b border-gray-100 dark:border-slate-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={filters.searchQuery}
              onChange={(e) => updateFilter('searchQuery', e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Filter Sections */}
        <div className="divide-y divide-gray-100 dark:divide-slate-700 max-h-[calc(100vh-300px)] overflow-y-auto">
          {/* Visual Group By Pipeline Section */}
          <div className="p-3 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-900/20 dark:via-teal-900/15 dark:to-cyan-900/10">
            <button
              onClick={() => toggleSection('groupBy')}
              className="w-full flex items-center justify-between text-xs font-medium text-gray-700 dark:text-gray-300 mb-3"
            >
              <span className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
                  <FolderTree className="w-3 h-3" />
                </div>
                <span className="font-semibold">Data Pipeline</span>
                {selectedGroupLevels.length > 0 && (
                  <span className="px-2 py-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full text-[10px] font-bold shadow-sm">
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
                    <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-3 border border-emerald-200/50 dark:border-emerald-700/30 shadow-inner">
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
                            { bg: 'from-emerald-500 to-teal-500', light: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-700', text: 'text-emerald-600 dark:text-emerald-400' },
                            { bg: 'from-cyan-500 to-blue-500', light: 'bg-cyan-50 dark:bg-cyan-900/20', border: 'border-cyan-200 dark:border-cyan-700', text: 'text-cyan-600 dark:text-cyan-400' },
                            { bg: 'from-violet-500 to-purple-500', light: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-200 dark:border-violet-700', text: 'text-violet-600 dark:text-violet-400' },
                            { bg: 'from-amber-500 to-orange-500', light: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-700', text: 'text-amber-600 dark:text-amber-400' },
                            { bg: 'from-rose-500 to-pink-500', light: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-700', text: 'text-rose-600 dark:text-rose-400' },
                            { bg: 'from-indigo-500 to-blue-500', light: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-700', text: 'text-indigo-600 dark:text-indigo-400' },
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
                                    onClick={() => moveGroupLevelByDirection(levelId, 'up')}
                                    disabled={index === 0}
                                    className="p-1 rounded-md hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 transition-colors"
                                    title="Move up"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5 text-gray-500" />
                                  </button>
                                  <button
                                    onClick={() => moveGroupLevelByDirection(levelId, 'down')}
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
                  <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-3 border-2 border-dashed border-emerald-200 dark:border-emerald-800/50">
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
                          'hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
                          'hover:border-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20',
                          'hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20',
                          'hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20',
                          'hover:border-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20',
                          'hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20',
                        ];
                        return (
                          <button
                            key={option.id}
                            onClick={() => addGroupLevel(option.id)}
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

          {/* Inspection Type */}
          <div className="p-3">
            <button
              onClick={() => toggleSection('inspectionType')}
              className="w-full flex items-center justify-between text-xs font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              <span className={filters.inspectionType ? 'text-emerald-600 dark:text-emerald-400' : ''}>
                Inspection Type {filters.inspectionType && '•'}
              </span>
              {expandedSections.inspectionType ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {expandedSections.inspectionType && (
              <div className="space-y-1">
                <button
                  onClick={() => updateFilter('inspectionType', '')}
                  className={cn(
                    "w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all",
                    !filters.inspectionType
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                  )}
                >
                  All Types
                </button>
                {lookups.inspectionTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => updateFilter('inspectionType', type)}
                    className={cn(
                      "w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all",
                      filters.inspectionType === type
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium'
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
              <span className={filters.status ? 'text-emerald-600 dark:text-emerald-400' : ''}>
                Status {filters.status && '•'}
              </span>
              {expandedSections.status ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {expandedSections.status && (
              <div className="space-y-1">
                <button
                  onClick={() => updateFilter('status', '')}
                  className={cn(
                    "w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all",
                    !filters.status
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                  )}
                >
                  All Statuses
                </button>
                {lookups.statuses.map(status => (
                  <button
                    key={status}
                    onClick={() => updateFilter('status', status)}
                    className={cn(
                      "w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-2",
                      filters.status === status
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                    )}
                  >
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      status === 'Scheduled' && 'bg-blue-500',
                      status === 'In Progress' && 'bg-yellow-500',
                      status === 'Completed' && 'bg-green-500',
                      status === 'Failed' && 'bg-red-500',
                      status === 'Cancelled' && 'bg-gray-500'
                    )} />
                    {status}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Inspector */}
          <div className="p-3">
            <button
              onClick={() => toggleSection('inspector')}
              className="w-full flex items-center justify-between text-xs font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              <span className={filters.inspector ? 'text-emerald-600 dark:text-emerald-400' : ''}>
                Inspector {filters.inspector && '•'}
              </span>
              {expandedSections.inspector ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {expandedSections.inspector && (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                <button
                  onClick={() => updateFilter('inspector', '')}
                  className={cn(
                    "w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all",
                    !filters.inspector
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                  )}
                >
                  All Inspectors
                </button>
                {lookups.inspectors.map(inspector => (
                  <button
                    key={inspector}
                    onClick={() => updateFilter('inspector', inspector)}
                    className={cn(
                      "w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all truncate",
                      filters.inspector === inspector
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                    )}
                    title={inspector}
                  >
                    {inspector}
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
              <span className={filters.zone ? 'text-emerald-600 dark:text-emerald-400' : ''}>
                Zone {filters.zone && '•'}
              </span>
              {expandedSections.zone ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {expandedSections.zone && (
              <div className="space-y-1">
                <button
                  onClick={() => updateFilter('zone', '')}
                  className={cn(
                    "w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all",
                    !filters.zone
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                  )}
                >
                  All Zones
                </button>
                {lookups.zones.map(zone => (
                  <button
                    key={zone}
                    onClick={() => updateFilter('zone', zone)}
                    className={cn(
                      "w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all",
                      filters.zone === zone
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium'
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
              <span className={filters.priority ? 'text-emerald-600 dark:text-emerald-400' : ''}>
                Priority {filters.priority && '•'}
              </span>
              {expandedSections.priority ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {expandedSections.priority && (
              <div className="space-y-1">
                <button
                  onClick={() => updateFilter('priority', '')}
                  className={cn(
                    "w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all",
                    !filters.priority
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                  )}
                >
                  All Priorities
                </button>
                {lookups.priorities.map(priority => (
                  <button
                    key={priority}
                    onClick={() => updateFilter('priority', priority)}
                    className={cn(
                      "w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-2",
                      filters.priority === priority
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium'
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

          {/* Category */}
          <div className="p-3">
            <button
              onClick={() => toggleSection('category')}
              className="w-full flex items-center justify-between text-xs font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              <span className={filters.category ? 'text-emerald-600 dark:text-emerald-400' : ''}>
                Category {filters.category && '•'}
              </span>
              {expandedSections.category ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {expandedSections.category && (
              <div className="space-y-1">
                <button
                  onClick={() => updateFilter('category', '')}
                  className={cn(
                    "w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all",
                    !filters.category
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                  )}
                >
                  All Categories
                </button>
                {lookups.categories.map(category => (
                  <button
                    key={category}
                    onClick={() => updateFilter('category', category)}
                    className={cn(
                      "w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all",
                      filters.category === category
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                    )}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* SLA Status */}
          <div className="p-3">
            <button
              onClick={() => toggleSection('slaStatus')}
              className="w-full flex items-center justify-between text-xs font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              <span className={filters.slaStatus ? 'text-emerald-600 dark:text-emerald-400' : ''}>
                SLA Status {filters.slaStatus && '•'}
              </span>
              {expandedSections.slaStatus ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {expandedSections.slaStatus && (
              <div className="space-y-1">
                <button
                  onClick={() => updateFilter('slaStatus', '')}
                  className={cn(
                    "w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all",
                    !filters.slaStatus
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                  )}
                >
                  All SLA
                </button>
                {['On Track', 'At Risk', 'Breached'].map(sla => (
                  <button
                    key={sla}
                    onClick={() => updateFilter('slaStatus', sla)}
                    className={cn(
                      "w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-2",
                      filters.slaStatus === sla
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                    )}
                  >
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      sla === 'On Track' && 'bg-green-500',
                      sla === 'At Risk' && 'bg-yellow-500',
                      sla === 'Breached' && 'bg-red-500'
                    )} />
                    {sla}
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
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 overflow-hidden">
      <div className="p-4 border-b border-gray-100 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search inspections, locations, inspectors..."
              value={filters.searchQuery}
              onChange={(e) => updateFilter('searchQuery', e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          
          {/* Quick Filters */}
          <div className="flex gap-2">
            <select
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              {lookups.statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            
            <select
              value={filters.priority}
              onChange={(e) => updateFilter('priority', e.target.value)}
              className="px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Priorities</option>
              {lookups.priorities.map(priority => (
                <option key={priority} value={priority}>{priority}</option>
              ))}
            </select>
            
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                showAdvanced 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                  : 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-600'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">More Filters</span>
            </button>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="p-4 bg-gray-50 dark:bg-slate-700/50 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Inspection Type
            </label>
            <select
              value={filters.inspectionType}
              onChange={(e) => updateFilter('inspectionType', e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              {lookups.inspectionTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Inspector
            </label>
            <select
              value={filters.inspector}
              onChange={(e) => updateFilter('inspector', e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Inspectors</option>
              {lookups.inspectors.map(inspector => (
                <option key={inspector} value={inspector}>{inspector}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Zone
            </label>
            <select
              value={filters.zone}
              onChange={(e) => updateFilter('zone', e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Zones</option>
              {lookups.zones.map(zone => (
                <option key={zone} value={zone}>{zone}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => updateFilter('category', e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {lookups.categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              SLA Status
            </label>
            <select
              value={filters.slaStatus}
              onChange={(e) => updateFilter('slaStatus', e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All SLA</option>
              <option value="On Track">On Track</option>
              <option value="At Risk">At Risk</option>
              <option value="Breached">Breached</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Reinspection
            </label>
            <select
              value={filters.reinspectionRequired === null ? '' : filters.reinspectionRequired ? 'yes' : 'no'}
              onChange={(e) => updateFilter('reinspectionRequired', e.target.value === '' ? null : e.target.value === 'yes')}
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="yes">Required</option>
              <option value="no">Not Required</option>
            </select>
          </div>
        </div>
      )}

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="px-4 py-3 flex flex-wrap gap-2 border-t border-gray-100 dark:border-slate-700">
          {filters.searchQuery && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
              Search: "{filters.searchQuery}"
              <button onClick={() => updateFilter('searchQuery', '')} className="hover:text-blue-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.inspectionType && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 rounded-full text-xs font-medium">
              Type: {filters.inspectionType}
              <button onClick={() => updateFilter('inspectionType', '')} className="hover:text-violet-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.status && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
              Status: {filters.status}
              <button onClick={() => updateFilter('status', '')} className="hover:text-green-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.inspector && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium">
              Inspector: {filters.inspector}
              <button onClick={() => updateFilter('inspector', '')} className="hover:text-amber-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.zone && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 rounded-full text-xs font-medium">
              Zone: {filters.zone}
              <button onClick={() => updateFilter('zone', '')} className="hover:text-cyan-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.priority && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-xs font-medium">
              Priority: {filters.priority}
              <button onClick={() => updateFilter('priority', '')} className="hover:text-red-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.category && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full text-xs font-medium">
              Category: {filters.category}
              <button onClick={() => updateFilter('category', '')} className="hover:text-indigo-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.slaStatus && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 rounded-full text-xs font-medium">
              SLA: {filters.slaStatus}
              <button onClick={() => updateFilter('slaStatus', '')} className="hover:text-pink-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
