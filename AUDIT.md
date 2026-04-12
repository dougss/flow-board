# FlowBoard — Auditoria Completa

> Auditoria realizada em 2026-04-12. Cobre funcionalidades, UX/UI, code quality, testes e segurança.

## Resumo Executivo

O FlowBoard é um app de project management pessoal com kanban, graph, list, table e timeline views. Stack: Next.js 16 + React 19 + Prisma 7 + SQLite + Zustand + TanStack Query. Funcional para uso pessoal, mas com gaps em UX polish, acessibilidade e features esperadas.

---

## 1. Funcionalidades — O que funciona

| Feature            | Status | Notas                                                            |
| ------------------ | ------ | ---------------------------------------------------------------- |
| Task CRUD          | OK     | Create, read, update, delete completos                           |
| Board/Column CRUD  | OK     | Create, edit, delete, reorder                                    |
| Drag & Drop        | OK     | @dnd-kit cross-column com optimistic updates                     |
| 5 Views            | OK     | Board, List, Table, Timeline, Graph                              |
| Task Drawer        | OK     | Slide-in com header, properties, body, comments                  |
| Subtasks           | OK     | Self-referential, inline CRUD, progress bar                      |
| Labels/Tags        | OK     | CRUD + filtro + cores + import do Obsidian                       |
| Dependencies       | OK     | blocks/blocked_by/relates_to + graph visualization               |
| Comments           | OK     | CRUD com timestamps                                              |
| Activity Log       | OK     | Tracked em campo/oldValue/newValue                               |
| Search (Cmd+K)     | OK     | LIKE query em title+description                                  |
| Filters            | OK     | Status, priority, type, labels, assignees, dueDate, subtasks     |
| Bulk Selection     | OK     | Checkbox + floating action bar                                   |
| Dashboard          | OK     | Stats, charts (status/priority/type/velocity), overdue, activity |
| Obsidian Import    | OK     | Preview + import com YAML frontmatter                            |
| Timeline/Gantt     | OK     | Zoom day/week/month, drag-to-reschedule due dates                |
| Graph View         | OK     | @xyflow com dependency edges, task nodes por coluna              |
| Theme Toggle       | OK     | Dark/Light com Zustand persist                                   |
| Keyboard Shortcuts | OK     | Cmd+K, Cmd+N, Cmd+Shift+D, Esc, 1-5 views                        |
| Deep Linking       | OK     | ?task=id abre drawer automaticamente                             |
| CI Pipeline        | OK     | GitHub Actions: typecheck, lint, test, e2e                       |

---

## 2. Gaps Funcionais

### Criticos

| Gap                                        | Impacto                                                    | Esforco |
| ------------------------------------------ | ---------------------------------------------------------- | ------- |
| Sem seed data                              | App vazio no primeiro acesso, sem onboarding               | Baixo   |
| Sem .env.example                           | Dev setup quebrado para quem clonar                        | Trivial |
| Home page sem "criar projeto"              | Welcome page so linka para import, sem criar do zero       | Baixo   |
| List view bulk actions sao stubs           | Botoes "Move to column" e "Change priority" nao fazem nada | Medio   |
| Timeline getTaskStart sempre retorna today | Todas as barras comecam em hoje — deveria ser createdAt    | Trivial |
| Export inexistente                         | Import existe, mas nenhum export (JSON, CSV, Markdown)     | Medio   |

### Importantes

| Gap                          | Impacto                                                 | Esforco |
| ---------------------------- | ------------------------------------------------------- | ------- |
| Sem board/project settings   | Nao da para renomear board, alterar columns default     | Medio   |
| Sem WIP limit enforcement    | Campo wipLimit existe no schema mas nenhum UI o utiliza | Baixo   |
| Sem notificacoes de due date | Tasks vencem silenciosamente                            | Medio   |
| Sem undo/redo                | Acoes sao permanentes                                   | Alto    |
| Assignees sem normalizacao   | Campo string livre, sem user management                 | Medio   |
| Sem workspace settings       | Nao da para editar workspace name/description           | Baixo   |
| Sem breadcrumbs              | Navegacao entre workspace > project > board nao e clara | Baixo   |

---

## 3. Audit UX/UI

### Problemas Criticos

