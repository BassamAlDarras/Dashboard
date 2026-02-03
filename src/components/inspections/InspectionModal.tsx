'use client';

import { X, ClipboardCheck, MapPin, User, Calendar, AlertTriangle, Award, Clock, FileText, BadgeCheck, RefreshCw } from 'lucide-react';
import { useInspection } from '@/context/InspectionContext';
import { formatDate } from '@/lib/utils';

export default function InspectionModal() {
  const { selectedInspection, closeInspectionModal } = useInspection();

  if (!selectedInspection) return null;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Completed': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'Pending': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      'In Progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'Scheduled': 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
      'Failed': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      'Cancelled': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    };
    return colors[status] || colors['Pending'];
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'High': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      'Medium': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      'Low': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    };
    return colors[priority] || colors['Medium'];
  };

  const getSlaColor = (sla: string) => {
    const colors: Record<string, string> = {
      'On Track': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'At Risk': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      'Breached': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[sla] || colors['On Track'];
  };

  const getComplianceColor = (score: number | null) => {
    if (score === null) return 'text-gray-400';
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={closeInspectionModal}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-3xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden transform transition-all">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <ClipboardCheck className="w-6 h-6" />
                  <h2 className="text-xl font-bold">{selectedInspection.inspectionNo}</h2>
                </div>
                <p className="text-blue-100 text-sm">{selectedInspection.inspectionType}</p>
              </div>
              <button
                onClick={closeInspectionModal}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Status Badges */}
            <div className="flex flex-wrap gap-3">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(selectedInspection.status)}`}>
                {selectedInspection.status}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${getPriorityColor(selectedInspection.priority)}`}>
                <AlertTriangle className="w-3.5 h-3.5" />
                {selectedInspection.priority} Priority
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${getSlaColor(selectedInspection.slaStatus)}`}>
                <Clock className="w-3.5 h-3.5" />
                SLA: {selectedInspection.slaStatus}
              </span>
              {selectedInspection.reinspectionRequired && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reinspection Required
                </span>
              )}
            </div>

            {/* KPIs Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
                <Award className={`w-6 h-6 mx-auto mb-2 ${getComplianceColor(selectedInspection.complianceScore)}`} />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedInspection.complianceScore !== null ? `${selectedInspection.complianceScore}%` : 'N/A'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Compliance Score</p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
                <Clock className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedInspection.duration !== null ? `${selectedInspection.duration}m` : 'N/A'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
                <BadgeCheck className="w-6 h-6 mx-auto mb-2 text-violet-500" />
                <p className="text-lg font-bold text-gray-900 dark:text-white truncate">{selectedInspection.category}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Category</p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
                <MapPin className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
                <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedInspection.zone}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Zone</p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Inspection Details</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedInspection.location}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Inspector</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedInspection.inspector}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Created By</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedInspection.createdBy}</p>
                    </div>
                  </div>
                  {selectedInspection.relatedPermitNo && (
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Related Permit</p>
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{selectedInspection.relatedPermitNo}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Schedule</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Scheduled Date</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(selectedInspection.scheduledDate)}</p>
                    </div>
                  </div>
                  {selectedInspection.completedDate && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Completed Date</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(selectedInspection.completedDate)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Findings */}
            {selectedInspection.findings && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Findings</h4>
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-100 dark:border-amber-800">
                  <p className="text-sm text-amber-900 dark:text-amber-200">{selectedInspection.findings}</p>
                </div>
              </div>
            )}

            {/* Supervisor Remarks */}
            {selectedInspection.supervisorRemarks && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Supervisor Remarks</h4>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
                  <p className="text-sm text-blue-900 dark:text-blue-200">{selectedInspection.supervisorRemarks}</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-slate-700/50 px-6 py-4 flex justify-end gap-3">
            <button
              onClick={closeInspectionModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
