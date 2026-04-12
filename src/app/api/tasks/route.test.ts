import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { db } from "@/lib/db";

let workspaceId: string;
let boardId: string;
let columnId: string;

async function callGET(params: Record<string, string> = {}) {
  const { GET } = await import("./route");
  const qs = new URLSearchParams(params).toString();
  const req = new Request(`http://localhost/api/tasks${qs ? `?${qs}` : ""}`);
  return GET(req);
}

async function callPOST(body: Record<string, unknown>) {
  const { POST } = await import("./route");
  const req = new Request("http://localhost/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return POST(req);
}

beforeEach(async () => {
  const ws = await db.workspace.create({ data: { name: "Test WS" } });
  workspaceId = ws.id;
  const proj = await db.project.create({
    data: { name: "Test Project", workspaceId },
  });
  const board = await db.board.create({
    data: { name: "Test Board", projectId: proj.id },
  });
  boardId = board.id;
  const col = await db.column.create({
    data: { name: "To Do", boardId, position: 0 },
  });
  columnId = col.id;
});

afterEach(async () => {
  await db.activity.deleteMany();
  await db.taskLabel.deleteMany();
  await db.taskDependency.deleteMany();
  await db.comment.deleteMany();
  await db.task.deleteMany();
  await db.column.deleteMany();
  await db.board.deleteMany();
  await db.project.deleteMany();
  await db.label.deleteMany();
  await db.workspace.deleteMany();
});

describe("POST /api/tasks", () => {
  it("creates a task with valid data", async () => {
    const res = await callPOST({
      boardId,
      columnId,
      title: "Test task",
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.title).toBe("Test task");
    expect(body.status).toBe("To Do");
    expect(body.type).toBe("task");
    expect(body.priority).toBe("none");
  });

  it("rejects missing title", async () => {
    const res = await callPOST({ boardId, columnId, title: "" });
    expect(res.status).toBe(400);
  });

  it("rejects missing boardId", async () => {
    const res = await callPOST({ columnId, title: "Test" });
    expect(res.status).toBe(400);
  });

  it("returns 404 for invalid columnId", async () => {
    const res = await callPOST({
      boardId,
      columnId: "nonexistent",
      title: "Test",
    });
    expect(res.status).toBe(404);
  });

  it("creates task with all optional fields", async () => {
    const res = await callPOST({
      boardId,
      columnId,
      title: "Full task",
      description: "A description",
      type: "bug",
      priority: "high",
      storyPoints: 5,
      assignedTo: "Douglas",
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.type).toBe("bug");
    expect(body.priority).toBe("high");
    expect(body.storyPoints).toBe(5);
    expect(body.assignedTo).toBe("Douglas");
  });
});

describe("GET /api/tasks", () => {
  beforeEach(async () => {
    await db.task.createMany({
      data: [
        {
          boardId,
          columnId,
          title: "Task A",
          status: "To Do",
          type: "task",
          priority: "high",
          position: 0,
        },
        {
          boardId,
          columnId,
          title: "Task B",
          status: "To Do",
          type: "bug",
          priority: "low",
          position: 1,
        },
      ],
    });
  });

  it("returns all tasks without filters", async () => {
    const res = await callGET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
  });

  it("filters by boardId", async () => {
    const res = await callGET({ boardId });
    const body = await res.json();
    expect(body).toHaveLength(2);
  });

  it("filters by priority", async () => {
    const res = await callGET({ priority: "high" });
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].title).toBe("Task A");
  });

  it("filters by type", async () => {
    const res = await callGET({ type: "bug" });
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].title).toBe("Task B");
  });

  it("searches by title", async () => {
    const res = await callGET({ search: "Task A" });
    const body = await res.json();
    expect(body).toHaveLength(1);
  });
});
