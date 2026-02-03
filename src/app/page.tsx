'use client';

import { useState } from 'react';
import { 
  Sun, 
  Moon, 
  Download,
  RefreshCw,
  FileText,
  ClipboardCheck,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';
import { useDashboard } from '@/context/DashboardContext';
import { useInspection } from '@/context/InspectionContext';
import KPICards from '@/components/dashboard/KPICards';
import Filters from '@/components/dashboard/Filters';
import Breadcrumb from '@/components/dashboard/Breadcrumb';
import PermitModal from '@/components/dashboard/PermitModal';
import DrillDownView from '@/components/dashboard/DrillDownView';
import InspectionKPICards from '@/components/inspections/InspectionKPICards';
import InspectionFilters from '@/components/inspections/InspectionFilters';
import InspectionBreadcrumb from '@/components/inspections/InspectionBreadcrumb';
import InspectionDrillDownView from '@/components/inspections/InspectionDrillDownView';
import InspectionModal from '@/components/inspections/InspectionModal';

type DashboardTab = 'permits' | 'inspections';

export default function DashboardPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [filterPanelCollapsed, setFilterPanelCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>('permits');
  
  const { 
    drillDown: permitDrillDown, 
    resetFilters: resetPermitFilters, 
    resetDrillDown: resetPermitDrillDown, 
    getFilteredByDrillDown: getPermitFiltered 
  } = useDashboard();
  
  const { 
    drillDown: inspectionDrillDown, 
    resetFilters: resetInspectionFilters, 
    resetDrillDown: resetInspectionDrillDown, 
    getFilteredByDrillDown: getInspectionFiltered 
  } = useInspection();
  
  const currentPermits = getPermitFiltered();
  const currentInspections = getInspectionFiltered();

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleRefresh = () => {
    if (activeTab === 'permits') {
      resetPermitFilters();
      resetPermitDrillDown();
    } else {
      resetInspectionFilters();
      resetInspectionDrillDown();
    }
  };

  const currentCount = activeTab === 'permits' ? currentPermits.length : currentInspections.length;

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-slate-900 ${isDarkMode ? 'dark' : ''}`}>
      {/* Main Content */}
      <main className="px-4 lg:px-8 py-4 space-y-4">
        {/* Compact Header Bar */}
        <div className="flex items-center justify-between">
          {/* Tab Navigation */}
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl p-1 shadow-sm border border-gray-200 dark:border-slate-700">
              <button
                onClick={() => setActiveTab('permits')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'permits'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                <FileText className="w-4 h-4" />
                Permits
              </button>
              <button
                onClick={() => setActiveTab('inspections')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'inspections'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                <ClipboardCheck className="w-4 h-4" />
                Inspections
              </button>
            </div>
            
            {/* Count Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">Showing</span>
              <span className={`text-sm font-bold ${activeTab === 'permits' ? 'text-blue-600' : 'text-emerald-600'}`}>{currentCount}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{activeTab}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setFilterPanelCollapsed(!filterPanelCollapsed)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                filterPanelCollapsed 
                  ? 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                  : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
              }`}
            >
              {filterPanelCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
              <span className="hidden sm:inline">{filterPanelCollapsed ? 'Filters' : 'Hide'}</span>
            </button>
            
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-gray-200 dark:hover:border-slate-700"
              title="Reset & Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            
            <button
              onClick={toggleDarkMode}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-gray-200 dark:hover:border-slate-700"
              title="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            
            <button className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Permits Tab Content */}
        {activeTab === 'permits' && (
          <div className="flex gap-6">
            {/* Left Filter Panel */}
            <div 
              className={`transition-all duration-300 ease-in-out flex-shrink-0 ${
                filterPanelCollapsed ? 'w-0 overflow-hidden opacity-0' : 'w-72 opacity-100'
              }`}
            >
              <div className="sticky top-24">
                <Filters isVertical />
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0 space-y-6">
              {/* Breadcrumb Navigation */}
              <Breadcrumb />

              {/* KPI Cards */}
              <KPICards />

              {/* Drill-Down View */}
              <DrillDownView />
            </div>
          </div>
        )}

        {/* Inspections Tab Content */}
        {activeTab === 'inspections' && (
          <div className="flex gap-6">
            {/* Left Filter Panel */}
            <div 
              className={`transition-all duration-300 ease-in-out flex-shrink-0 ${
                filterPanelCollapsed ? 'w-0 overflow-hidden opacity-0' : 'w-72 opacity-100'
              }`}
            >
              <div className="sticky top-24">
                <InspectionFilters isVertical />
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0 space-y-6">
              {/* Breadcrumb Navigation */}
              <InspectionBreadcrumb />

              {/* KPI Cards */}
              <InspectionKPICards />

              {/* Drill-Down View */}
              <InspectionDrillDownView />
            </div>
          </div>
        )}
      </main>

      {/* Permit Detail Modal */}
      <PermitModal />

      {/* Inspection Detail Modal */}
      <InspectionModal />
    </div>
  );
}
