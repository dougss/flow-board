export type TaskType =
  | "task"
  | "bug"
  | "feature"
  | "improvement"
  | "tech-debt"
  | "investigation"
  | "architecture"
  | "integration"
  | "infra"
  | string;

export type TaskPriority =
  | "urgent"
  | "high"
  | "medium"
  | "low"
  | "none"
  | string;

export type DependencyType = "blocks" | "blocked_by" | "relates_to";

export type ViewType = "board" | "graph" | "list" | "table" | "timeline";

export type ProjectStatus = "active" | "archived" | "completed";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  projects?: Project[];
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  description: string | null;
  status: ProjectStatus;
  color: string | null;
  icon: string | null;
  createdAt: Date;
  updatedAt: Date;
  workspace?: Workspace;
  boards?: Board[];
}

export interface Board {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  defaultView: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  project?: Project;
  columns?: Column[];
  // populated by some API responses via project join
  workspaceId?: string;
}

export interface Column {
  id: string;
  boardId: string;
  name: string;
  color: string | null;
  position: number;
  wipLimit: number | null;
  isCollapsed: boolean;
  createdAt: Date | string;
  board?: Board;
  tasks?: Task[];
}

export interface Label {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
}

export interface TaskDependency {
  id: string;
  sourceTaskId: string;
  targetTaskId: string;
  type: string;
  sourceTask?: Task;
  targetTask?: Task;
}

export interface Comment {
  id: string;
  taskId: string;
  content: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  task?: Task;
}

export interface Activity {
  id: string;
  taskId: string;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: Date | string;
  task?: Task;
}

export interface Task {
  id: string;
  columnId: string;
  boardId: string;
  parentId: string | null;
  title: string;
  description: string | null;
  status: string;
  type: TaskType;
  priority: TaskPriority;
  storyPoints: number | null;
  estimatedEffort: string | null;
  dueDate: Date | string | null;
  requestedBy: string | null;
  assignedTo: string | null;
  position: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  completedAt: Date | string | null;
  column?: Column;
  board?: Board;
  labels?: { label: Label }[];
  subtasks?: Task[];
  parent?: Task | null;
  dependenciesFrom?: TaskDependency[];
  dependenciesTo?: TaskDependency[];
  comments?: Comment[];
  activities?: Activity[];
}

export type TaskWithRelations = Task & {
  column: Column;
  labels: { label: Label }[];
  subtasks: Task[];
  parent: Task | null;
  dependenciesFrom: TaskDependency[];
  dependenciesTo: TaskDependency[];
  comments: Comment[];
  activities: Activity[];
};

export type ColumnWithTasks = Omit<Column, "tasks"> & {
  tasks: Task[];
};

export type BoardWithColumns = Omit<Board, "columns"> & {
  columns: ColumnWithTasks[];
};
