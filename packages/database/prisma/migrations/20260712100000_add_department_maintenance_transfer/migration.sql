-- AssetFlow: Add Department, MaintenanceRequest, TransferRequest models
-- And extend AssetStatus enum with new lifecycle states

-- 1. Extend AssetStatus enum
ALTER TYPE "AssetStatus" ADD VALUE IF NOT EXISTS 'ALLOCATED';
ALTER TYPE "AssetStatus" ADD VALUE IF NOT EXISTS 'UNDER_MAINTENANCE';
ALTER TYPE "AssetStatus" ADD VALUE IF NOT EXISTS 'LOST';
ALTER TYPE "AssetStatus" ADD VALUE IF NOT EXISTS 'RETIRED';
ALTER TYPE "AssetStatus" ADD VALUE IF NOT EXISTS 'DISPOSED';
ALTER TYPE "AssetStatus" ADD VALUE IF NOT EXISTS 'RESERVED';

-- 2. New enums
DO $$ BEGIN
  CREATE TYPE "MaintenancePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "MaintenanceStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'TECHNICIAN_ASSIGNED', 'IN_PROGRESS', 'RESOLVED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. Department table
CREATE TABLE IF NOT EXISTS "Department" (
  "id"             TEXT NOT NULL,
  "name"           TEXT NOT NULL,
  "description"    TEXT,
  "isActive"       BOOLEAN NOT NULL DEFAULT true,
  "organizationId" TEXT NOT NULL,
  "headMemberId"   TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Department" ADD CONSTRAINT "Department_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Department" ADD CONSTRAINT "Department_headMemberId_fkey"
  FOREIGN KEY ("headMemberId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Department_organizationId_idx" ON "Department"("organizationId");
CREATE INDEX IF NOT EXISTS "Department_headMemberId_idx" ON "Department"("headMemberId");

-- 4. Add departmentId to TeamMember
ALTER TABLE "TeamMember" ADD COLUMN IF NOT EXISTS "departmentId" TEXT;
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_departmentId_fkey"
  FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "TeamMember_departmentId_idx" ON "TeamMember"("departmentId");

-- 5. MaintenanceRequest table
CREATE TABLE IF NOT EXISTS "MaintenanceRequest" (
  "id"              TEXT NOT NULL,
  "title"           TEXT NOT NULL,
  "description"     TEXT NOT NULL,
  "priority"        "MaintenancePriority" NOT NULL DEFAULT 'MEDIUM',
  "status"          "MaintenanceStatus"   NOT NULL DEFAULT 'PENDING',
  "photoUrl"        TEXT,
  "reviewNotes"     TEXT,
  "resolutionNotes" TEXT,
  "assetId"         TEXT NOT NULL,
  "organizationId"  TEXT NOT NULL,
  "departmentId"    TEXT,
  "reporterId"      TEXT NOT NULL,
  "technicianId"    TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  "approvedAt"      TIMESTAMP(3),
  "resolvedAt"      TIMESTAMP(3),
  CONSTRAINT "MaintenanceRequest_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_assetId_fkey"
  FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_departmentId_fkey"
  FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_reporterId_fkey"
  FOREIGN KEY ("reporterId") REFERENCES "TeamMember"("id") ON UPDATE CASCADE;
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_technicianId_fkey"
  FOREIGN KEY ("technicianId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "MaintenanceRequest_organizationId_idx"        ON "MaintenanceRequest"("organizationId");
CREATE INDEX IF NOT EXISTS "MaintenanceRequest_assetId_idx"               ON "MaintenanceRequest"("assetId");
CREATE INDEX IF NOT EXISTS "MaintenanceRequest_reporterId_idx"            ON "MaintenanceRequest"("reporterId");
CREATE INDEX IF NOT EXISTS "MaintenanceRequest_technicianId_idx"          ON "MaintenanceRequest"("technicianId");
CREATE INDEX IF NOT EXISTS "MaintenanceRequest_departmentId_idx"          ON "MaintenanceRequest"("departmentId");
CREATE INDEX IF NOT EXISTS "MaintenanceRequest_status_organizationId_idx" ON "MaintenanceRequest"("status", "organizationId");

-- 6. TransferRequest table
CREATE TABLE IF NOT EXISTS "TransferRequest" (
  "id"             TEXT NOT NULL,
  "status"         "TransferStatus" NOT NULL DEFAULT 'PENDING',
  "reason"         TEXT,
  "reviewNotes"    TEXT,
  "assetId"        TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "fromMemberId"   TEXT NOT NULL,
  "toMemberId"     TEXT NOT NULL,
  "approverId"     TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  "completedAt"    TIMESTAMP(3),
  CONSTRAINT "TransferRequest_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "TransferRequest" ADD CONSTRAINT "TransferRequest_assetId_fkey"
  FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TransferRequest" ADD CONSTRAINT "TransferRequest_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TransferRequest" ADD CONSTRAINT "TransferRequest_fromMemberId_fkey"
  FOREIGN KEY ("fromMemberId") REFERENCES "TeamMember"("id") ON UPDATE CASCADE;
ALTER TABLE "TransferRequest" ADD CONSTRAINT "TransferRequest_toMemberId_fkey"
  FOREIGN KEY ("toMemberId") REFERENCES "TeamMember"("id") ON UPDATE CASCADE;
ALTER TABLE "TransferRequest" ADD CONSTRAINT "TransferRequest_approverId_fkey"
  FOREIGN KEY ("approverId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "TransferRequest_organizationId_idx"        ON "TransferRequest"("organizationId");
CREATE INDEX IF NOT EXISTS "TransferRequest_assetId_idx"               ON "TransferRequest"("assetId");
CREATE INDEX IF NOT EXISTS "TransferRequest_fromMemberId_idx"          ON "TransferRequest"("fromMemberId");
CREATE INDEX IF NOT EXISTS "TransferRequest_toMemberId_idx"            ON "TransferRequest"("toMemberId");
CREATE INDEX IF NOT EXISTS "TransferRequest_status_organizationId_idx" ON "TransferRequest"("status", "organizationId");
