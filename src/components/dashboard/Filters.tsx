'use client';

import { Filter, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { useDashboard } from '@/context/DashboardContext';
import permitsData from '@/data/permits';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export default function Filters({ isVertical = false }: { isVertical?: boolean }) {
  const { filters, updateFilter, resetFilters, permits } = useDashboard();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    serviceType: true,
    status: true,
    owner: true,
    zone: true,
    priority: true,
  });

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
