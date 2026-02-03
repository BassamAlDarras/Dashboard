'use client';

import { useState } from 'react';
import { Search, Filter, X, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { useInspection } from '@/context/InspectionContext';
import { cn } from '@/lib/utils';

export default function InspectionFilters({ isVertical = false }: { isVertical?: boolean }) {
  const { filters, updateFilter, resetFilters, lookups } = useInspection();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    inspectionType: true,
    status: true,
    inspector: true,
    zone: true,
    priority: true,
    category: false,
    slaStatus: false,
  });

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
