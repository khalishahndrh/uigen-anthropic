import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge } from "../ToolCallBadge";
import type { ToolInvocation } from "ai";

afterEach(() => cleanup());

function makeInvocation(
  toolName: string,
  args: Record<string, unknown>,
  state: "call" | "result" = "result",
  result: unknown = "ok"
): ToolInvocation {
  if (state === "result") {
    return { state: "result", toolCallId: "1", toolName, args, result } as ToolInvocation;
  }
  return { state: "call", toolCallId: "1", toolName, args } as ToolInvocation;
}

// --- str_replace_editor labels ---

test("shows 'Creating' for str_replace_editor create", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/App.jsx" })}
    />
  );
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
});

test("shows 'Editing' for str_replace_editor str_replace", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("str_replace_editor", { command: "str_replace", path: "/Card.jsx" })}
    />
  );
  expect(screen.getByText("Editing Card.jsx")).toBeDefined();
});

test("shows 'Editing' for str_replace_editor insert", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("str_replace_editor", { command: "insert", path: "/Card.jsx" })}
    />
  );
  expect(screen.getByText("Editing Card.jsx")).toBeDefined();
});

test("shows 'Viewing' for str_replace_editor view", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("str_replace_editor", { command: "view", path: "/Card.jsx" })}
    />
  );
  expect(screen.getByText("Viewing Card.jsx")).toBeDefined();
});

test("shows 'Undoing edit in' for str_replace_editor undo_edit", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("str_replace_editor", { command: "undo_edit", path: "/Card.jsx" })}
    />
  );
  expect(screen.getByText("Undoing edit in Card.jsx")).toBeDefined();
});

// --- file_manager labels ---

test("shows 'Renaming' for file_manager rename", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("file_manager", { command: "rename", path: "/Card.jsx", new_path: "/NewCard.jsx" })}
    />
  );
  expect(screen.getByText("Renaming Card.jsx")).toBeDefined();
});

test("shows 'Deleting' for file_manager delete", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("file_manager", { command: "delete", path: "/Card.jsx" })}
    />
  );
  expect(screen.getByText("Deleting Card.jsx")).toBeDefined();
});

// --- Unknown tool fallback ---

test("falls back to raw toolName for unknown tool", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("some_unknown_tool", {})}
    />
  );
  expect(screen.getByText("some_unknown_tool")).toBeDefined();
});

// --- Status indicator ---

test("shows green dot when completed", () => {
  const { container } = render(
    <ToolCallBadge
      toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/App.jsx" }, "result", "ok")}
    />
  );
  expect(container.querySelector(".bg-emerald-500")).toBeTruthy();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("shows spinner when in progress", () => {
  const { container } = render(
    <ToolCallBadge
      toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/App.jsx" }, "call")}
    />
  );
  expect(container.querySelector(".animate-spin")).toBeTruthy();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});
