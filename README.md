# FlowBoard

Personal project management app with kanban board, dependency graph, timeline, and multiple views. Built for local use on a Mac Mini as a replacement for Obsidian-based task tracking.

## Features

- **5 Board Views** — Kanban, List, Table, Timeline (Gantt), Dependency Graph
- **Drag & Drop** — Move tasks between columns with optimistic updates
- **Task Management** — Subtasks, labels, dependencies, comments, activity log
- **Bulk Actions** — Multi-select with floating action bar (move, priority, delete)
- **Search** — Full-text search via Cmd+K with instant results
- **Dashboard** — Stats, charts (status/priority/type/velocity), overdue tasks, activity feed
- **Obsidian Import** — Preview and import tasks from Obsidian vault YAML frontmatter
- **Export** — JSON/CSV export per board
- **Undo/Redo** — Cmd+Z / Cmd+Shift+Z for task updates
- **Dark/Light Mode** — Semantic tokens with system preference support
- **Keyboard Shortcuts** — Cmd+K (search), Cmd+N (new task), 1-5 (switch view), Esc (close)
- **Responsive** — Mobile sidebar with hamburger menu
- **Accessibility** — Skip link, ARIA labels, prefers-reduced-motion, focus management

## Tech Stack

| Layer          | Technology                             | Version   |
| -------------- | -------------------------------------- | --------- |
| Framework      | Next.js (App Router)                   | 16.2      |
| Language       | TypeScript (strict)                    | 5.9       |
| Database       | SQLite via Prisma + better-sqlite3     | 7.7       |
| UI             | shadcn/ui + Radix UI + Tailwind CSS v4 | latest    |
| Drag & Drop    | @dnd-kit                               | 6.x       |
| Graph          | @xyflow/react                          | 12.x      |
| State (client) | Zustand                                | 5.x       |
| State (server) | TanStack Query                         | 5.x       |
| Charts         | Recharts                               | 3.x       |
| Animations     | Framer Motion                          | 12.x      |
| Testing        | Vitest + Playwright                    | 4.x / 1.x |

## Getting Started

```bash
git clone git@github.com:dougss/flow-board.git
cd flow-board
cp .env.example .env
pnpm install
pnpm db:generate
pnpm db:push
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). On first visit, choose "Load Demo Data" for sample tasks or "Create Empty Project" to start fresh.

## Commands

```bash
# Development
pnpm dev                    # Dev server (port 3000)
pnpm build                  # Production build
pnpm start                  # Start production

# Database
pnpm db:generate            # Regenerate Prisma client
pnpm db:push                # Push schema to DB
pnpm db:migrate             # Run migrations
pnpm db:studio              # Prisma Studio GUI
pnpm db:seed                # Seed demo data

# Quality
pnpm typecheck              # TypeScript check
pnpm lint                   # ESLint

# Tests
pnpm test                   # Unit tests (Vitest)
pnpm test:watch             # Watch mode
pnpm test:cov               # Coverage report
pnpm test:e2e               # E2E tests (Playwright)

# Docker
pnpm docker:build           # Build image
pnpm docker:up              # Start container
pnpm docker:down            # Stop container
```

## Project Structure

```
src/
├── app/
│   ├── (app)/              # Route group with sidebar layout
│   │   ├── board/[boardId] # Kanban board page
│   │   ├── dashboard/      # Analytics dashboard
│   │   ├── import/         # Obsidian import
│   │   └── settings/       # App settings
│   └── api/                # 21 API routes
│       ├── tasks/          # CRUD + reorder + search
│       ├── boards/         # CRUD boards
│       ├── columns/        # CRUD + reorder columns
│       ├── projects/       # CRUD projects
│       ├── workspaces/     # CRUD workspaces
│       ├── export/         # JSON/CSV export
│       ├── assignees/      # Distinct assignee list
│       └── ...             # comments, labels, deps, dashboard, import, seed
├── components/
│   ├── board/              # board-view, column, task-card, bulk-action-bar, settings
│   ├── task/               # task-drawer, properties, subtasks, comments, activity
│   ├── graph/              # dependency graph with @xyflow
│   ├── views/              # list-view, table-view, timeline-view
│   ├── layout/             # sidebar, header, breadcrumbs, keyboard shortcuts
│   ├── filters/            # filter-panel, search-dialog
│   ├── dashboard/          # activity-feed
│   └── ui/                 # 20 shadcn components
├── hooks/                  # use-board, use-task, use-dashboard, use-activity, use-keyboard-shortcuts
├── store/                  # board-store, theme-store, undo-store (Zustand)
├── types/                  # TypeScript interfaces
└── lib/                    # db singleton, utils, query-client
```

## Data Model

```
Workspace → Project → Board → Column → Task
                                         ├── Labels (many-to-many)
                                         ├── Dependencies (self-referential)
                                         ├── Comments
                                         ├── Subtasks (self-referential)
                                         └── Activity Log
```

## Keyboard Shortcuts

| Shortcut    | Action                                            |
| ----------- | ------------------------------------------------- |
| Cmd+K       | Search tasks                                      |
| Cmd+N       | New task                                          |
| Cmd+Z       | Undo                                              |
| Cmd+Shift+Z | Redo                                              |
| Cmd+Shift+D | Toggle theme                                      |
| 1-5         | Switch view (board, list, table, timeline, graph) |
| Esc         | Close dialog / drawer / bulk selection            |

## API Routes

| Route                         | Methods            | Description                    |
| ----------------------------- | ------------------ | ------------------------------ |
| /api/tasks                    | GET, POST          | List/create tasks with filters |
| /api/tasks/[taskId]           | GET, PATCH, DELETE | Task CRUD                      |
| /api/tasks/reorder            | PATCH              | Reorder within/across columns  |
| /api/boards                   | GET, POST          | List/create boards             |
| /api/boards/[boardId]         | GET, PATCH         | Board with columns+tasks       |
| /api/columns                  | POST               | Create column                  |
| /api/columns/[columnId]       | PATCH, DELETE      | Update/delete column           |
| /api/columns/reorder          | PATCH              | Reorder columns                |
| /api/projects                 | GET, POST          | List/create projects           |
| /api/projects/[projectId]     | GET, PATCH, DELETE | Project CRUD                   |
| /api/workspaces               | GET, POST          | List/create workspaces         |
| /api/workspaces/[workspaceId] | GET, PATCH         | Workspace CRUD                 |
| /api/labels                   | GET, POST          | List/create labels             |
| /api/comments                 | POST               | Create comment                 |
| /api/dependencies             | POST, DELETE       | Create/delete dependency       |
| /api/dashboard                | GET                | Dashboard stats                |
| /api/activity                 | GET                | Activity feed                  |
| /api/search                   | GET                | Full-text search               |
| /api/export                   | GET                | Export board (JSON/CSV)        |
| /api/assignees                | GET                | Distinct assignee names        |
| /api/import                   | POST               | Import from Obsidian           |
| /api/import/preview           | POST               | Preview import                 |
| /api/seed                     | POST               | Seed demo data                 |

## Testing

- **24 unit tests** (Vitest): board store, keyboard shortcuts, API routes
- **10 E2E tests** (Playwright): smoke tests + flow tests (task creation, search, view switching, export, settings)
- CI pipeline via GitHub Actions: typecheck, lint, test, e2e

## License

MIT
