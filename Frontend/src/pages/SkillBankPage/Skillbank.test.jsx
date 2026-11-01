// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import SkillBank from "./Skillbank";

const SKILLS = [
  { id: 1, name: "Python" },
  { id: 2, name: "SQL" },
];

afterEach(cleanup);

describe("SkillBank", () => {
  it("shows an empty state when there are no skills", () => {
    render(<SkillBank skills={[]} onAdd={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText(/haven't saved any skills yet/i)).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("lists each skill with a count", () => {
    render(<SkillBank skills={SKILLS} onAdd={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText("Python")).toBeInTheDocument();
    expect(screen.getByText("SQL")).toBeInTheDocument();
    expect(screen.getByText("2 skills")).toBeInTheDocument();
  });

  it("uses the singular for one skill", () => {
    render(<SkillBank skills={[SKILLS[0]]} onAdd={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText("1 skill")).toBeInTheDocument();
  });

  it("adds a trimmed skill and clears the box", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn().mockResolvedValue({});
    render(<SkillBank skills={SKILLS} onAdd={onAdd} onDelete={vi.fn()} />);

    const input = screen.getByLabelText("Add a skill");
    await user.type(input, "   Machine    Learning  ");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(onAdd).toHaveBeenCalledWith("Machine Learning");
    expect(input).toHaveValue("");
  });

  it("adds a skill when Enter is pressed", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn().mockResolvedValue({});
    render(<SkillBank skills={[]} onAdd={onAdd} onDelete={vi.fn()} />);

    await user.type(screen.getByLabelText("Add a skill"), "Docker{Enter}");

    expect(onAdd).toHaveBeenCalledWith("Docker");
  });

  it("keeps the Add button disabled while the box is blank", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<SkillBank skills={[]} onAdd={onAdd} onDelete={vi.fn()} />);

    const button = screen.getByRole("button", { name: "Add" });
    expect(button).toBeDisabled();

    await user.type(screen.getByLabelText("Add a skill"), "   {Enter}");

    expect(onAdd).not.toHaveBeenCalled();
  });

  it("rejects a duplicate without calling the backend, ignoring case", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<SkillBank skills={SKILLS} onAdd={onAdd} onDelete={vi.fn()} />);

    await user.type(screen.getByLabelText("Add a skill"), "python{Enter}");

    expect(onAdd).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "python is already in your skills.",
    );
  });

  it("shows the backend's error and keeps what the user typed", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn().mockRejectedValue(new Error("You can save up to 200 skills."));
    render(<SkillBank skills={[]} onAdd={onAdd} onDelete={vi.fn()} />);

    const input = screen.getByLabelText("Add a skill");
    await user.type(input, "Rust{Enter}");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "You can save up to 200 skills.",
    );
    expect(input).toHaveValue("Rust");
  });

  it("limits the input to 60 characters", () => {
    render(<SkillBank skills={[]} onAdd={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByLabelText("Add a skill")).toHaveAttribute("maxlength", "60");
  });

  it("removes a skill when its × is clicked", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockResolvedValue();
    render(<SkillBank skills={SKILLS} onAdd={vi.fn()} onDelete={onDelete} />);

    await user.click(screen.getByRole("button", { name: "Remove SQL" }));

    expect(onDelete).toHaveBeenCalledWith(2);
  });

  it("shows an error if removing fails", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockRejectedValue(new Error("Skill not found"));
    render(<SkillBank skills={SKILLS} onAdd={vi.fn()} onDelete={onDelete} />);

    await user.click(screen.getByRole("button", { name: "Remove Python" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Skill not found");
  });
});