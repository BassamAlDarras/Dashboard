export interface Permit {
  id: number;
  requestNo: string;
  serviceType: string;
  location: string;
  currentStatus: string;
  serviceSLA: string;
  remainingTime: string;
  finalEmployee: string;
  finalRemarks: string;
  creationDate: string;
  updatedDate: string;
  status: 'Opened' | 'Closed';
  owner: string;
  permitCategory: string;
  priority: 'High' | 'Medium' | 'Low';
  zone: string;
}

export interface PermitData {
  metadata: {
    lastUpdated: string;
    totalRecords: number;
    dataSource: string;
  };
  permits: Permit[];
  lookups: {
    serviceTypes: string[];
    statuses: string[];
    categories: string[];
    priorities: string[];
    zones: string[];
  };
}

export interface ChartDataItem {
  name: string;
  value: number;
  color: string;
  percentage?: number;
}

export interface DrillDownState {
  level: number;
  type: 'serviceType' | 'status' | 'owner' | 'zone' | 'priority' | null;
  value: string | null;
  parentType?: string;
  parentValue?: string;
  breadcrumb: BreadcrumbItem[];
  groupByLevels?: Array<'serviceType' | 'status' | 'owner' | 'zone' | 'priority'>;
}

export interface BreadcrumbItem {
  label: string;
  type: string | null;
  value: string | null;
}

export interface FilterState {
  serviceType: string;
  status: string;
  owner: string;
  zone: string;
  priority: string;
  search: string;
}

export interface KPIData {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  opened: number;
  closed: number;
}

export type SortDirection = 'asc' | 'desc' | null;

export interface SortState {
  column: keyof Permit | null;
  direction: SortDirection;
}

// Inspection Types
export interface Inspection {
  id: number;
  inspectionNo: string;
  inspectionType: string;
  location: string;
  status: 'Completed' | 'Pending' | 'In Progress' | 'Scheduled' | 'Failed' | 'Cancelled';
  scheduledDate: string;
  completedDate: string | null;
  inspector: string;
  supervisorRemarks: string;
  findings: string | null;
  complianceScore: number | null;
  priority: 'High' | 'Medium' | 'Low';
  zone: string;
  category: string;
  createdBy: string;
  relatedPermitNo: string | null;
  reinspectionRequired: boolean;
  slaStatus: 'Within SLA' | 'SLA Breached' | 'N/A';
  duration: number | null; // in minutes
}

export interface InspectionDrillDownState {
  level: number;
  type: 'inspectionType' | 'status' | 'inspector' | 'zone' | 'priority' | 'category' | null;
  value: string | null;
  breadcrumb: BreadcrumbItem[];
  groupByLevels?: Array<'inspectionType' | 'status' | 'inspector' | 'zone' | 'priority' | 'category'>;
}

export interface InspectionFilterState {
  inspectionType: string;
  status: string;
  inspector: string;
  zone: string;
  priority: string;
  category: string;
  searchQuery: string;
  slaStatus: string;
  reinspectionRequired: boolean | null;
}

export interface InspectionKPIData {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
  failed: number;
  scheduled: number;
  avgComplianceScore: number;
  slaCompliance: number;
}

export type DashboardTab = 'permits' | 'inspections';

