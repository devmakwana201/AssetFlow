import type {
  MaintenancePriority,
  MaintenanceStatus,
} from "@assetflow/database";
import { db } from "~/database/db.server";

/** Get all maintenance requests for an organization (with asset + reporter info) */
export async function getMaintenanceRequests({
  organizationId,
  status,
}: {
  organizationId: string;
  status?: MaintenanceStatus;
}) {
  return db.maintenanceRequest.findMany({
    where: {
      organizationId,
      ...(status ? { status } : {}),
    },
    include: {
      asset: { select: { id: true, title: true, sequentialId: true } },
      reporter: { select: { id: true, name: true } },
      technician: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Get a single maintenance request by ID */
export async function getMaintenanceRequest({
  id,
  organizationId,
}: {
  id: string;
  organizationId: string;
}) {
  return db.maintenanceRequest.findFirst({
    where: { id, organizationId },
    include: {
      asset: {
        select: { id: true, title: true, sequentialId: true, status: true },
      },
      reporter: { select: { id: true, name: true } },
      technician: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
    },
  });
}

/** Create a new maintenance request */
export async function createMaintenanceRequest({
  title,
  description,
  priority,
  assetId,
  reporterId,
  organizationId,
  departmentId,
  photoUrl,
}: {
  title: string;
  description: string;
  priority: MaintenancePriority;
  assetId: string;
  reporterId: string;
  organizationId: string;
  departmentId?: string;
  photoUrl?: string;
}) {
  return db.maintenanceRequest.create({
    data: {
      title,
      description,
      priority,
      assetId,
      reporterId,
      organizationId,
      departmentId,
      photoUrl,
      status: "PENDING",
    },
  });
}

/** Approve a maintenance request + set asset to UNDER_MAINTENANCE */
export async function approveMaintenanceRequest({
  id,
  organizationId,
  reviewNotes,
}: {
  id: string;
  organizationId: string;
  reviewNotes?: string;
}) {
  // Verify org scope first
  const existing = await db.maintenanceRequest.findFirst({
    where: { id, organizationId },
    select: { assetId: true },
  });
  if (!existing) return null;

  const request = await db.maintenanceRequest.update({
    // eslint-disable-next-line local-rules/require-org-scope-on-id-queries -- idor-safe: org scope verified via findFirst above
    where: { id },
    data: { status: "APPROVED", reviewNotes, approvedAt: new Date() },
    select: { assetId: true },
  });

  // Auto-update asset status
  await db.asset.update({
    // eslint-disable-next-line local-rules/require-org-scope-on-id-queries -- idor-safe: assetId comes from org-scoped maintenance request
    where: { id: request.assetId },
    data: { status: "UNDER_MAINTENANCE" },
  });

  return request;
}

/** Reject a maintenance request */
export async function rejectMaintenanceRequest({
  id,
  organizationId,
  reviewNotes,
}: {
  id: string;
  organizationId: string;
  reviewNotes?: string;
}) {
  const existing = await db.maintenanceRequest.findFirst({
    where: { id, organizationId },
    select: { id: true },
  });
  if (!existing) return null;

  return db.maintenanceRequest.update({
    // eslint-disable-next-line local-rules/require-org-scope-on-id-queries -- idor-safe: org scope verified via findFirst above
    where: { id },
    data: { status: "REJECTED", reviewNotes },
  });
}

/** Assign technician */
export async function assignTechnician({
  id,
  organizationId,
  technicianId,
}: {
  id: string;
  organizationId: string;
  technicianId: string;
}) {
  const existing = await db.maintenanceRequest.findFirst({
    where: { id, organizationId },
    select: { id: true },
  });
  if (!existing) return null;

  return db.maintenanceRequest.update({
    // eslint-disable-next-line local-rules/require-org-scope-on-id-queries -- idor-safe: org scope verified via findFirst above
    where: { id },
    data: { status: "TECHNICIAN_ASSIGNED", technicianId },
  });
}

/** Mark as in-progress */
export async function markInProgress({
  id,
  organizationId,
}: {
  id: string;
  organizationId: string;
}) {
  const existing = await db.maintenanceRequest.findFirst({
    where: { id, organizationId },
    select: { id: true },
  });
  if (!existing) return null;

  return db.maintenanceRequest.update({
    // eslint-disable-next-line local-rules/require-org-scope-on-id-queries -- idor-safe: org scope verified via findFirst above
    where: { id },
    data: { status: "IN_PROGRESS" },
  });
}

/** Resolve a maintenance request + revert asset to AVAILABLE */
export async function resolveMaintenanceRequest({
  id,
  organizationId,
  resolutionNotes,
}: {
  id: string;
  organizationId: string;
  resolutionNotes?: string;
}) {
  const existing = await db.maintenanceRequest.findFirst({
    where: { id, organizationId },
    select: { assetId: true },
  });
  if (!existing) return null;

  const request = await db.maintenanceRequest.update({
    // eslint-disable-next-line local-rules/require-org-scope-on-id-queries -- idor-safe: org scope verified via findFirst above
    where: { id },
    data: { status: "RESOLVED", resolutionNotes, resolvedAt: new Date() },
    select: { assetId: true },
  });

  // Auto-revert asset status back to AVAILABLE
  await db.asset.update({
    // eslint-disable-next-line local-rules/require-org-scope-on-id-queries -- idor-safe: assetId comes from org-scoped maintenance request
    where: { id: request.assetId },
    data: { status: "AVAILABLE" },
  });

  return request;
}
