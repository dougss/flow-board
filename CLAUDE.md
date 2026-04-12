# FlowBoard — Project Management App

> App pessoal de gestao de projetos e demandas, rodando localmente no Mac Mini. Substitui o tracking via Obsidian vault com UI rica, graph kanban view, e multiplas visualizacoes.

**Repo**: https://github.com/dougss/flow-board

## Stack

| Camada          | Tecnologia                           | Versao     |
| --------------- | ------------------------------------ | ---------- |
| Framework       | Next.js (App Router)                 | 16.2       |
| Language        | TypeScript (strict)                  | 5.9        |
| Runtime         | Node.js                              | 22 LTS     |
| Package Manager | **pnpm**                             | 10.x       |
| Database        | SQLite via Prisma 7 + better-sqlite3 | 7.7        |
| UI Components   | shadcn/ui (manual) + Radix UI        | latest     |
| Styling         | Tailwind CSS                         | v4         |
| DnD             | @dnd-kit/core + @dnd-kit/sortable    | 6.x / 10.x |
| Graph           | @xyflow/react (ReactFlow)            | 12.x       |
| State (client)  | Zustand                              | 5.x        |
| State (server)  | TanStack Query                       | 5.x        |
| Charts          | Recharts                             | 3.x        |
| Validation      | Zod                                  | 4.x        |
| Icons           | Lucide React                         | 1.x        |
| Toast           | Sonner                               | 2.x        |
| Dates           | date-fns                             | 4.x        |
| Animations      | Framer Motion                        | 12.x       |
| Testing         | Vitest + Playwright                  | 4.x / 1.x  |

## Arquitetura

### Estrutura de Pastas

```
src/
├── app/
│   ├── (app)/                  # Route group — layout com sidebar
│   │   ├── board/[boardId]/    # Pagina do board (Server Component)
│   │   ├── dashboard/          # Dashboard com metricas
│   │   ├── import/             # Import do Obsidian
│   │   ├── settings/           # Configuracoes (theme, shortcuts)
│   │   ├── create-first-project.tsx  # Welcome page actions (client)
│   │   ├── layout.tsx          # Layout com sidebar
│   │   └── page.tsx            # Home — redirect ou welcome
│   ├── api/                    # 23 API routes
│   │   ├── assignees/          # GET distinct assignees
│   │   ├── boards/             # CRUD boards
│   │   ├── columns/            # CRUD + reorder colunas
│   │   ├── comments/           # CRUD comentarios
│   │   ├── dashboard/          # Stats e metricas
│   │   ├── dependencies/       # Task dependencies
│   │   ├── export/             # JSON/CSV export
│   │   ├── import/             # Obsidian vault import + preview
│   │   ├── labels/             # CRUD labels
│   │   ├── projects/           # CRUD projetos (incl [projectId])
│   │   ├── search/             # Full-text search
│   │   ├── seed/               # Seed demo data
│   │   ├── tasks/              # CRUD + reorder tasks
│   │   └── workspaces/         # CRUD workspaces (incl [workspaceId])
│   ├── globals.css             # Tailwind v4 + CSS vars (dark/light) + reduced-motion + cursor
│   ├── layout.tsx              # Root layout com Providers + skip link
│   └── providers.tsx           # QueryClient + Theme + Toaster
├── components/
│   ├── board/                  # board-view, column, task-card, bulk-action-bar, board-settings-dialog, due-date-notifier, task-url-sync
│   ├── dashboard/              # activity-feed
│   ├── filters/                # filter-panel, search-dialog (Cmd+K)
│   ├── graph/                  # graph-view, task-node, column-header-node
│   ├── layout/                 # sidebar, header, view-switcher, keyboard-shortcuts-provider, create-board/project-popover, workspace-settings-dialog
│   ├── task/                   # task-drawer, task-header, task-properties (assignee autocomplete), task-body, subtask-list, dependency-list, comment-list, activity-list
│   ├── ui/                     # 20 shadcn-style components
│   └── views/                  # list-view, table-view, timeline-view
├── hooks/                      # use-board, use-task, use-dashboard, use-activity, use-keyboard-shortcuts
├── lib/                        # db (Prisma singleton), utils (cn, dates), query-client
├── store/                      # board-store, theme-store, undo-store (Zustand)
├── types/                      # TypeScript types e interfaces
├── test/                       # setup.ts, e2e/ (smoke.spec.ts, flows.spec.ts)
└── generated/prisma/           # Prisma client gerado (gitignored)
```

### Data Model (10 entidades)

```
Workspace → Project → Board → Column → Task
                                         ├── TaskLabel ← Label
                                         ├── TaskDependency (self-ref)
                                         ├── Comment
                                         └── Activity
```

### 5 Views

1. **Board** (Kanban) — DnD com @dnd-kit, colunas horizontais, bulk selection
2. **Graph** — Nodes com @xyflow/react, edges de dependencia
3. **List** — Tabela sortavel, group by, bulk actions funcionais
4. **Table** — Spreadsheet inline edit, colunas redimensionaveis
5. **Timeline** — Gantt com barras por dueDate (inicio em createdAt), drag para alterar data

