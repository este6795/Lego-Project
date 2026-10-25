// @vitest-environment jsdom
import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it } from "vitest";
import { server } from "../../test/setup";
import { fakeSkillsApi } from "../../test/utils/fakeSkillsApi";
import NewSkillsCard from "./NewSkillsCard";

afterEach(cleanup);

// For "renders nothing" checks: give the profile request time to finish.
async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
}

async function openModal(user) {
  await user.click(await screen.findByRole("button", { name: "Save to profile" }));
  return screen.getByRole("dialog");
}

describe("NewSkillsCard", () => {
  it("lists only the matched skills that aren't in the profile yet, ignoring case", async () => {
    server.use(...fakeSkillsApi([{ id: 1, name: "Python" }]).handlers);

    render(<NewSkillsCard matchedSkills={["python", "SQL", "Docker"]} />);

    const heading = await screen.findByRole("heading", { name: "New skills" });
    const card = heading.closest("section");
    expect(within(card).getByText("SQL")).toBeInTheDocument();
    expect(within(card).getByText("Docker")).toBeInTheDocument();
    expect(within(card).queryByText(/^python$/i)).not.toBeInTheDocument();
  });

  it("shows a repeated skill once", async () => {
    server.use(...fakeSkillsApi([]).handlers);

    render(<NewSkillsCard matchedSkills={["SQL", "sql", " SQL "]} />);

    await screen.findByText("SQL");
    expect(screen.getAllByText(/^sql$/i)).toHaveLength(1);
  });

  it("renders nothing when every matched skill is already saved", async () => {
    server.use(...fakeSkillsApi([{ id: 1, name: "Python" }]).handlers);

    const { container } = render(<NewSkillsCard matchedSkills={["python"]} />);
    await settle();

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when there are no matched skills", async () => {
    server.use(...fakeSkillsApi([]).handlers);

    const { container } = render(<NewSkillsCard matchedSkills={[]} />);
    await settle();

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing if the profile can't be loaded", async () => {
    server.use(
      http.get("*/api/profile/skills/", () =>
        HttpResponse.json({ error: "Server exploded" }, { status: 500 }),
      ),
    );

    const { container } = render(<NewSkillsCard matchedSkills={["SQL"]} />);
    await settle();

    expect(container).toBeEmptyDOMElement();
  });

  it("opens a confirmation with every new skill ticked", async () => {
    const user = userEvent.setup();
    server.use(...fakeSkillsApi([]).handlers);
    render(<NewSkillsCard matchedSkills={["SQL", "Docker"]} />);

    const dialog = await openModal(user);

    expect(within(dialog).getByRole("checkbox", { name: "SQL" })).toBeChecked();
    expect(within(dialog).getByRole("checkbox", { name: "Docker" })).toBeChecked();
  });

  it("saves the skills when confirmed, then shows a message instead of the list", async () => {
    const user = userEvent.setup();
    const api = fakeSkillsApi([{ id: 1, name: "Python" }]);
    server.use(...api.handlers);
    render(<NewSkillsCard matchedSkills={["Python", "SQL", "Docker"]} />);

    await openModal(user);
    await user.click(screen.getByRole("button", { name: "Save 2 skills" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Saved 2 skills to your profile.");
    expect(api.all().map((skill) => skill.name)).toEqual(["Docker", "Python", "SQL"]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save to profile" })).not.toBeInTheDocument();
    expect(screen.queryByText("SQL")).not.toBeInTheDocument();
  });

  it("leaves out skills the user unticks", async () => {
    const user = userEvent.setup();
    const api = fakeSkillsApi([]);
    server.use(...api.handlers);
    render(<NewSkillsCard matchedSkills={["SQL", "Docker"]} />);

    await openModal(user);
    await user.click(screen.getByRole("checkbox", { name: "Docker" }));
    await user.click(screen.getByRole("button", { name: "Save 1 skill" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Saved 1 skill to your profile.");
    expect(api.all().map((skill) => skill.name)).toEqual(["SQL"]);
  });

  it("saves an extra skill the user types in the confirmation", async () => {
    const user = userEvent.setup();
    const api = fakeSkillsApi([]);
    server.use(...api.handlers);
    render(<NewSkillsCard matchedSkills={["SQL"]} />);

    await openModal(user);
    await user.type(screen.getByLabelText("Add a skill I have"), "Airflow{Enter}");
    await user.click(screen.getByRole("button", { name: "Save 2 skills" }));

    expect(await screen.findByRole("status")).toBeInTheDocument();
    expect(api.all().map((skill) => skill.name)).toEqual(["Airflow", "SQL"]);
  });

  it("saves nothing when the user cancels", async () => {
    const user = userEvent.setup();
    const api = fakeSkillsApi([]);
    server.use(...api.handlers);
    render(<NewSkillsCard matchedSkills={["SQL"]} />);

    await openModal(user);
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("SQL")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save to profile" })).toBeInTheDocument();
    expect(api.all()).toEqual([]);
  });

  it("mentions skills the backend skipped", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("*/api/profile/skills/", () => HttpResponse.json([])),
      http.post("*/api/profile/skills/import/", () =>
        HttpResponse.json({
          added: [{ id: 9, name: "SQL" }],
          skipped: [{ name: "Python", reason: "duplicate" }],
        }),
      ),
    );
    render(<NewSkillsCard matchedSkills={["Python", "SQL"]} />);

    await openModal(user);
    await user.click(screen.getByRole("button", { name: "Save 2 skills" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Saved 1 skill to your profile. 1 skipped.",
    );
  });

  it("says so when everything was already saved elsewhere", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("*/api/profile/skills/", () => HttpResponse.json([])),
      http.post("*/api/profile/skills/import/", () =>
        HttpResponse.json({
          added: [],
          skipped: [{ name: "SQL", reason: "duplicate" }],
        }),
      ),
    );
    render(<NewSkillsCard matchedSkills={["SQL"]} />);

    await openModal(user);
    await user.click(screen.getByRole("button", { name: "Save 1 skill" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Those skills were already in your profile.",
    );
  });

  it("keeps the confirmation open with the backend's message if saving fails", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("*/api/profile/skills/", () => HttpResponse.json([])),
      http.post("*/api/profile/skills/import/", () =>
        HttpResponse.json({ error: "You can add up to 100 skills at a time." }, { status: 400 }),
      ),
    );
    render(<NewSkillsCard matchedSkills={["SQL"]} />);

    await openModal(user);
    await user.click(screen.getByRole("button", { name: "Save 1 skill" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("You can add up to 100 skills at a time.");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});