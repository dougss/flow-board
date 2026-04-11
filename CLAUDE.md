# FlowBoard — Project Management App

> App pessoal de gestão de projetos e demandas, rodando localmente no Mac Mini. Substitui o tracking via Obsidian vault com UI rica, graph kanban view, e múltiplas visualizações.

**Repo**: https://github.com/dougss/flow-board
**PRD**: Leve_saude/.claude/plans/project-flow-tracker-prd.md

## Stack

| Camada          | Tecnologia                           | Versão     |
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

## Arquitetura

### Estrutura de Pastas

```
src/
├── app/
│   ├── (app)/                  # Route group — layout com sidebar
│   │   ├── board/[boardId]/    # Página do board (Server Component)
│   │   ├── dashboard/          # Dashboard com métricas
│   │   ├── import/             # Import do Obsidian
│   │   ├── layout.tsx          # Layout com sidebar
│   │   └── page.tsx            # Home — redirect para primeiro board
│   ├── api/                    # 19 API routes
│   │   ├── boards/             # CRUD boards
│   │   ├── columns/            # CRUD + reorder colunas
│   │   ├── comments/           # CRUD comentários
│   │   ├── dashboard/          # Stats e métricas
│   │   ├── dependencies/       # Task dependencies
│   │   ├── import/             # Obsidian vault import
│   │   ├── labels/             # CRUD labels
│   │   ├── projects/           # CRUD projetos
│   │   ├── search/             # Full-text search
│   │   ├── seed/               # Seed demo data
│   │   ├── tasks/              # CRUD + reorder tasks
│   │   └── workspaces/         # CRUD workspaces
│   ├── globals.css             # Tailwind v4 + CSS vars (dark/light)
│   ├── layout.tsx              # Root layout com Providers
│   └── providers.tsx           # QueryClient + Theme + Toaster
├── components/
│   ├── board/                  # Kanban: board-view, column, task-card, dialogs
│   ├── filters/                # filter-panel, search-dialog (Cmd+K)
│   ├── graph/                  # graph-view, task-node, column-header-node
│   ├── layout/                 # sidebar, header, view-switcher
│   ├── task/                   # task-drawer, task-header, task-properties, task-body, subtasks, deps, comments, activity
│   ├── ui/                     # 20 shadcn-style components
│   └── views/                  # list-view, table-view, timeline-view
├── hooks/                      # use-board, use-task, use-keyboard-shortcuts
├── lib/                        # db (Prisma singleton), utils (cn, dates), query-client
├── store/                      # board-store (Zustand), theme-store (Zustand + persist)
├── types/                      # TypeScript types e interfaces
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

1. **Board** (Kanban) — DnD com @dnd-kit, colunas horizontais
2. **Graph** — Nodes circulares com @xyflow/react, edges de dependência
3. **List** — Tabela sortável, group by, bulk actions
4. **Table** — Spreadsheet inline edit, colunas redimensionáveis
5. **Timeline** — Gantt com barras por dueDate, drag para alterar data

### Request Flow

```
Browser → Next.js App Router
  ├── Server Components (pages) → Prisma (direct DB)
  └── Client Components → fetch() → API Routes → Prisma → SQLite
```

## Patterns & Conventions

### Código

- 2-space indent, single quotes, no semicolons (Prettier via hook)
- Named exports only
- Server Components por padrão — `'use client'` só quando necessário
- Validação com Zod nos API routes (POST/PATCH/DELETE)
- `TxClient` type alias para transactions Prisma (evita `any`)
- Path alias: `@/*` → `./src/*`

### State

- Server state → TanStack Query via hooks em `use-board.ts` / `use-task.ts`
- Client UI state → Zustand (`board-store`, `theme-store`)
- Query key factory: `boardKey(boardId)` centralizada

### API Routes

- Next.js 16: `params` é `Promise` — sempre `await params`
- Zod validation antes de acessar body
- `NextResponse.json()` para respostas
- Try/catch com status codes corretos (400, 403, 404, 500)
- Transactions para operações compostas

### Segurança

- Import route: path traversal protection (403 se fora de `~/`)
- Zod validation em todas as rotas de escrita
- DELETE retorna 404 (não 500) para recursos inexistentes
- Sem auth (app local single-user)

## Commands

```bash
# Desenvolvimento
pnpm dev                    # Dev server (porta 3000)
pnpm build                  # Build de produção
pnpm start                  # Start produção

# Database
pnpm db:migrate             # Prisma migrate dev
pnpm db:seed                # Seed com dados demo (tsx prisma/seed.ts)
pnpm db:studio              # Prisma Studio (GUI)
pnpm db:generate            # Regenerar Prisma client
pnpm db:push                # Push schema sem migration

# Qualidade
pnpm typecheck              # tsc --noEmit
pnpm lint                   # ESLint

# Docker
pnpm docker:build           # docker build -t flow-board .
pnpm docker:up              # docker compose up -d
pnpm docker:down            # docker compose down
```

## Setup Inicial

```bash
git clone git@github.com:dougss/flow-board.git
cd flow-board
pnpm install
pnpm db:migrate
pnpm db:seed          # Opcional: dados demo
pnpm dev
```

## Anti-patterns

- **NÃO** usar `npm` ou `yarn` — apenas `pnpm`
- **NÃO** usar `fetch()` direto em componentes — via TanStack Query hooks
- **NÃO** usar `tx: any` em Prisma transactions — usar `TxClient`
- **NÃO** usar `as unknown as Type` — ajustar types na origem
- **NÃO** importar de `@prisma/client` — importar de `@/generated/prisma/client`
- **NÃO** acessar filesystem sem validar path (import route)
- **NÃO** usar `console.log` em handlers de produção

## Docker

```bash
# Build e run
docker compose up -d

# O SQLite persiste via named volume (flow-board-data)
# Porta: 3000
# Healthcheck: /api/workspaces
```

## Testes

Sem test suite formal ainda. E2E testado via Playwright:

- 31/32 testes passando (API + UI)
- Screenshots em `/tmp/flowboard-retest-screenshots/`