### Request Flow

```
Browser → Next.js App Router
  ├── Server Components (pages) → Prisma (direct DB)
  └── Client Components → fetch() → API Routes → Prisma → SQLite
```

## Patterns & Conventions

### Codigo

- 2-space indent, single quotes, no semicolons (Prettier via hook)
- Named exports only
- Server Components por padrao — `'use client'` so quando necessario
- Validacao com Zod nos API routes (POST/PATCH)
- Path alias: `@/*` → `./src/*`
- Semantic color tokens: usar `bg-background`, `text-foreground`, `bg-card`, `border-border` etc. — NUNCA cores hardcoded como `bg-zinc-950`

### State

- Server state → TanStack Query via hooks em `use-board.ts` / `use-task.ts`
- Client UI state → Zustand (`board-store`, `theme-store`, `undo-store`)
- Query key factory: `boardKey(boardId)` centralizada
- Undo/redo: `useUndoStore` — push actions em `useUpdateTask` e `useUpdateTaskMutation`

### API Routes

- Next.js 16: `params` e `Promise` — sempre `await params`
- Zod validation antes de acessar body
- `NextResponse.json()` para respostas
- 404 guard em todos os PATCH/DELETE: `findUnique` antes de `update`/`delete`
- Transactions para operacoes compostas
- Content-Disposition: sanitizar nomes de usuario antes de usar em headers

### Seguranca

- Import route: path traversal protection (403 se fora de `~/`)
- Zod validation em todas as rotas de escrita
- DELETE retorna 404 (nao 500) para recursos inexistentes
- Export: board name sanitizado no Content-Disposition
- Sem auth (app local single-user)

### Acessibilidade

- Skip link no root layout (`#main-content`)
- `aria-label` em botoes de icone (view switcher, sidebar collapse, export, settings)
- `aria-label` nas navs do sidebar (Projects, Utilities)
- `prefers-reduced-motion` desativa animacoes via CSS global
- Cursor pointer global via CSS para todos elementos interativos
- Touch targets minimo 36-44px em botoes criticos

## Commands

```bash
# Desenvolvimento
pnpm dev                    # Dev server (porta 3000)
pnpm build                  # Build de producao
pnpm start                  # Start producao

# Database
pnpm db:generate            # Regenerar Prisma client
pnpm db:push                # Push schema sem migration
pnpm db:migrate             # Prisma migrate dev
pnpm db:seed                # Seed com dados demo (tsx prisma/seed.ts)
pnpm db:studio              # Prisma Studio (GUI)

# Qualidade
pnpm typecheck              # tsc --noEmit
pnpm lint                   # ESLint

# Testes
pnpm test                   # Unit tests (Vitest) — 24 testes
pnpm test:watch             # Watch mode
pnpm test:cov               # Coverage report
pnpm test:e2e               # E2E tests (Playwright) — 10 testes

# Docker
pnpm docker:build           # docker build -t flow-board .
pnpm docker:up              # docker compose up -d
pnpm docker:down            # docker compose down
```

## Setup Inicial

```bash
git clone git@github.com:dougss/flow-board.git
cd flow-board
cp .env.example .env
pnpm install
pnpm db:generate
pnpm db:push
pnpm dev
```

## Anti-patterns

- **NAO** usar `npm` ou `yarn` — apenas `pnpm`
- **NAO** usar `fetch()` direto em componentes — via TanStack Query hooks
- **NAO** usar cores hardcoded (`bg-zinc-950`) — usar semantic tokens (`bg-background`)
- **NAO** usar `neutral-*` — usar semantic tokens ou `zinc-*` consistentemente
- **NAO** usar `tx: any` em Prisma transactions — usar tipo correto
- **NAO** importar de `@prisma/client` — importar de `@/generated/prisma/client`
- **NAO** acessar filesystem sem validar path (import route)
- **NAO** usar `console.log` em handlers de producao
- **NAO** interceptar Cmd+Z/Cmd+Shift+Z quando input/textarea tem foco — preservar undo nativo do browser

## Testes

### Unit (Vitest)

- `src/store/board-store.test.ts` — 9 testes: views, drawer, filters, bulk selection
- `src/hooks/use-keyboard-shortcuts.test.ts` — 5 testes: shortcuts, cleanup
- `src/app/api/tasks/route.test.ts` — 10 testes: POST validation, GET filtering

### E2E (Playwright)

- `src/test/e2e/smoke.spec.ts` — 5 testes: home, dashboard, import, settings, Cmd+K
- `src/test/e2e/flows.spec.ts` — 5 testes: task creation, search, view switch, export, settings dialog

### CI

- GitHub Actions: pnpm install → db:generate → db:push → typecheck → lint → test → playwright

## Docker

```bash
docker compose up -d
# SQLite persiste via named volume (flow-board-data)
# Porta: 3000
# Healthcheck: /api/workspaces
```
