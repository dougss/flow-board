# FlowBoard — Auditoria Completa

> Auditoria realizada em 2026-04-12. Atualizado em 2026-04-12 apos implementacao dos fixes.

## Resumo Executivo

O FlowBoard e um app de project management pessoal com kanban, graph, list, table e timeline views. Stack: Next.js 16 + React 19 + Prisma 7 + SQLite + Zustand + TanStack Query. Funcional para uso pessoal. Audit P0-P2 corrigida em commit `7074730`.

---

## 1. Funcionalidades — O que funciona

| Feature            | Status | Notas                                                                |
| ------------------ | ------ | -------------------------------------------------------------------- |
| Task CRUD          | OK     | Create, read, update, delete completos                               |
| Board/Column CRUD  | OK     | Create, edit, delete, reorder                                        |
| Drag & Drop        | OK     | @dnd-kit cross-column com optimistic updates                         |
| 5 Views            | OK     | Board, List, Table, Timeline, Graph                                  |
| Task Drawer        | OK     | Slide-in com header, properties, body, comments                      |
| Subtasks           | OK     | Self-referential, inline CRUD, progress bar                          |
| Labels/Tags        | OK     | CRUD + filtro + cores + import do Obsidian                           |
| Dependencies       | OK     | blocks/blocked_by/relates_to + graph visualization                   |
| Comments           | OK     | CRUD com timestamps                                                  |
| Activity Log       | OK     | Tracked em campo/oldValue/newValue                                   |
| Search (Cmd+K)     | OK     | LIKE query em title+description                                      |
| Filters            | OK     | Status, priority, type, labels, assignees, dueDate, subtasks         |
| Bulk Selection     | OK     | Checkbox + floating action bar (board + list views)                  |
| Dashboard          | OK     | Stats, charts (status/priority/type/velocity), overdue, activity     |
| Obsidian Import    | OK     | Preview + import com YAML frontmatter                                |
| Timeline/Gantt     | OK     | Zoom day/week/month, drag-to-reschedule, barras iniciam em createdAt |
| Graph View         | OK     | @xyflow com dependency edges, task nodes por coluna                  |
| Theme Toggle       | OK     | Dark/Light com semantic tokens em todas as pages                     |
| Keyboard Shortcuts | OK     | Cmd+K, Cmd+N, Cmd+Shift+D, Esc, 1-5 views                            |
| Deep Linking       | OK     | ?task=id abre drawer automaticamente                                 |
| CI Pipeline        | OK     | GitHub Actions: typecheck, lint, test, e2e                           |
| Export             | OK     | JSON/CSV via GET /api/export?boardId=X&format=json/csv               |
| Accessibility      | OK     | Skip link, aria-labels, prefers-reduced-motion                       |

---

## 2. Gaps Funcionais

### Corrigidos (commit 7074730)

| Gap                                     | Status | Commit                                                  |
| --------------------------------------- | ------ | ------------------------------------------------------- |
| ~~Sem .env.example~~                    | DONE   | .env.example criado                                     |
| ~~Home page sem "criar projeto"~~       | DONE   | CreateFirstProject cria workspace+project+board inline  |
| ~~List view bulk actions stubs~~        | DONE   | Move/Priority/Delete funcionais com mutations reais     |
| ~~Timeline getTaskStart retorna today~~ | DONE   | Usa createdAt                                           |
| ~~Export inexistente~~                  | DONE   | API + botao no header (JSON/CSV)                        |
| ~~Light mode quebrado~~                 | DONE   | Semantic tokens em 14 arquivos                          |
| ~~Sem prefers-reduced-motion~~          | DONE   | CSS global desativa animacoes                           |
| ~~Sem skip link~~                       | DONE   | Skip to main content + id="main-content"                |
| ~~Sem aria-labels~~                     | DONE   | View switcher, sidebar collapse                         |
| ~~Empty states inconsistentes~~         | DONE   | Board not found + welcome page funcional                |
| ~~Dashboard Skeleton local~~            | DONE   | Usa ui/skeleton                                         |
| ~~Scrollbar hardcoded~~                 | DONE   | Usa CSS variables                                       |
| ~~Mistura neutral/zinc~~                | DONE   | list-view e timeline-view migrados para semantic tokens |

### Pendentes — Funcionalidades

