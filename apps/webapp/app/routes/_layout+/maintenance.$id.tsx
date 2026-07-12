import {
  data,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "react-router";
import { Form, useLoaderData } from "react-router";

import { db } from "~/database/db.server";
import {
  MAINTENANCE_STATUS_LABELS,
  MAINTENANCE_STATUS_COLORS,
  MAINTENANCE_PRIORITY_LABELS,
  MAINTENANCE_PRIORITY_COLORS,
} from "~/modules/maintenance/constants";
import {
  getMaintenanceRequest,
  approveMaintenanceRequest,
  rejectMaintenanceRequest,
  assignTechnician,
  markInProgress,
  resolveMaintenanceRequest,
} from "~/modules/maintenance/service.server";
import { getSelectedOrganization } from "~/modules/organization/context.server";
import { ShelfError, makeShelfError } from "~/utils/error";

export const meta: MetaFunction = () => [
  { title: "Maintenance Request | AssetFlow" },
];

export async function loader({ context, request, params }: LoaderFunctionArgs) {
  const authSession = context.getSession();
  const { userId } = authSession;

  try {
    const { organizationId } = await getSelectedOrganization({
      userId,
      request,
    });

    const req = await getMaintenanceRequest({ id: params.id!, organizationId });
    if (!req)
      throw new ShelfError({
        cause: null,
        message: "Maintenance request not found",
        status: 404,
        label: "Maintenance",
        shouldBeCaptured: false,
      });

    const teamMembers = await db.teamMember.findMany({
      where: { organizationId, deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return data({ req, teamMembers });
  } catch (cause) {
    throw makeShelfError(cause, { userId });
  }
}

export async function action({ context, request, params }: ActionFunctionArgs) {
  const authSession = context.getSession();
  const { userId } = authSession;
  const { organizationId } = await getSelectedOrganization({ userId, request });

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  try {
    switch (intent) {
      case "approve":
        await approveMaintenanceRequest({
          id: params.id!,
          organizationId,
          reviewNotes: formData.get("reviewNotes") as string | undefined,
        });
        break;
      case "reject":
        await rejectMaintenanceRequest({
          id: params.id!,
          organizationId,
          reviewNotes: formData.get("reviewNotes") as string | undefined,
        });
        break;
      case "assignTechnician":
        await assignTechnician({
          id: params.id!,
          organizationId,
          technicianId: formData.get("technicianId") as string,
        });
        break;
      case "markInProgress":
        await markInProgress({ id: params.id!, organizationId });
        break;
      case "resolve":
        await resolveMaintenanceRequest({
          id: params.id!,
          organizationId,
          resolutionNotes: formData.get("resolutionNotes") as
            | string
            | undefined,
        });
        break;
      default:
        throw new Error("Unknown intent");
    }
  } catch (cause) {
    throw makeShelfError(cause);
  }

  return redirect(`/maintenance/${params.id}`);
}

export default function MaintenanceOverviewPage() {
  const { req, teamMembers } = useLoaderData<typeof loader>();
  const statusColors = MAINTENANCE_STATUS_COLORS[req.status];
  const priorityColor =
    MAINTENANCE_PRIORITY_COLORS[
      req.priority as keyof typeof MAINTENANCE_PRIORITY_COLORS
    ];

  const canApprove = req.status === "PENDING";
  const canAssign = req.status === "APPROVED";
  const canMarkInProgress = req.status === "TECHNICIAN_ASSIGNED";
  const canResolve =
    req.status === "IN_PROGRESS" || req.status === "TECHNICIAN_ASSIGNED";

  return (
    <div className="mx-auto max-w-2xl p-6">
      <a
        href="/maintenance"
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <svg
          className="size-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Maintenance
      </a>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Status banner */}
        <div
          className={`px-6 py-3 ${statusColors.bg} ${statusColors.border} flex items-center justify-between border-b`}
        >
          <span className={`text-sm font-semibold ${statusColors.text}`}>
            {MAINTENANCE_STATUS_LABELS[req.status]}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityColor}`}
          >
            {
              MAINTENANCE_PRIORITY_LABELS[
                req.priority as keyof typeof MAINTENANCE_PRIORITY_LABELS
              ]
            }{" "}
            Priority
          </span>
        </div>

        <div className="flex flex-col gap-5 p-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{req.title}</h1>
            <p className="mt-1 text-sm text-gray-600">{req.description}</p>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4 text-sm">
            <div>
              <p className="text-xs text-gray-500">Asset</p>
              <a
                href={`/assets/${req.asset.id}`}
                className="font-medium text-primary-600 hover:underline"
              >
                {req.asset.title}
                {req.asset.sequentialId && (
                  <span className="ml-1 text-gray-400">
                    ({req.asset.sequentialId})
                  </span>
                )}
              </a>
            </div>
            <div>
              <p className="text-xs text-gray-500">Reported by</p>
              <p className="font-medium">{req.reporter.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Created</p>
              <p className="font-medium">
                {new Date(req.createdAt).toLocaleDateString()}
              </p>
            </div>
            {req.technician && (
              <div>
                <p className="text-xs text-gray-500">Technician</p>
                <p className="font-medium">{req.technician.name}</p>
              </div>
            )}
            {req.department && (
              <div>
                <p className="text-xs text-gray-500">Department</p>
                <p className="font-medium">{req.department.name}</p>
              </div>
            )}
          </div>

          {req.reviewNotes && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
              <p className="text-xs font-medium text-blue-700">Review Notes</p>
              <p className="mt-1 text-sm text-blue-800">{req.reviewNotes}</p>
            </div>
          )}

          {req.resolutionNotes && (
            <div className="rounded-lg border border-green-100 bg-green-50 p-3">
              <p className="text-xs font-medium text-green-700">
                Resolution Notes
              </p>
              <p className="mt-1 text-sm text-green-800">
                {req.resolutionNotes}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 border-t border-gray-100 pt-4">
            {canApprove && (
              <div className="flex flex-col gap-2">
                <Form method="post" className="flex flex-col gap-2">
                  <textarea
                    name="reviewNotes"
                    rows={2}
                    placeholder="Add review notes (optional)…"
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                  <div className="flex gap-2">
                    <button
                      name="intent"
                      value="approve"
                      className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                    >
                      ✓ Approve
                    </button>
                    <button
                      name="intent"
                      value="reject"
                      className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                    >
                      ✗ Reject
                    </button>
                  </div>
                </Form>
              </div>
            )}

            {canAssign && (
              <Form method="post" className="flex gap-2">
                <select
                  name="technicianId"
                  required
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">Assign technician…</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <button
                  name="intent"
                  value="assignTechnician"
                  className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700"
                >
                  Assign
                </button>
              </Form>
            )}

            {canMarkInProgress && (
              <Form method="post">
                <button
                  name="intent"
                  value="markInProgress"
                  className="w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
                >
                  Mark In Progress
                </button>
              </Form>
            )}

            {canResolve && (
              <Form method="post" className="flex flex-col gap-2">
                <textarea
                  name="resolutionNotes"
                  rows={2}
                  required
                  placeholder="Describe what was done to resolve the issue…"
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <button
                  name="intent"
                  value="resolve"
                  className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                >
                  ✓ Mark Resolved — Asset returns to Available
                </button>
              </Form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
