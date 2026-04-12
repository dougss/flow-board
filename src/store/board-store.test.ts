import { describe, it, expect, beforeEach } from "vitest";
import { useBoardStore } from "./board-store";

describe("board-store", () => {
  beforeEach(() => {
    useBoardStore.setState({
      activeView: "board",
      selectedTaskId: null,
      isTaskDrawerOpen: false,
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
});