| Gap                          | Impacto                                           | Esforco | Prioridade |
| ---------------------------- | ------------------------------------------------- | ------- | ---------- |
| Sem seed data                | App vazio no primeiro acesso                      | Baixo   | P1         |
| Sem board/project settings   | Nao da para renomear board/project                | Medio   | P1         |
| Sem workspace settings       | Nao da para editar workspace name/description     | Baixo   | P2         |
| Sem notificacoes de due date | Tasks vencem silenciosamente                      | Medio   | P2         |
| Sem undo/redo                | Acoes sao permanentes                             | Alto    | P3         |
| Assignees sem normalizacao   | Campo string livre, sem user management           | Medio   | P3         |
| Sem breadcrumbs              | Navegacao workspace > project > board nao e clara | Baixo   | P2         |

### Pendentes — UX/UI

| Gap                          | Impacto                                                     | Esforco | Prioridade |
| ---------------------------- | ----------------------------------------------------------- | ------- | ---------- |
| Touch targets < 44px         | Botoes h-7 (28px), w-6 h-6 (24px) abaixo do minimo WCAG     | Baixo   | P1         |
| Tab order inconsistente      | Sidebar/header sem tabIndex management                      | Medio   | P2         |
| Forms sem validacao visual   | Import aceita qualquer path sem feedback                    | Baixo   | P2         |
| Responsive limitado          | Apenas sm/md breakpoints, sidebar nao collapsible em mobile | Medio   | P1         |
| Select nativo no dashboard   | Usa select HTML em vez de Radix Select                      | Baixo   | P3         |
| Cursor pointer inconsistente | Alguns elementos clicaveis sem cursor-pointer               | Baixo   | P3         |

---

## 3. Audit Tecnica

### Code Quality

| Aspecto                 | Status | Notas                                          |
| ----------------------- | ------ | ---------------------------------------------- |
| TypeScript strict       | OK     | Habilitado                                     |
| Prisma schema indexes   | OK     | Bem otimizado                                  |
| TanStack Query patterns | OK     | Correto com staleTime, invalidation            |
| Zustand patterns        | OK     | Correto com persist                            |
| Error handling API      | WARN   | Inconsistente entre routes                     |
| Optimistic updates      | OK     | Implementado no drag and drop                  |
| Semantic tokens         | OK     | Todas as pages usam CSS variables via Tailwind |

### Testes — Pendente

| Tipo             | Cobertura            | Veredicto                                          |
| ---------------- | -------------------- | -------------------------------------------------- |
| Unit (Vitest)    | 14 testes (2 suites) | Cobre store e keyboard hooks, ZERO component tests |
| E2E (Playwright) | 5 testes             | Apenas smoke tests, nenhum fluxo real              |
| Integration      | 0                    | Nenhum teste de API routes                         |
| Visual           | 0                    | Nenhum snapshot/visual regression                  |

### Security

| Item                       | Status                                            |
| -------------------------- | ------------------------------------------------- |
| Path traversal (import)    | OK — corrigido com homeDirWithSep + realpath      |
| Export Content-Disposition | OK — board name sanitizado                        |
| Input sanitization         | WARN — titulos e descriptions sem sanitizacao XSS |

---

## 4. Proximos Passos Recomendados

### P1 — Prioridade alta

1. **Seed data** — Script para popular o banco com dados de exemplo no primeiro acesso
2. **Board/project settings** — Renomear, editar descricao, alterar colunas default
3. **Touch targets** — Aumentar botoes criticos para minimo 44x44px
4. **Responsive sidebar** — Collapsible em mobile com hamburger menu

### P2 — Prioridade media

5. **Breadcrumbs** — Navegacao clara workspace > project > board
6. **Tab order** — tabIndex management em sidebar e header
7. **Form validation** — Feedback visual em campos obrigatorios (import)
8. **Due date notifications** — Toast ou badge quando tasks vencem
9. **Workspace settings** — Editar nome e descricao

### P3 — Nice to have

10. **Undo/redo** — Stack de acoes reversivel
11. **Assignee normalization** — Modelo User com autocomplete
12. **Dashboard Radix Select** — Substituir select nativo
13. **Cursor pointer audit** — Garantir cursor-pointer em todos os clicaveis
14. **Component tests** — Testes de renderizacao para task-card, drawer, etc.
15. **API route tests** — Testes de integracao para CRUD endpoints
16. **E2E flow tests** — Criar task, drag, bulk actions, export
