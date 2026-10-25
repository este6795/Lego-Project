// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../../../hooks/useAuth";
import UserMenu from "./UserMenu";

vi.mock("../../../hooks/useAuth", () => ({ useAuth: vi.fn() }));

afterEach(cleanup);

function renderMenu() {
  useAuth.mockReturnValue({ user: { email: "me@example.com" }, logout: vi.fn() });
  return render(
    <MemoryRouter>
      <UserMenu />
    </MemoryRouter>,
  );
}

describe("UserMenu", () => {
  it("renders nothing when logged out", () => {
    useAuth.mockReturnValue({ user: null, logout: vi.fn() });
    const { container } = render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("opens with Skills, Settings and Log out", async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole("button", { name: "Account menu" }));

    expect(screen.getByRole("menuitem", { name: "Skills" })).toHaveAttribute("href", "/skills");
    expect(screen.getByRole("menuitem", { name: "Settings" })).toHaveAttribute("href", "/profile");
    expect(screen.getByRole("menuitem", { name: "Log out" })).toBeInTheDocument();
  });

  it("closes after choosing Skills", async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole("button", { name: "Account menu" }));
    await user.click(screen.getByRole("menuitem", { name: "Skills" }));

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});