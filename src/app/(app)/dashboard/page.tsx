"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { BarChart3, AlertCircle, ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "@/hooks/use-dashboard";
import { ActivityFeed } from "@/components/dashboard/activity-feed";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
}

function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-muted-foreground text-xs mb-1">{label}</p>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
      {sub && <p className="text-muted-foreground/60 text-xs mt-1">{sub}</p>}
    </div>
  );
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#60a5fa",
  none: "#71717a",
};

export default function DashboardPage() {
  const { boards, boardId, setBoardId, data, loading } = useDashboard();

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-background">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-border flex-shrink-0">
        <BarChart3 className="w-5 h-5 text-indigo-400" />
        <h1 className="text-foreground font-semibold text-lg">Dashboard</h1>
        <div className="ml-auto relative">
          <select
            value={boardId}
            onChange={(e) => setBoardId(e.target.value)}
            className="appearance-none bg-card border border-border rounded-md px-3 py-1.5 pr-8 text-xs text-foreground focus:outline-none focus:border-indigo-500 w-56 cursor-pointer"
          >
            {boards.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      <div className="flex-1 px-6 py-6 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))
          ) : (
            <>
              <StatCard label="Total Tasks" value={data?.totalTasks ?? 0} />
              <StatCard
                label="Completed This Month"
                value={data?.completedThisMonth ?? 0}
                sub="tasks done"
              />
              <StatCard
                label="Created This Month"
                value={data?.createdThisMonth ?? 0}
                sub="new tasks"
              />
              <StatCard
                label="Avg Lead Time"
                value={`${data?.avgLeadTimeDays ?? 0}d`}
                sub="from created to done"
              />
            </>
          )}
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* By Status */}
          <div className="bg-card border border-border rounded-xl p-4 col-span-1">
            <p className="text-muted-foreground text-xs font-medium mb-3">
              Tasks by Status
            </p>
            {loading ? (
              <Skeleton className="h-48" />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data?.byStatus ?? []} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: "#71717a", fontSize: 11 }}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#18181b",
                      border: "1px solid #27272a",
                      borderRadius: 8,
                    }}
                    labelStyle={{ color: "#a1a1aa" }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {(data?.byStatus ?? []).map((entry, i) => (
                      <Cell key={i} fill={entry.color ?? "#6366f1"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* By Priority */}
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-muted-foreground text-xs font-medium mb-3">
              Tasks by Priority
            </p>
            {loading ? (
              <Skeleton className="h-48" />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={data?.byPriority ?? []}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {(data?.byPriority ?? []).map((entry, i) => (
                      <Cell
                        key={i}
                        fill={PRIORITY_COLORS[entry.name] ?? "#6366f1"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#18181b",
                      border: "1px solid #27272a",
                      borderRadius: 8,
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(v) => (
                      <span style={{ color: "#a1a1aa", fontSize: 11 }}>
                        {v}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* By Type */}
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-muted-foreground text-xs font-medium mb-3">
              Tasks by Type
            </p>
            {loading ? (
              <Skeleton className="h-48" />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={data?.byType ?? []}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {(data?.byType ?? []).map((entry, i) => (
                      <Cell key={i} fill={entry.color ?? "#6366f1"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#18181b",
                      border: "1px solid #27272a",
                      borderRadius: 8,
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(v) => (
                      <span style={{ color: "#a1a1aa", fontSize: 11 }}>
                        {v}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Velocity chart */}
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-muted-foreground text-xs font-medium mb-3">
            Velocity (last 8 weeks)
          </p>
          {loading ? (
            <Skeleton className="h-48" />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={data?.velocity ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="week"
                  tick={{ fill: "#71717a", fontSize: 11 }}
                />
                <YAxis tick={{ fill: "#71717a", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: 8,
                  }}
                />
                <Legend
                  formatter={(v) => (
                    <span style={{ color: "#a1a1aa", fontSize: 11 }}>{v}</span>
                  )}
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ fill: "#6366f1", r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="created"
                  stroke="#71717a"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ fill: "#71717a", r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Activity feed */}
        {boardId && <ActivityFeed boardId={boardId} />}

        {/* Overdue tasks */}
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-muted-foreground text-xs font-medium mb-3 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
            Overdue Tasks
          </p>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : (data?.overdue ?? []).length === 0 ? (
            <p className="text-muted-foreground text-sm">No overdue tasks.</p>
          ) : (
            <div className="space-y-1">
              {data?.overdue.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      background: PRIORITY_COLORS[task.priority] ?? "#71717a",
                    }}
                  />
                  <span className="text-sm text-foreground flex-1 truncate">
                    {task.title}
                  </span>
                  <span className="text-xs text-red-400 flex-shrink-0">
                    {task.dueDate}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
