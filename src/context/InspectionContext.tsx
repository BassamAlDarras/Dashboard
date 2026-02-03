'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Inspection, InspectionDrillDownState, InspectionFilterState, BreadcrumbItem } from '@/types';
import inspectionsData from '@/data/inspections';

interface InspectionContextType {
  inspections: Inspection[];
  filteredInspections: Inspection[];
  filters: InspectionFilterState;
  drillDown: InspectionDrillDownState;
  selectedInspection: Inspection | null;
  isModalOpen: boolean;
  setFilters: (filters: InspectionFilterState) => void;
  updateFilter: <K extends keyof InspectionFilterState>(key: K, value: InspectionFilterState[K]) => void;
  resetFilters: () => void;
  navigateDrillDown: (type: InspectionDrillDownState['type'], value: string) => void;
  goBackDrillDown: () => void;
  resetDrillDown: () => void;
  openInspectionModal: (inspection: Inspection) => void;
  closeInspectionModal: () => void;
  getFilteredByDrillDown: () => Inspection[];
  lookups: typeof inspectionsData.lookups;
}

const initialFilters: InspectionFilterState = {
  inspectionType: '',
  status: '',
  inspector: '',
  zone: '',
  priority: '',
  category: '',
  searchQuery: '',
  slaStatus: '',
  reinspectionRequired: null,
};

const initialDrillDown: InspectionDrillDownState = {
  level: 0,
  type: null,
  value: null,
  breadcrumb: [{ label: 'Overview', type: null, value: null }],
};

const InspectionContext = createContext<InspectionContextType | undefined>(undefined);

export function InspectionProvider({ children }: { children: ReactNode }) {
  const [inspections] = useState<Inspection[]>(inspectionsData.inspections);
  const [filters, setFilters] = useState<InspectionFilterState>(initialFilters);
  const [drillDown, setDrillDown] = useState<InspectionDrillDownState>(initialDrillDown);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const applyFilters = useCallback((data: Inspection[]): Inspection[] => {
    return data.filter(inspection => {
      if (filters.inspectionType && inspection.inspectionType !== filters.inspectionType) return false;
      if (filters.status && inspection.status !== filters.status) return false;
      if (filters.inspector && inspection.inspector !== filters.inspector) return false;
      if (filters.zone && inspection.zone !== filters.zone) return false;
      if (filters.priority && inspection.priority !== filters.priority) return false;
      if (filters.category && inspection.category !== filters.category) return false;
      if (filters.slaStatus && inspection.slaStatus !== filters.slaStatus) return false;
      if (filters.reinspectionRequired !== null && inspection.reinspectionRequired !== filters.reinspectionRequired) return false;
      if (filters.searchQuery && 
          !inspection.inspectionNo.toLowerCase().includes(filters.searchQuery.toLowerCase()) &&
          !inspection.inspector.toLowerCase().includes(filters.searchQuery.toLowerCase()) &&
          !inspection.location.toLowerCase().includes(filters.searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [filters]);

  const filteredInspections = applyFilters(inspections);

  const updateFilter = useCallback(<K extends keyof InspectionFilterState>(key: K, value: InspectionFilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const navigateDrillDown = useCallback((type: InspectionDrillDownState['type'], value: string) => {
    setDrillDown(prev => {
      const newBreadcrumb: BreadcrumbItem[] = [
        ...prev.breadcrumb,
        { label: value, type, value },
      ];
      return {
        level: prev.level + 1,
        type,
        value,
        breadcrumb: newBreadcrumb,
      };
    });
  }, []);

  const goBackDrillDown = useCallback(() => {
    setDrillDown(prev => {
      if (prev.level === 0) return prev;
      const newBreadcrumb = prev.breadcrumb.slice(0, -1);
      const lastItem = newBreadcrumb[newBreadcrumb.length - 1];
      return {
        level: prev.level - 1,
        type: (lastItem?.type as InspectionDrillDownState['type']) || null,
        value: lastItem?.value || null,
        breadcrumb: newBreadcrumb,
      };
    });
  }, []);

  const resetDrillDown = useCallback(() => {
    setDrillDown(initialDrillDown);
  }, []);

  const getFilteredByDrillDown = useCallback((): Inspection[] => {
    let data = filteredInspections;
    
    drillDown.breadcrumb.slice(1).forEach(item => {
      // Skip group-level entries
      if (item.value?.startsWith('_group_')) {
        return;
      }
      
      if (item.type && item.value) {
        data = data.filter(inspection => {
          switch (item.type) {
            case 'inspectionType': return inspection.inspectionType === item.value;
            case 'status': return inspection.status === item.value;
            case 'inspector': return inspection.inspector === item.value;
            case 'zone': return inspection.zone === item.value;
            case 'priority': return inspection.priority === item.value;
            case 'category': return inspection.category === item.value;
            default: return true;
          }
        });
      }
    });
    
    return data;
  }, [filteredInspections, drillDown.breadcrumb]);

  const openInspectionModal = useCallback((inspection: Inspection) => {
    setSelectedInspection(inspection);
    setIsModalOpen(true);
  }, []);

  const closeInspectionModal = useCallback(() => {
    setSelectedInspection(null);
    setIsModalOpen(false);
  }, []);

  return (
    <InspectionContext.Provider
      value={{
        inspections,
        filteredInspections,
        filters,
        drillDown,
        selectedInspection,
        isModalOpen,
        setFilters,
        updateFilter,
        resetFilters,
        navigateDrillDown,
        goBackDrillDown,
        resetDrillDown,
        openInspectionModal,
        closeInspectionModal,
        getFilteredByDrillDown,
        lookups: inspectionsData.lookups,
      }}
    >
      {children}
    </InspectionContext.Provider>
  );
}

export function useInspection() {
  const context = useContext(InspectionContext);
  if (!context) {
    throw new Error('useInspection must be used within an InspectionProvider');
  }
  return context;
}
