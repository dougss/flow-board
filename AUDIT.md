# FlowBoard — Auditoria Completa

> Auditoria realizada em 2026-04-12. Atualizado em 2026-04-12 apos implementacao de P0-P3.

## Resumo Executivo

O FlowBoard e um app de project management pessoal com kanban, graph, list, table e timeline views. Stack: Next.js 16 + React 19 + Prisma 7 + SQLite + Zustand + TanStack Query. Todas as prioridades P0-P3 da auditoria foram implementadas e revisadas via Codex.

---

## 1. Funcionalidades

| Feature                | Status | Notas                                                                    |
| ---------------------- | ------ | ------------------------------------------------------------------------ |
| Task CRUD              | OK     | Create, read, update, delete completos                                   |
| Board/Column CRUD      | OK     | Create, edit, delete, reorder                                            |
| Drag & Drop            | OK     | @dnd-kit cross-column com optimistic updates                             |
| 5 Views                | OK     | Board, List, Table, Timeline, Graph                                      |
| Task Drawer            | OK     | Slide-in com header, properties, body, comments                          |
| Subtasks               | OK     | Self-referential, inline CRUD, progress bar                              |
| Labels/Tags            | OK     | CRUD + filtro + cores + import do Obsidian                               |
| Dependencies           | OK     | blocks/blocked_by/relates_to + graph visualization                       |
| Comments               | OK     | CRUD com timestamps                                                      |
| Activity Log           | OK     | Tracked em campo/oldValue/newValue                                       |
| Search (Cmd+K)         | OK     | LIKE query em title+description                                          |
| Filters                | OK     | Status, priority, type, labels, assignees, dueDate, subtasks             |
| Bulk Selection         | OK     | Checkbox + floating action bar (board + list views)                      |
| Dashboard              | OK     | Stats, charts (status/priority/type/velocity), overdue, activity         |
| Obsidian Import        | OK     | Preview + import com YAML frontmatter                                    |
| Timeline/Gantt         | OK     | Zoom day/week/month, drag-to-reschedule, barras iniciam em createdAt     |
| Graph View             | OK     | @xyflow com dependency edges, task nodes por coluna                      |
| Theme Toggle           | OK     | Dark/Light com semantic tokens em todas as pages                         |
| Keyboard Shortcuts     | OK     | Cmd+K, Cmd+N, Cmd+Z, Cmd+Shift+Z, Cmd+Shift+D, Esc, 1-5 views            |
| Deep Linking           | OK     | ?task=id abre drawer automaticamente                                     |
| CI Pipeline            | OK     | GitHub Actions: typecheck, lint, test, e2e                               |
| Export                 | OK     | JSON/CSV via GET /api/export?boardId=X&format=json/csv                   |
| Accessibility          | OK     | Skip link, aria-labels, prefers-reduced-motion, cursor-pointer global    |
| Undo/Redo              | OK     | Cmd+Z / Cmd+Shift+Z com action stack (max 30), preserva native text undo |
| Assignee Autocomplete  | OK     | GET /api/assignees + dropdown com sugestoes                              |
| Board/Project Settings | OK     | Dialog via header, rename board/project, edit description                |
| Workspace Settings     | OK     | Dialog via sidebar, PATCH API com 404 guard                              |
| Breadcrumbs            | OK     | Workspace > Project > Board com ChevronRight                             |
| Due Date Notifications | OK     | Toast warning overdue + toast info due-within-24h                        |
| Form Validation        | OK     | Import page com touched state, red borders, inline errors                |
| Seed Data              | OK     | Welcome page com "Load Demo Data" e "Create Empty Project"               |
| Responsive Sidebar     | OK     | Hidden mobile + hamburger menu + overlay + auto-close                    |

---

## 2. Itens Corrigidos por Fase

### P0 — Fixes criticos (commit 7074730)

- .env.example criado
- Light mode: semantic tokens em 14 arquivos
- Timeline getTaskStart: usa createdAt
- List view bulk actions: Move/Priority/Delete funcionais
- Dashboard Skeleton: usa ui/skeleton
- Scrollbar: usa CSS variables
- Empty states: board not found + welcome page
- prefers-reduced-motion: CSS global
- Skip link + aria-labels
- Neutral para zinc: list-view + timeline-view migrados
- Export API: JSON/CSV com Content-Disposition sanitizado

### P1 — UX essencial (commit d8ae8d1)

- Seed data: botao "Load Demo Data" na welcome page
- Board/project settings: dialog via header com PATCH APIs
- Touch targets: view switcher 36px, icon buttons 44px min
- Responsive sidebar: hamburger menu mobile com overlay

### P2 — Polish (commit 9c32e62)

- Breadcrumbs: Workspace > Project > Board, responsivo
- Tab order: aria-label nas navs do sidebar
- Form validation: import page com touched + red borders + inline errors
- Due date notifications: toast overdue + due-within-24h (one-shot per visit)
- Workspace settings: PATCH API + dialog no sidebar com fetch fresh on open

### P3 — Nice to have (commit 80a08f3)

- Undo/redo: useUndoStore + Cmd+Z/Shift+Z (preserva native text undo em inputs)
- Assignee autocomplete: GET /api/assignees + dropdown com sugestoes
- Dashboard Radix Select: substituido select nativo por shadcn Select
- Cursor pointer: CSS global para todos elementos interativos
- API route tests: 10 testes (POST validation, GET filtering)
- E2E flow tests: 5 testes (task creation, search, view switch, export, settings)

---

## 3. Audit Tecnica (atualizada)

### Code Quality

| Aspecto                 | Status | Notas                                          |
| ----------------------- | ------ | ---------------------------------------------- |
| TypeScript strict       | OK     | Habilitado                                     |
| Prisma schema indexes   | OK     | Bem otimizado                                  |
| TanStack Query patterns | OK     | Correto com staleTime, invalidation            |
| Zustand patterns        | OK     | 3 stores: board, theme, undo                   |
| Error handling API      | OK     | 404 guards em todos os PATCH/DELETE            |
| Optimistic updates      | OK     | Implementado no drag and drop                  |
| Semantic tokens         | OK     | Todas as pages usam CSS variables via Tailwind |
| Undo/redo               | OK     | Action stack com previous state fetch          |

### Testes

| Tipo             | Cobertura            | Status                        |
| ---------------- | -------------------- | ----------------------------- |
| Unit (Vitest)    | 24 testes (3 suites) | OK — store, hooks, API routes |
| E2E (Playwright) | 10 testes            | OK — smoke + flow tests       |
| Integration      | 10 testes            | OK — API routes POST/GET      |
| Visual           | 0                    | Pendente                      |

### Security

| Item                       | Status                             |
| -------------------------- | ---------------------------------- |
| Path traversal (import)    | OK — homeDirWithSep + realpath     |
| Export Content-Disposition | OK — board name sanitizado         |
| Workspace PATCH            | OK — 404 guard antes de update     |
| Input sanitization         | WARN — titulos sem sanitizacao XSS |

---

## 4. Pendente (futuro)

| Item                    | Descricao                           | Prioridade |
| ----------------------- | ----------------------------------- | ---------- |
| Visual regression tests | Snapshot/screenshot tests           | Low        |
| XSS sanitization        | Sanitizar titulos e descriptions    | Medium     |
| Multi-workspace         | Suporte real a multiplos workspaces | Low        |
| Recurring tasks         | Tarefas recorrentes                 | Low        |
| Time tracking           | Tempo gasto por task                | Low        |
| Attachments             | Upload de arquivos                  | Low        |
| Templates               | Templates de tasks/boards           | Low        |
