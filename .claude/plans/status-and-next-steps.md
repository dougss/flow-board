# FlowBoard — Status & Próximos Passos

**Data**: 2026-04-11
**Repo**: https://github.com/dougss/flow-board
**Commits**: 3 (init → feat: complete app → fix: review issues)

---

## Status Atual por Fase do PRD

### Fase 1 — Kanban Core (MVP) ✅ COMPLETA

- [x] Setup: Next.js 16 + Prisma 7 + SQLite + Tailwind v4 + shadcn
- [x] Data model: 10 entidades (Workspace→Project→Board→Column→Task + Label, Dependency, Comment, Activity)
- [x] Board view com drag-and-drop (@dnd-kit)
- [x] CRUD de tasks (criar via dialog + quick-add, editar, mover, deletar)
- [x] Task detail drawer (título, description, status, priority, type, labels, subtasks, deps, comments, activity)
- [x] Column management (criar, renomear, reordenar, cor, WIP limit, deletar)
- [x] Dark/light theme (Zustand + persist)
- [x] Context menu nos cards (delete, change priority, duplicate)

### Fase 2 — Task Detail Completo ✅ COMPLETA

- [x] Labels (CRUD + multi-assign via popover)
- [x] Subtasks com checkbox e reorder
- [x] Comments com markdown
- [x] Activity log automático (created, moved, updated, commented)
- [x] Due date + date picker
- [x] Story points + estimated effort
- [x] Assignee + requested by
- [x] Tabs: Description | Subtasks | Deps | Comments | Activity

### Fase 3 — Graph Kanban View ✅ COMPLETA

- [x] @xyflow/react setup
- [x] Custom node component (circle com ícone de tipo, ring de cor, badge de points)
- [x] Custom column header node (semi-transparente com cor)
- [x] Grid layout dentro de cada coluna
- [x] Edges de dependência entre nodes
- [x] Hover: tooltip com detalhes
- [x] Click: abre task drawer
- [x] MiniMap + Controls + Background dots
- [x] Panel com legenda de colunas

### Fase 4 — Views Adicionais ✅ COMPLETA

- [x] List view (sortable, groupable, bulk actions)
- [x] Table view (spreadsheet grid, inline edit, resize columns)
- [x] Timeline view (Gantt com barras por dueDate, drag)
- [x] View switcher no header (5 ícones)
- [x] AnimatePresence para transição entre views

### Fase 5 — Obsidian Import ✅ COMPLETA (funcionalidade base)

- [x] Parser de markdown + frontmatter YAML
- [x] Scan de diretórios (01-Demands, 02-Projects)
- [x] Mapeamento de campos
- [x] API route com path traversal protection
- [x] UI com form (vault path + workspace name)
- [ ] **Preview de importação** (mostra tabela antes de importar)
- [ ] **Progress bar** durante import
- [ ] **Dedup** por título + data (re-import seguro)

### Fase 6 — Search, Filtros e Dashboard ✅ PARCIAL

- [x] Search via Prisma contains em title + description
- [x] Search dialog (Cmd+K) com debounce
- [x] Filter panel com status, priority, type, labels
- [x] Dashboard: stats cards (Total, Completed, Created, Avg Lead Time)
- [x] Dashboard: charts containers (Recharts)
- [ ] **SQLite FTS5** para full-text search real (hoje é LIKE %term%)
- [ ] **Dashboard precisa de board selector** (hoje mostra 0 sem boardId)
- [ ] **Velocity chart** não preenche (precisa de dados históricos)

### Fase 7 — Polish e Animations ⬜ PENDENTE

- [ ] ReactBits animations (page transitions, card hover, graph node effects)
- [ ] Keyboard shortcuts funcionais (hook existe mas não está conectado)
- [ ] Empty states animados
- [ ] Loading skeletons (parcialmente feito)
- [ ] Responsive (tablet + desktop)
- [ ] Virtual scroll para listas grandes
- [ ] PWA setup (manifest + service worker)
- [ ] pm2 config para rodar persistente no Mac Mini

---

## Métricas do Projeto

| Métrica                  | Valor         |
| ------------------------ | ------------- |
| Arquivos fonte (src/)    | 99            |
| Componentes React (.tsx) | 44            |
| API routes               | 19            |
| Prisma models            | 10            |
| Dependências             | 42            |
| TypeScript errors        | 0             |
| Build status             | ✅ Passing    |
| E2E tests                | 31/32 passing |

---

## Bugs Conhecidos

1. **Sidebar "My Workspace"** — mostra texto hardcoded em vez do nome real do workspace
2. **Dashboard sem dados por padrão** — precisa selecionar um boardId, mas o seletor é só um text input
3. **Sidebar não lista projetos/boards** — o nav está vazio, precisa fetch de projetos
4. **Timeline view** — funcional mas sem drag real para alterar dueDate (handler existe, PATCH pode falhar)
5. **Table view inline edit** — double-click to edit funciona mas pode ter edge cases
6. **Quick Add** criou tasks duplicadas nos testes E2E (sem debounce no Enter)

---

## Próximos Passos (prioridade sugerida)

### P0 — UX Crítico (usar o app no dia-a-dia)

1. **Sidebar dinâmica** — fetch projetos/boards, mostrar tree, highlight board ativo
2. **Dashboard com board selector** — dropdown em vez de text input, auto-selecionar primeiro board
3. **Obsidian import preview** — tabela mostrando demands/projects antes de confirmar
4. **Keyboard shortcuts** — conectar o hook existente ao layout

### P1 — Qualidade

5. **Test suite** — Vitest para API routes, Playwright para E2E automatizado
6. **FTS5 search** — Prisma raw query para SQLite FTS5 (muito mais rápido que LIKE)
7. **Debounce no quick-add** — evitar tasks duplicadas por double-Enter
8. **Error boundaries** — React error boundary nos views

### P2 — Polish (Fase 7 do PRD)

9. **ReactBits** — instalar e adicionar efeitos visuais (card hover, transitions)
10. **PWA** — manifest.json + service worker para acesso offline
11. **pm2 ecosystem** — config para rodar persistente no Mac Mini
12. **Responsive** — testar e ajustar para tablet

### P3 — Features Extras (fora do PRD v1)

13. **Export** — CSV/JSON para backup
14. **Bulk import** — arrastar .md files para dentro do app
15. **Markdown editor** — Tiptap ou similar para rich editing no description
16. **Themes customizáveis** — além de dark/light
17. **Board templates** — criar boards a partir de presets

---

## Como Rodar

```bash
# Dev
cd ~/Personal/flow-board
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev

# Docker (Mac Mini)
docker compose up -d

# Verificação
pnpm typecheck    # tsc --noEmit
pnpm build        # production build
```