1. **Light mode quebrado** — className="dark" hardcoded no html, mas ThemeProvider tenta remover a classe. Varios componentes usam classes hardcoded como bg-zinc-950, bg-zinc-900, text-zinc-100 em vez de bg-background, text-foreground. Resultado: texto invisivel em light mode.

2. **Sem prefers-reduced-motion** — Framer Motion usado extensivamente sem respeitar preferencia do OS.

3. **Touch targets < 44px** — Varios botoes/links com h-7 (28px), w-6 h-6 (24px). Abaixo do minimo WCAG.

4. **Sem skip link** — Nenhum "Skip to main content" para keyboard navigation.

5. **Tab order inconsistente** — Sidebar, header, e board nao tem tabIndex management.

### Problemas Medios

6. **Empty states inconsistentes** — Board view return null quando !board. Timeline tem empty state. Dashboard tem skeleton. Import nao tem.

7. **Forms sem validacao visual** — Import page aceita qualquer path sem feedback de campo obrigatorio.

8. **Scrollbar hardcoded para dark** — globals.css tem cores fixas para scrollbar.

9. **Responsive limitado** — Apenas sm e md breakpoints. Sidebar nao e collapsible em mobile.

10. **Dashboard Skeleton local** — Redefine Skeleton inline em vez de usar ui/skeleton.

11. **Sem aria-labels em botoes de icone** — Sidebar collapse, view switcher, filter buttons usam icone sem label.

### Problemas Menores

12. **Mistura de neutral e zinc** — List view e timeline usam neutral enquanto o resto usa zinc.

13. **Select nativo no dashboard** — select com estilo custom, mas sem Radix Select. Inconsistente.

14. **Cursor pointer inconsistente** — Alguns elementos clicaveis nao tem cursor-pointer.

---

## 4. Audit Tecnica

### Code Quality

| Aspecto                 | Status | Notas                               |
| ----------------------- | ------ | ----------------------------------- |
| TypeScript strict       | OK     | Habilitado                          |
| Prisma schema indexes   | OK     | Bem otimizado                       |
| TanStack Query patterns | OK     | Correto com staleTime, invalidation |
| Zustand patterns        | OK     | Correto com persist                 |
| Error handling API      | WARN   | Inconsistente entre routes          |
| Optimistic updates      | OK     | Implementado no drag and drop       |

### Testes

| Tipo             | Cobertura            | Veredicto                                          |
| ---------------- | -------------------- | -------------------------------------------------- |
| Unit (Vitest)    | 14 testes (2 suites) | Cobre store e keyboard hooks, ZERO component tests |
| E2E (Playwright) | 5 testes             | Apenas smoke tests, nenhum fluxo real              |
| Integration      | 0                    | Nenhum teste de API routes                         |
| Visual           | 0                    | Nenhum snapshot/visual regression                  |

### Security

| Item                    | Status                                            |
| ----------------------- | ------------------------------------------------- |
| Path traversal (import) | OK — corrigido com homeDirWithSep + realpath      |
| Input sanitization      | WARN — titulos e descriptions sem sanitizacao XSS |

---

## 5. Priorizacao de Correcoes

### P0 — Fix antes de usar

1. Fix light mode — Substituir cores hardcoded por semantic tokens em todas as pages
2. Fix timeline getTaskStart — Usar createdAt em vez de today
3. Fix list view bulk stubs — Conectar aos mesmos mutations do board bulk-action-bar
4. Criar .env.example
5. Fix dashboard Skeleton import — Usar ui/skeleton em vez de redefinir local

### P1 — UX essencial

6. Light mode completo — Audit todas as pages, converter para semantic tokens
7. Empty states consistentes — Board empty, dashboard empty, welcome flow
8. Home page "Create Project" — Botao criar projeto alem do link de import
9. Confirmacao de delete — Dialog antes de deletar tasks
10. Responsive sidebar — Collapsible em mobile com hamburger menu

### P2 — Polish

11. prefers-reduced-motion — Wrapper no Framer Motion
12. Accessibility audit — aria-labels, skip link, focus management
13. Neutral para zinc migration — Consistencia de cores
14. Export (JSON/CSV) — Endpoint + UI basico
15. WIP limit enforcement — Visual indicator quando coluna excede limit
