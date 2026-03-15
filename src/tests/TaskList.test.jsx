import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TaskList from "../components/TaskList.jsx";

describe("TaskList component", () => {
  const mockTasks = [
    { id: "1", title: "Task 1", done: false, createdAt: Date.now() },
    { id: "2", title: "Task 2", done: true, createdAt: Date.now() }
  ];

  it("renders tasks correctly", () => {
    render(
      <TaskList 
        tasks={mockTasks} 
        onToggle={() => {}} 
        onDelete={() => {}}
      />
    );

    expect(screen.getByText("Task 1")).toBeInTheDocument();
    expect(screen.getByText("Task 2")).toBeInTheDocument();
    expect(screen.getByDisplayValue(false)).toBeInTheDocument();
    expect(screen.getByDisplayValue(true)).toBeInTheDocument();
  });

  it("calls onToggle when checkbox is clicked", async () => {
    const user = userEvent.setup();
    const mockOnToggle = jest.fn();

    render(
      <TaskList 
        tasks={mockTasks} 
        onToggle={mockOnToggle} 
        onDelete={() => {}}
      />
    );

    const checkbox = screen.getByDisplayValue(false);
    await user.click(checkbox);

    expect(mockOnToggle).toHaveBeenCalledWith("1");
  });

  it("calls onDelete when delete button is clicked", async () => {
    const user = userEvent.setup();
    const mockOnDelete = jest.fn();

    render(
      <TaskList 
        tasks={mockTasks} 
        onToggle={() => {}} 
        onDelete={mockOnDelete}
      />
    );

    const deleteButtons = screen.getAllByText("Delete");
    await user.click(deleteButtons[0]);

    expect(mockOnDelete).toHaveBeenCalledWith("1");
  });
});
