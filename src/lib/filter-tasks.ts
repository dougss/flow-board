interface Filters {
  statuses: string[];
  priorities: string[];
  types: string[];
  labelIds: string[];
  assignees: string[];
  search: string;
  hasSubtasks: boolean | null;
  hasDueDate: boolean | null;
}

interface FilterableTask {
  columnId: string;
  priority: string;
  type: string;
  title: string;
  assignedTo: string | null;
  dueDate: unknown;
  labels?: { label: { id: string } }[];
}

export function filterTasks<T extends FilterableTask>(
  tasks: T[],
  filters: Filters,
): T[] {
  return tasks.filter((task) => {
    // statuses stores column IDs for stable matching
    if (
      filters.statuses.length > 0 &&
      !filters.statuses.includes(task.columnId)
    )
      return false;

    if (
      filters.priorities.length > 0 &&
      !filters.priorities.includes(task.priority)
    )
      return false;

    if (filters.types.length > 0 && !filters.types.includes(task.type))
      return false;

    if (filters.labelIds.length > 0) {
      const taskLabelIds = (task.labels ?? []).map((l) => l.label.id);
      if (!filters.labelIds.some((id) => taskLabelIds.includes(id)))
        return false;
    }

    if (filters.assignees.length > 0) {
      const assignee = (task.assignedTo ?? "").toLowerCase();
      if (!filters.assignees.some((a) => assignee.includes(a.toLowerCase())))
        return false;
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!task.title.toLowerCase().includes(q)) return false;
    }

    if (filters.hasDueDate === true && !task.dueDate) return false;
    if (filters.hasDueDate === false && task.dueDate) return false;

    return true;
  });
}
