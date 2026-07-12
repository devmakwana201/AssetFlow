import {
  data,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "react-router";
import { Form, useLoaderData } from "react-router";
import { db } from "~/database/db.server";
import { MAINTENANCE_PRIORITY_LABELS } from "~/modules/maintenance/constants";
import { createMaintenanceRequest } from "~/modules/maintenance/service.server";
import { getSelectedOrganization } from "~/modules/organization/context.server";
import { makeShelfError } from "~/utils/error";

export const meta: MetaFunction = () => [
  { title: "Raise Maintenance Request | AssetFlow" },
];

export async function loader({ context, request }: LoaderFunctionArgs) {
  const authSession = context.getSession();
  const { userId } = authSession;

  try {
    const { organizationId } = await getSelectedOrganization({
      userId,
      request,
    });

    const [assets, teamMember] = await Promise.all([
      db.asset.findMany({
        where: {
          organizationId,
          status: { notIn: ["UNDER_MAINTENANCE", "RETIRED", "DISPOSED"] },
        },
        select: { id: true, title: true, sequentialId: true, status: true },
        orderBy: { title: "asc" },
        take: 200,
      }),
      db.teamMember.findFirst({
        where: { organizationId, userId },
        select: { id: true, name: true },
      }),
    ]);

    return data({ assets, teamMember });
  } catch (cause) {
    throw makeShelfError(cause, { userId });
  }
}

export async function action({ context, request }: ActionFunctionArgs) {
  const authSession = context.getSession();
  const { userId } = authSession;
  const { organizationId } = await getSelectedOrganization({ userId, request });

  const formData = await request.formData();
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const priority = (formData.get("priority") as string) ?? "MEDIUM";
  const assetId = formData.get("assetId") as string;

  if (!title || !description || !assetId) {
    return data(
      { error: "Please fill in all required fields." },
      { status: 400 },
    );
  }

  const teamMember = await db.teamMember.findFirst({
    where: { organizationId, userId: authSession.userId },
    select: { id: true },
  });

  if (!teamMember) {
    return data({ error: "Team member not found." }, { status: 400 });
  }

  await createMaintenanceRequest({
    title,
    description,
    priority: priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    assetId,
    reporterId: teamMember.id,
    organizationId,
  });

  return redirect("/maintenance");
}

export default function NewMaintenanceRequestPage() {
  const { assets, teamMember } = useLoaderData<typeof loader>();

  return (
    <div className="mx-auto max-w-2xl p-6">
      {/* Header */}
      <div className="mb-6">
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
        <h1 className="text-2xl font-bold text-gray-900">
          Raise Maintenance Request
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Reported by:{" "}
          <span className="font-medium">{teamMember?.name ?? "You"}</span>
        </p>
      </div>

      <Form method="post" className="flex flex-col gap-5">
        {/* Asset select */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="assetId"
            className="text-sm font-medium text-gray-700"
          >
            Asset <span className="text-red-500">*</span>
          </label>
          <select
            id="assetId"
            name="assetId"
            required
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">Select an asset…</option>
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.title}
                {asset.sequentialId ? ` (${asset.sequentialId})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="title" className="text-sm font-medium text-gray-700">
            Issue Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder="e.g. Projector bulb not working"
            className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="description"
            className="text-sm font-medium text-gray-700"
          >
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            required
            placeholder="Describe the issue in detail…"
            className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        {/* Priority */}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-gray-700">Priority</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((p) => (
              <label
                key={p}
                htmlFor={`priority-${p}`}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50 hover:border-primary-300"
              >
                <input
                  id={`priority-${p}`}
                  type="radio"
                  name="priority"
                  value={p}
                  defaultChecked={p === "MEDIUM"}
                  className="accent-primary-600"
                />
                <span className="text-sm font-medium">
                  {MAINTENANCE_PRIORITY_LABELS[p]}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Submit Request
          </button>
          <a
            href="/maintenance"
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancel
          </a>
        </div>
      </Form>
    </div>
  );
}
