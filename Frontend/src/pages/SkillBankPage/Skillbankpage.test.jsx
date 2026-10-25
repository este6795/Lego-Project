// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../../hooks/useAuth";
import { server } from "../../test/setup";
import { fakeSkillsApi } from "../../test/utils/fakeSkillsApi";
import SkillBankPage from "./Skillbankpage";

vi.mock("../../hooks/useAuth", () => ({ useAuth: vi.fn() }));

function renderPage() {
  return render(
    <MemoryRouter>
      <SkillBankPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useAuth.mockReturnValue({ user: { email: "me@example.com" }, loading: false });
});

afterEach(cleanup);

describe("SkillBankPage", () => {
  it("asks logged-out visitors to log in and doesn't request skills", () => {
    useAuth.mockReturnValue({ user: null, loading: false });
    let requested = false;
    server.use(
      http.get("*/api/profile/skills/", () => {
        requested = true;
        return HttpResponse.json([]);
      }),
    );

    renderPage();

    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
    expect(requested).toBe(false);
  });

  it("shows loading, then the saved skills sorted by name", async () => {
    server.use(
      ...fakeSkillsApi([
        { id: 2, name: "sql" },
        { id: 1, name: "Python" },
        { id: 3, name: "Docker" },
      ]).handlers,
    );

    renderPage();

    expect(screen.getByText(/loading your skills/i)).toBeInTheDocument();
    await screen.findByText("Docker");
    const names = screen.getAllByRole("listitem").map((li) => li.textContent);
    expect(names).toEqual(["Docker×", "Python×", "sql×"]);
  });

  it("shows an empty state for a new user", async () => {
    server.use(...fakeSkillsApi([]).handlers);

    renderPage();

    expect(await screen.findByText(/haven't saved any skills yet/i)).toBeInTheDocument();
  });

  it("shows an error if the skills can't be loaded", async () => {
    server.use(
      http.get("*/api/profile/skills/", () =>
        HttpResponse.json({ error: "Server exploded" }, { status: 500 }),
      ),
    );

    renderPage();

    expect(await screen.findByText(/could not load your skills/i)).toHaveTextContent(
      "Server exploded",
    );
  });

  it("adds a skill to the list", async () => {
    const user = userEvent.setup();
    const api = fakeSkillsApi([{ id: 1, name: "Python" }]);
    server.use(...api.handlers);

    renderPage();
    await screen.findByText("Python");
    await user.type(screen.getByLabelText("Add a skill"), "Airflow{Enter}");

    expect(await screen.findByText("Airflow")).toBeInTheDocument();
    expect(screen.getByText("2 skills")).toBeInTheDocument();
    expect(api.all().map((s) => s.name)).toEqual(["Airflow", "Python"]);
  });

  it("shows the backend's message if adding fails", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("*/api/profile/skills/", () => HttpResponse.json([])),
      http.post("*/api/profile/skills/", () =>
        HttpResponse.json({ error: "You can save up to 200 skills." }, { status: 400 }),
      ),
    );

    renderPage();
    await screen.findByText(/haven't saved any skills yet/i);
    await user.type(screen.getByLabelText("Add a skill"), "Rust{Enter}");

    expect(await screen.findByRole("alert")).toHaveTextContent("You can save up to 200 skills.");
  });

  it("removes a skill from the list", async () => {
    const user = userEvent.setup();
    const api = fakeSkillsApi([
      { id: 1, name: "Python" },
      { id: 2, name: "SQL" },
    ]);
    server.use(...api.handlers);

    renderPage();
    await screen.findByText("SQL");
    await user.click(screen.getByRole("button", { name: "Remove SQL" }));

    await vi.waitFor(() => expect(screen.queryByText("SQL")).not.toBeInTheDocument());
    expect(screen.getByText("Python")).toBeInTheDocument();
    expect(api.all()).toEqual([{ id: 1, name: "Python" }]);
  });

  it("keeps the skill in the list if removing fails", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("*/api/profile/skills/", () => HttpResponse.json([{ id: 1, name: "Python" }])),
      http.delete("*/api/profile/skills/:id/", () =>
        HttpResponse.json({ error: "Skill not found" }, { status: 404 }),
      ),
    );

    renderPage();
    await screen.findByText("Python");
    await user.click(screen.getByRole("button", { name: "Remove Python" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Skill not found");
    expect(screen.getByText("Python")).toBeInTheDocument();
  });
});