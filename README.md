# AssetFlow

**Enterprise Asset & Resource Management System**

AssetFlow is a platform to simplify and digitize how organizations track, allocate, and maintain their physical assets and shared resources through a centralized ERP platform.

---

## Overview

AssetFlow reduces manual tracking inefficiencies (spreadsheets, paper logs) by enabling structured asset lifecycles, centralized resource booking, and real-time visibility into who holds what, where it is, and its condition.

## Features

- **Asset Registration & Directory** — Register assets with auto-generated tags (AF-0001), lifecycle tracking (Available → Allocated → Maintenance → Retired), QR code support
- **Asset Allocation & Transfer** — Allocate assets to employees/departments with conflict prevention and transfer request workflows
- **Resource Booking** — Time-slot booking of shared resources (rooms, vehicles, equipment) with overlap validation
- **Maintenance Management** — Approval workflow: Pending → Approved → Technician Assigned → In Progress → Resolved
- **Asset Audit** — Structured audit cycles with auto-generated discrepancy reports
- **Reports & Analytics** — Utilization trends, maintenance frequency, department-wise allocation summary, booking heatmap
- **Activity Logs & Notifications** — Real-time notifications for assignments, approvals, overdue returns, and audit flags
- **Role-based Access** — Admin, Asset Manager, Department Head, Employee roles with granular permissions

## Tech Stack

| Layer      | Technology                                                                      |
| ---------- | ------------------------------------------------------------------------------- |
| Framework  | [React Router](https://reactrouter.com/) 7 (React 19)                           |
| Language   | [TypeScript](https://www.typescriptlang.org/) 5                                 |
| Database   | [PostgreSQL](https://www.postgresql.org/) via [Supabase](https://supabase.com/) |
| ORM        | [Prisma](https://www.prisma.io/) 6                                              |
| Styling    | [Tailwind CSS](https://tailwindcss.com/) 3                                      |
| Components | [Radix UI](https://www.radix-ui.com/) primitives                                |
| Auth       | [Supabase Auth](https://supabase.com/docs/guides/auth)                          |
| Build      | [Vite](https://vite.dev/) 7, [Turborepo](https://turbo.build/)                  |
| Testing    | [Vitest](https://vitest.dev/)                                                   |

## Project Structure

```
AssetFlow/
├── apps/
│   ├── webapp/          # Main application (React Router + Hono)
│   │   ├── app/
│   │   │   ├── routes/      # File-based routing
│   │   │   ├── modules/     # Business logic
│   │   │   ├── components/  # React components
│   │   │   └── utils/       # Shared utilities
│   │   └── public/          # Static assets
│   └── docs/            # Documentation
├── packages/
│   └── database/        # Prisma schema, migrations, client
└── tooling/
    └── typescript/      # Shared TypeScript config
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 22.20.0
- [pnpm](https://pnpm.io/) >= 9.15.4
- A [Supabase](https://supabase.com/) project (free tier works)

### Setup

```bash
# Clone the repository
git clone https://github.com/devmakwana201/AssetFlow.git
cd AssetFlow

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env
```

Edit `.env` with your Supabase credentials and other configuration.

```bash
# Generate Prisma client and run migrations
pnpm webapp:setup

# Start development server
pnpm webapp:dev
```

The app runs at `https://localhost:3000`.

## Commands

| Command                     | Description                             |
| --------------------------- | --------------------------------------- |
| `pnpm webapp:dev`           | Start development server                |
| `pnpm webapp:build`         | Production build                        |
| `pnpm webapp:test`          | Run tests (Vitest)                      |
| `pnpm webapp:validate`      | Lint + typecheck + test                 |
| `pnpm webapp:setup`         | Generate Prisma client + run migrations |
| `pnpm db:prepare-migration` | Create a new database migration         |
| `pnpm db:deploy-migration`  | Apply pending migrations                |
| `pnpm db:reset`             | Reset database (destructive)            |

## User Roles

| Role              | Capabilities                                                               |
| ----------------- | -------------------------------------------------------------------------- |
| **Admin**         | Manages departments, categories, audit cycles, employee/role assignment    |
| **Asset Manager** | Registers & allocates assets, approves transfers, maintenance, returns     |
| **Dept. Head**    | Views department assets, approves allocation/transfers, books resources    |
| **Employee**      | Views own assets, books resources, raises maintenance, initiates transfers |
