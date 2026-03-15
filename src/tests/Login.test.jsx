import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Login from "../pages/Login.jsx";

describe("Login page", () => {
  it("renders and validates password length", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const password = screen.getByLabelText("Password");
    await user.clear(password);
    await user.type(password, "123");

    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByText(/至少 6 位/)).toBeInTheDocument();
  });
});