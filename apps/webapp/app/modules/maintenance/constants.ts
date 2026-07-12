import type { MaintenanceStatus } from "@assetflow/database";

export const MAINTENANCE_STATUS_LABELS: Record<MaintenanceStatus, string> = {
  PENDING: "Pending Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  TECHNICIAN_ASSIGNED: "Technician Assigned",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
};

export const MAINTENANCE_STATUS_COLORS: Record<
  MaintenanceStatus,
  { bg: string; text: string; border: string }
> = {
  PENDING: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
  },
  APPROVED: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  REJECTED: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
  TECHNICIAN_ASSIGNED: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
  },
  IN_PROGRESS: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
  },
  RESOLVED: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
};

export const MAINTENANCE_PRIORITY_LABELS = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export const MAINTENANCE_PRIORITY_COLORS = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700",
};

/** Ordered kanban columns */
export const MAINTENANCE_KANBAN_COLUMNS: MaintenanceStatus[] = [
  "PENDING",
  "APPROVED",
  "TECHNICIAN_ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
];
