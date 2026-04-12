import { describe, it, expect, beforeEach } from "vitest";
import { useBoardStore } from "./board-store";

describe("board-store", () => {
  beforeEach(() => {
    useBoardStore.setState({
      activeView: "board",
      selectedTaskId: null,
      isTaskDrawerOpen: false,
      isSearchOpen: false,
      selectedTaskIds: new Set(),
      isBulkMode: false,
      filters: {
        statuses: [],
        priorities: [],
        types: [],
        labelIds: [],
        assignees: [],
        search: "",
        hasSubtasks: null,
        hasDueDate: null,
      },
    });
  });

  it("sets active view", () => {
    useBoardStore.getState().setActiveView("graph");
    expect(useBoardStore.getState().activeView).toBe("graph");
  });

  it("opens task drawer on selectTask", () => {
    useBoardStore.getState().selectTask("task-1");
    const state = useBoardStore.getState();
    expect(state.selectedTaskId).toBe("task-1");
    expect(state.isTaskDrawerOpen).toBe(true);
  });

  it("closes task drawer and clears selection", () => {
    useBoardStore.getState().selectTask("task-1");
    useBoardStore.getState().closeTaskDrawer();
    const state = useBoardStore.getState();
    expect(state.selectedTaskId).toBeNull();
    expect(state.isTaskDrawerOpen).toBe(false);
  });

  it("updates filters partially", () => {
    useBoardStore
      .getState()
      .updateFilters({ search: "test", priorities: ["high"] });
    const { filters } = useBoardStore.getState();
    expect(filters.search).toBe("test");
    expect(filters.priorities).toEqual(["high"]);
    expect(filters.statuses).toEqual([]);
  });

  it("resets filters to defaults", () => {
    useBoardStore.getState().updateFilters({ search: "test" });
    useBoardStore.getState().resetFilters();
    expect(useBoardStore.getState().filters.search).toBe("");
  });

  it("opens and closes search", () => {
    useBoardStore.getState().openSearch();
    expect(useBoardStore.getState().isSearchOpen).toBe(true);
    useBoardStore.getState().closeSearch();
    expect(useBoardStore.getState().isSearchOpen).toBe(false);
  });

  it("toggles task selection and enters bulk mode", () => {
    useBoardStore.getState().toggleTaskSelection("task-1");
    expect(useBoardStore.getState().selectedTaskIds.has("task-1")).toBe(true);
    expect(useBoardStore.getState().isBulkMode).toBe(true);

    useBoardStore.getState().toggleTaskSelection("task-2");
    expect(useBoardStore.getState().selectedTaskIds.size).toBe(2);

    useBoardStore.getState().toggleTaskSelection("task-1");
    expect(useBoardStore.getState().selectedTaskIds.has("task-1")).toBe(false);
    expect(useBoardStore.getState().selectedTaskIds.size).toBe(1);
  });

  it("selects all tasks", () => {
    useBoardStore.getState().selectAllTasks(["a", "b", "c"]);
    expect(useBoardStore.getState().selectedTaskIds.size).toBe(3);
    expect(useBoardStore.getState().isBulkMode).toBe(true);
  });

  it("clears selection and exits bulk mode", () => {
    useBoardStore.getState().toggleTaskSelection("task-1");
    useBoardStore.getState().clearSelection();
    expect(useBoardStore.getState().selectedTaskIds.size).toBe(0);
    expect(useBoardStore.getState().isBulkMode).toBe(false);
  });
});
