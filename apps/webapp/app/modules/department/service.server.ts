import { db } from "~/database/db.server";

/** Get all departments for an organization */
export async function getDepartments({
  organizationId,
}: {
  organizationId: string;
}) {
  return db.department.findMany({
    where: { organizationId, isActive: true },
    include: {
      headMember: { select: { id: true, name: true } },
      _count: { select: { members: true } },
    },
    orderBy: { name: "asc" },
  });
}

/** Create department */
export async function createDepartment({
  name,
  description,
  organizationId,
  headMemberId,
}: {
  name: string;
  description?: string;
  organizationId: string;
  headMemberId?: string;
}) {
  return db.department.create({
    data: { name, description, organizationId, headMemberId },
  });
}

/** Update department — scoped to organizationId to prevent cross-org writes */
export async function updateDepartment({
  id,
  organizationId,
  name,
  description,
  headMemberId,
  isActive,
}: {
  id: string;
  organizationId: string;
  name?: string;
  description?: string;
  headMemberId?: string | null;
  isActive?: boolean;
}) {
  return db.department.updateMany({
    where: { id, organizationId },
    data: { name, description, headMemberId, isActive },
  });
}

/** Assign team member to a department within the same organization */
export async function assignMemberToDepartment({
  memberId,
  organizationId,
  departmentId,
}: {
  memberId: string;
  organizationId: string;
  departmentId: string | null;
}) {
  return db.teamMember.updateMany({
    where: { id: memberId, organizationId },
    data: { departmentId },
  });
}
