import type { LoaderFunctionArgs } from "react-router";
import { data, type MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import {
  MAINTENANCE_KANBAN_COLUMNS,
  MAINTENANCE_STATUS_LABELS,
  MAINTENANCE_STATUS_COLORS,
  MAINTENANCE_PRIORITY_COLORS,
  MAINTENANCE_PRIORITY_LABELS,
} from "~/modules/maintenance/constants";
import { getMaintenanceRequests } from "~/modules/maintenance/service.server";
import { getSelectedOrganization } from "~/modules/organization/context.server";
import { makeShelfError } from "~/utils/error";

export const meta: MetaFunction = () => [{ title: "Maintenance | AssetFlow" }];

export async function loader({ context, request }: LoaderFunctionArgs) {
  const authSession = context.getSession();
  const { userId } = authSession;

  try {
    const { organizationId } = await getSelectedOrganization({
      userId,
      request,
    });
    const requests = await getMaintenanceRequests({ organizationId });
    return data({ requests });
  } catch (cause) {
    throw makeShelfError(cause, { userId });
  }
}

export default function MaintenanceIndexPage() {
  const { requests } = useLoaderData<typeof loader>();

  const byStatus = MAINTENANCE_KANBAN_COLUMNS.reduce(
    (acc, col) => {
      acc[col] = requests.filter((r) => r.status === col);
      return acc;
    },
    {} as Record<string, typeof requests>,
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Maintenance Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Track and manage maintenance requests across all assets
          </p>
        </div>
        <a
          href="/maintenance/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Raise Request
        </a>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {MAINTENANCE_KANBAN_COLUMNS.map((col) => {
          const colors = MAINTENANCE_STATUS_COLORS[col];
          return (
            <div
              key={col}
              className={`rounded-lg border p-3 ${colors.bg} ${colors.border} border`}
            >
              <p className={`text-xs font-medium ${colors.text}`}>
                {MAINTENANCE_STATUS_LABELS[col]}
              </p>
              <p className={`mt-1 text-2xl font-bold ${colors.text}`}>
                {byStatus[col]?.length ?? 0}
              </p>
            </div>
          );
        })}
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {MAINTENANCE_KANBAN_COLUMNS.map((col) => {
          const colors = MAINTENANCE_STATUS_COLORS[col];
          const cards = byStatus[col] ?? [];

          return (
            <div key={col} className="flex w-72 shrink-0 flex-col gap-2">
              {/* Column header */}
              <div
                className={`flex items-center justify-between rounded-lg border px-3 py-2 ${colors.bg} ${colors.border} border`}
              >
                <span className={`text-sm font-semibold ${colors.text}`}>
                  {MAINTENANCE_STATUS_LABELS[col]}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${colors.bg} ${colors.text}`}
                >
                  {cards.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2">
                {cards.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-200 p-4 text-center text-sm text-gray-400">
                    No requests
                  </div>
                ) : (
                  cards.map((req) => {
                    const priorityColor =
                      MAINTENANCE_PRIORITY_COLORS[
                        req.priority as keyof typeof MAINTENANCE_PRIORITY_COLORS
                      ];
                    return (
                      <a
                        key={req.id}
                        href={`/maintenance/${req.id}`}
                        className="group flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all hover:border-primary-300 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="line-clamp-2 text-sm font-medium text-gray-900 group-hover:text-primary-700">
                            {req.title}
                          </p>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${priorityColor}`}
                          >
                            {
                              MAINTENANCE_PRIORITY_LABELS[
                                req.priority as keyof typeof MAINTENANCE_PRIORITY_LABELS
                              ]
                            }
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <svg
                            className="size-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"
                            />
                          </svg>
                          <span className="truncate">{req.asset.title}</span>
                          {req.asset.sequentialId && (
                            <span className="text-gray-400">
                              · {req.asset.sequentialId}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>By {req.reporter.name}</span>
                          <span>
                            {new Date(req.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {req.technician && (
                          <div className="rounded bg-gray-50 px-2 py-1 text-xs text-gray-600">
                            🔧 {req.technician.name}
                          </div>
                        )}
                      </a>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
